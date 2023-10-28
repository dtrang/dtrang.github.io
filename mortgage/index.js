var app = angular.module('mortgageApp', []);

app.controller('mortgageCtrl', function ($scope) {
  $scope.loanOption = 1;

  $scope.scenarios = [
    {
      loanBalance: 500000,
      loanTerm: 30,
      interestRate: 5.8,
      monthlyExpense: 1500,
      monthlyIncome: 5000,
      offsetBalance: 10000,
    },
    {
      loanBalance: 1000000,
      loanTerm: 30,
      interestRate: 5.8,
      monthlyExpense: 4000,
      monthlyIncome: 10000,
      offsetBalance: 20000,
    },
    {
      loanBalance: 1500000,
      loanTerm: 30,
      interestRate: 5.8,
      monthlyExpense: 8000,
      monthlyIncome: 15000,
      offsetBalance: 0,
    },
    {
      loanBalance: 2000000,
      loanTerm: 30,
      interestRate: 5.8,
      monthlyExpense: 8000,
      monthlyIncome: 20000,
      offsetBalance: 100000,
    },
  ];

  $scope.setScenario = function (idx) {
    var scenario = $scope.scenarios[idx];
    $scope.loanBalance = scenario.loanBalance;
    $scope.loanTerm = scenario.loanTerm;
    $scope.interestRate = scenario.interestRate;
    $scope.monthlyExpense = scenario.monthlyExpense;
    $scope.monthlyIncome = scenario.monthlyIncome;
    $scope.offsetBalance = scenario.offsetBalance;
    $scope.monthlyDataArray = [];
    $scope.monthyRepayment = 1111;
  };

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

  $scope.setScenario(0);
});
