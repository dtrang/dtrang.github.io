var app = angular.module('mortgageApp', []);

app.controller('mortgageCtrl', function ($scope) {
  $scope.loanOption = 1;

  $scope.scenarios = [
    {
      purchaseValue: 1600000,
      lvrValue: 80,
      purchaseExpenses: 3000,
      loanTerm: 30,
      interestRate: 6,
      savingsValue: 820000,
      monthlyExpense: 10350,
      monthlyIncome: 24000,
    },
    {
      purchaseValue: 1800000,
      lvrValue: 80,
      purchaseExpenses: 3000,
      loanTerm: 30,
      interestRate: 6,
      savingsValue: 820000,
      monthlyExpense: 10350,
      monthlyIncome: 24000,
    },
  ];

  $scope.setScenario = function (idx) {
    const scenario = $scope.scenarios[idx];
    [
      'purchaseValue',
      'lvrValue',
      'purchaseExpenses',
      'loanTerm',
      'interestRate',
      'savingsValue',
      'monthlyExpense',
      'monthlyIncome',
    ].forEach((key) => {
      $scope[key] = scenario[key];
    });

    $scope.stampDuty = calculateStampDuty(scenario.purchaseValue);
    $scope.downPaymentAmount = calcDownPaymentAmount(
      scenario.purchaseValue,
      scenario.lvrValue
    );
    $scope.loanBalance = calcLoanBalance(
      scenario.purchaseValue,
      scenario.lvrValue
    );
    $scope.offsetBalance = calcInitialOffsetBalance(
      $scope.savingsValue,
      $scope.stampDuty,
      $scope.purchaseExpenses,
      $scope.downPaymentAmount
    );
    $scope.monthlyDataArray = [];
    $scope.monthyRepayment = $scope.calcMonthlyRepayment();
  };

  $scope.$watch('purchaseValue', function (newValue, oldValue) {
    $scope.loanBalance = calcLoanBalance(newValue, $scope.lvrValue);
    $scope.downPaymentAmount = calcDownPaymentAmount(newValue, $scope.lvrValue);
    var stampDuty = calculateStampDuty(newValue);
    $scope.stampDuty = stampDuty;
    $scope.offsetBalance = calcInitialOffsetBalance(
      $scope.savingsValue,
      stampDuty,
      $scope.purchaseExpenses,
      $scope.downPaymentAmount
    );
  });

  $scope.$watch('lvrValue', function (newValue, oldValue) {
    $scope.loanBalance = calcLoanBalance($scope.purchaseValue, newValue);
    $scope.downPaymentAmount = calcDownPaymentAmount(
      $scope.purchaseValue,
      newValue
    );
    $scope.offsetBalance = calcInitialOffsetBalance(
      $scope.savingsValue,
      $scope.stampDuty,
      $scope.purchaseExpenses,
      $scope.downPaymentAmount
    );
  });

  $scope.$watch('purchaseExpenses', function (newValue, oldValue) {
    $scope.offsetBalance = calcInitialOffsetBalance(
      $scope.savingsValue,
      $scope.stampDuty,
      newValue,
      $scope.downPaymentAmount
    );
  });

  $scope.$watchGroup(
    ['loanBalance', 'loanTerm', 'interestRate'],
    function (newValues, oldValues) {
      $scope.monthyRepayment = $scope.calcMonthlyRepayment();
    }
  );

  $scope.$watch('savingsValue', function (newValue, oldValue) {
    $scope.offsetBalance = calcInitialOffsetBalance(
      newValue,
      $scope.stampDuty,
      $scope.purchaseExpenses,
      $scope.downPaymentAmount
    );
  });

  const calcInitialOffsetBalance = (savingsAmount, ...expenses) => {
    return savingsAmount - expenses.reduce((a, b) => a + b, 0);
  };

  const calcDownPaymentAmount = (purchaseValue, lvrValue) => {
    return purchaseValue * (1 - lvrValue / 100);
  };

  const calcLoanBalance = (purchaseValue, lvrValue) => {
    return purchaseValue * (lvrValue / 100);
  };

  $scope.calcMonthlyRepayment = function () {
    return calcMonthlyRepayment(
      $scope.loanBalance,
      $scope.loanTerm,
      $scope.interestRate
    );
  };

  $scope.calculate = function () {
    $scope.loanStartDate = moment(getLastDayOfMonth(new Date()))
      .add(1, 'days')
      .toDate();

    const results = calculatePrincipalAndInterest(
      $scope.loanBalance,
      $scope.loanTerm,
      $scope.interestRate,
      $scope.loanStartDate,
      $scope.offsetBalance,
      $scope.monthlyIncome,
      $scope.monthlyExpense,
      $scope.monthyRepayment,
      $scope.loanOption === 1
    );

    $scope.accruedOffsetBalance = results.accruedOffsetBalance;
    $scope.monthlyDataArray = results.monthlyDataArray;
    $scope.accruedInterestBalance = results.accruedInterest;
    $scope.runningLoanBalance = results.runningLoanBalance;
  };

  function calcMonthlyRepayment(loanAmount, loanYears, annualInterestRate) {
    const monthlyInterestRate = annualInterestRate / 12 / 100;
    const loanMonths = loanYears * 12;
    return Math.round(
      (loanAmount * monthlyInterestRate) /
        (1 - Math.pow(1 + monthlyInterestRate, -loanMonths))
    );
  }

  function calculateLengthOfRepayment(
    loanAmount,
    interestRate,
    monthlyRepayment
  ) {
    const monthlyInterestRate = interestRate / 12 / 100;
    return Math.round(
      Math.log(
        monthlyRepayment / (monthlyRepayment - monthlyInterestRate * loanAmount)
      ) / Math.log(1 + monthlyInterestRate)
    );
  }

  function calcDailyInterest(
    currentLoanBalance,
    annualInterestRate,
    offsetAccountBalance
  ) {
    return (
      ((currentLoanBalance - offsetAccountBalance) * annualInterestRate) / 365
    );
  }

  function calculatePrincipalAndInterest(
    loanBalance,
    loanTerm,
    interestRate,
    loanStartDate,
    offsetAccountStartBalance,
    monthlyIncome,
    monthlyExpenses,
    monthlyRepayment,
    isPrincipalAndInterest = true
  ) {
    const annualInterestRate = interestRate / 100;

    var runningLoanBalance = loanBalance;
    var accruedOffsetBalance = offsetAccountStartBalance;
    var accruedInterest = 0.0;
    var monthlyAccruedInterest = 0.0;
    var date = loanStartDate;
    const loanEndDate = moment(date).add(loanTerm, 'years').toDate();
    var monthlyDataArray = [];

    while (
      runningLoanBalance >= accruedOffsetBalance &&
      accruedOffsetBalance >= 0 &&
      !moment(date).isAfter(loanEndDate)
    ) {
      date = moment(date).add(1, 'days').toDate();

      monthlyAccruedInterest += calcDailyInterest(
        runningLoanBalance,
        annualInterestRate,
        isPrincipalAndInterest ? accruedOffsetBalance : 0
      );

      // Finish calculation if current date is the end of the month
      if (format(getLastDayOfMonth(date)) === format(date)) {
        // Remaining money left after everything
        var remainingMoney = monthlyIncome - monthlyExpenses;

        // Running loan balance
        if (isPrincipalAndInterest) {
          runningLoanBalance += monthlyAccruedInterest - monthlyRepayment;
          remainingMoney -= monthlyRepayment;
        } else {
          remainingMoney -= monthlyAccruedInterest;
        }

        // Update accrued amounts
        accruedOffsetBalance += remainingMoney;
        accruedInterest += monthlyAccruedInterest;

        // Push data of the month to the array
        monthlyDataArray.push({
          date: format(date),
          interestPaid: monthlyAccruedInterest,
          totalOffset: accruedOffsetBalance,
          totalInterest: accruedInterest,
          loanBalance: runningLoanBalance,
        });

        // Reset monthly accrued interest
        monthlyAccruedInterest = 0;
      }
    }

    return {
      monthlyDataArray,
      accruedInterest,
      accruedOffsetBalance,
      runningLoanBalance,
    };
  }

  function getLastDayOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  function format(date) {
    return moment(date).format('DD MMM YYYY');
  }

  function calculateStampDuty(propertyValue) {
    if (propertyValue <= 16000) {
      return Math.max(10, propertyValue * 0.0125);
    } else if (propertyValue <= 35000) {
      return 200 + (propertyValue - 16000) * 0.015;
    } else if (propertyValue <= 93000) {
      return 485 + (propertyValue - 35000) * 0.0175;
    } else if (propertyValue <= 351000) {
      return 1500 + (propertyValue - 93000) * 0.035;
    } else if (propertyValue <= 1168000) {
      return 10530 + (propertyValue - 351000) * 0.045;
    } else {
      return 47295 + (propertyValue - 1168000) * 0.055;
    }
  }

  $scope.setScenario(0);
});

// Define the custom directive to format the number
app.directive('numberFormat', function () {
  return {
    require: 'ngModel',
    link: function (scope, element, attrs, ngModelController) {
      // Function to add commas
      function formatNumberWithCommas(value) {
        if (!value) return value;
        return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      }

      // Function to remove commas before parsing
      function removeCommas(value) {
        return value ? value.replace(/,/g, '') : value;
      }

      // Render the formatted value in the input field
      ngModelController.$formatters.push(function (value) {
        if (!value) return;
        return formatNumberWithCommas(value);
      });

      // Parse the user's input by removing commas
      ngModelController.$parsers.push(function (value) {
        if (!value) return;
        var cleanValue = removeCommas(value);
        if (!isNaN(cleanValue)) {
          return cleanValue;
        }
        return value;
      });

      // Watch for changes and update the view
      element.on('input', function () {
        var formattedValue = formatNumberWithCommas(
          removeCommas(element.val())
        );
        element.val(formattedValue);
      });
    },
  };
});
