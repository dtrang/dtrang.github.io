var app = angular.module('mortgageApp', []);

app.controller('mortgageCtrl', function ($scope) {
  $scope.loanOption = 1;

  $scope.scenarios = [
    {
      purchaseValue: 1200000,
      lvrValue: 100,
      purchaseExpenses: 3000,
      loanBalance: 1200000,
      loanTerm: 30,
      interestRate: 6.25,
      savingsValue: 300000,
      monthlyExpense: 8000,
      monthlyIncome: 24000,
      offsetBalance: 200000,
    },
    {
      purchaseValue: 1500000,
      lvrValue: 100,
      purchaseExpenses: 3000,
      loanBalance: 1500000,
      loanTerm: 30,
      interestRate: 6.25,
      savingsValue: 300000,
      monthlyExpense: 8000,
      monthlyIncome: 24000,
      offsetBalance: 200000,
    },
  ];

  $scope.setScenario = function (idx) {
    var scenario = $scope.scenarios[idx];
    $scope.purchaseValue = scenario.purchaseValue;
    $scope.lvrValue = scenario.lvrValue;
    $scope.stampDuty = calculateStampDuty(scenario.purchaseValue);
    $scope.purchaseExpenses = scenario.purchaseExpenses;

    $scope.loanBalance = scenario.purchaseValue * (scenario.lvrValue / 100);
    $scope.loanTerm = scenario.loanTerm;
    $scope.interestRate = scenario.interestRate;

    $scope.savingsValue = scenario.savingsValue;
    $scope.monthlyExpense = scenario.monthlyExpense;
    $scope.monthlyIncome = scenario.monthlyIncome;
    $scope.offsetBalance =
      $scope.savingsValue - $scope.stampDuty - $scope.purchaseExpenses;
    $scope.monthlyDataArray = [];
    $scope.monthyRepayment = $scope.calcMonthlyRepayment();
  };

  $scope.$watch('purchaseValue', function (newValue, oldValue) {
    $scope.loanBalance = newValue * ($scope.lvrValue / 100);
    $scope.stampDuty = calculateStampDuty(newValue);
  });

  $scope.$watch('lvrValue', function (newValue, oldValue) {
    $scope.loanBalance = $scope.purchaseValue * (newValue / 100);
  });

  $scope.$watch('loanBalance', function (newValue, oldValue) {
    $scope.monthyRepayment = $scope.calcMonthlyRepayment();
  });

  $scope.$watch('loanTerm', function (newValue, oldValue) {
    $scope.monthyRepayment = $scope.calcMonthlyRepayment();
  });

  $scope.$watch('interestRate', function (newValue, oldValue) {
    $scope.monthyRepayment = $scope.calcMonthlyRepayment();
  });

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

  function calculateMonthlyRepayment(loanAmount, years, interestRate) {
    const monthlyInterestRate = interestRate / 12 / 100;
    const loanMonths = years * 12;
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
        // Running loan balance
        if (isPrincipalAndInterest) {
          runningLoanBalance += monthlyAccruedInterest - monthlyRepayment;
        }

        // Remaining money left after everything
        var remainingMoney = monthlyIncome - monthlyExpenses;

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
