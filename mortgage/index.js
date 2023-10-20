var app = angular.module('mortgageApp', []);

app.controller('mortgageCtrl', function ($scope) {
  $scope.loanOption = 1;

  $scope.scenarios = [
    {
      loanBalance: 500000,
      loanTerm: 30,
      interestRate: 5,
      monthlyExpense: 2000,
      monthlyIncome: 5000,
      offsetBalance: 10000,
    },
    {
      loanBalance: 1000000,
      loanTerm: 30,
      interestRate: 5,
      monthlyExpense: 6000,
      monthlyIncome: 10000,
      offsetBalance: 20000,
    },
    {
      loanBalance: 1500000,
      loanTerm: 30,
      interestRate: 5,
      monthlyExpense: 8000,
      monthlyIncome: 15000,
      offsetBalance: 0,
    },
    {
      loanBalance: 2000000,
      loanTerm: 30,
      interestRate: 5,
      monthlyExpense: 10000,
      monthlyIncome: 20000,
      offsetBalance: 100000,
    },
  ];

  $scope.setScenario = function (idx) {
    var scenario = $scope.scenarios[idx];
    $scope.loanBalance = scenario.loanBalance;
    $scope.loanTerm = scenario.loanTerm;
    $scope.monthlyPrincipalRepayment =
      scenario.loanBalance / scenario.loanTerm / 12;
    $scope.interestRate = scenario.interestRate;
    $scope.monthlyExpense = scenario.monthlyExpense;
    $scope.monthlyIncome = scenario.monthlyIncome;
    $scope.offsetBalance = scenario.offsetBalance;
    $scope.monthlyDataArray = [];
  };

  $scope.$watch('loanBalance', function (newValue, oldValue) {
    updateMonthlyPrincipalRepayment();
  });

  $scope.$watch('loanTerm', function (newValue, oldValue) {
    updateMonthlyPrincipalRepayment();
  });

  $scope.calculate = function () {
    $scope.loanStartDate = moment(getLastDayOfMonth(new Date()))
      .add(1, 'days')
      .toDate();

    const results = calculatePrincipalAndInterest(
      $scope.loanBalance,
      $scope.interestRate,
      $scope.loanStartDate,
      $scope.offsetBalance,
      $scope.monthlyIncome,
      $scope.monthlyExpense,
      $scope.monthlyPrincipalRepayment,
      $scope.loanOption === 1
    );

    $scope.accruedOffsetBalance = results.accruedOffsetBalance;
    $scope.monthlyDataArray = results.monthlyDataArray;
    $scope.accruedInterestBalance = results.accruedInterest;
  };

  function updateMonthlyPrincipalRepayment() {
    $scope.monthlyPrincipalRepayment =
      $scope.loanBalance / $scope.loanTerm / 12;
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
    interestRate,
    loanStartDate,
    offsetAccountStartBalance,
    monthlyIncome,
    monthlyExpenses,
    monthlyPrincipalRepayment,
    isPrincipalAndInterest = true
  ) {
    const annualInterestRate = interestRate / 100;
    monthlyPrincipalRepayment = isPrincipalAndInterest
      ? monthlyPrincipalRepayment
      : 0;

    var runningLoanBalance = loanBalance;
    var accruedOffsetBalance = offsetAccountStartBalance;
    var accruedInterest = 0.0;
    var monthlyAccruedInterest = 0.0;
    var date = loanStartDate;
    var monthlyDataArray = [];

    while (
      runningLoanBalance >= accruedOffsetBalance &&
      accruedOffsetBalance >= 0
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
        var remainingMoney =
          monthlyIncome -
          monthlyExpenses -
          monthlyAccruedInterest -
          monthlyPrincipalRepayment;

        // Update accrued amounts, running loan balance
        accruedOffsetBalance += remainingMoney;
        accruedInterest += monthlyAccruedInterest;
        runningLoanBalance -= monthlyPrincipalRepayment;

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

    return { monthlyDataArray, accruedInterest, accruedOffsetBalance };
  }

  function getLastDayOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  function format(date) {
    return moment(date).format('DD MMM YYYY');
  }

  $scope.setScenario(0);
});
