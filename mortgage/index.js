var app = angular.module('mortgageApp', []);

app.controller('mortgageCtrl', function ($scope) {
  $scope.loanOption = 1;

  $scope.scenarios = [
    {
      loanBalance: 500000,
      loanTerm: 30,
      interestRate: 5,
      monthlyExpense: 3000,
      monthlyIncome: 6000,
      offsetBalance: 1000,
    },
    {
      loanBalance: 900000.0,
      loanTerm: 30,
      interestRate: 5,
      monthlyExpense: 6000,
      monthlyIncome: 14000.0,
      offsetBalance: 50000.0,
    },
    {
      loanBalance: 1500000.0,
      loanTerm: 30,
      interestRate: 5,
      monthlyExpense: 10000,
      monthlyIncome: 20000.0,
      offsetBalance: 0.0,
    },
    {
      loanBalance: 3000000.0,
      loanTerm: 30,
      interestRate: 5,
      monthlyExpense: 10000,
      monthlyIncome: 20000.0,
      offsetBalance: 500000.0,
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

  function updateMonthlyPrincipalRepayment() {
    $scope.monthlyPrincipalRepayment =
      $scope.loanBalance / $scope.loanTerm / 12;
  }

  $scope.calculate = function () {
    var annualInterestRate = $scope.interestRate / 100;
    var runningLoanBalance = $scope.loanBalance;

    $scope.accruedOffsetBalance = $scope.offsetBalance;
    $scope.accruedInterestBalance = 0.0;
    $scope.monthlyDataArray = [];

    var date = new Date();
    var monthlyAccruedInterest = 0.0;
    while (
      runningLoanBalance >= $scope.accruedOffsetBalance &&
      $scope.accruedOffsetBalance >= 0
    ) {
      date = moment(date).add(1, 'days').toDate();

      monthlyAccruedInterest +=
        ((runningLoanBalance - $scope.accruedOffsetBalance) *
          annualInterestRate) /
        365;

      // Finish calculation if current date is the end of the month
      if (format(getLastDayOfMonth(date)) === format(date)) {
        // Remaining money left after everything
        var remainingMoney =
          $scope.monthlyIncome -
          $scope.monthlyExpense -
          $scope.monthlyPrincipalRepayment -
          monthlyAccruedInterest;

        // Update accrued amounts, running loan balance
        $scope.accruedOffsetBalance += remainingMoney;
        $scope.accruedInterestBalance += monthlyAccruedInterest;
        runningLoanBalance -= $scope.monthlyPrincipalRepayment;

        // Push data of the month to the array
        $scope.monthlyDataArray.push({
          date: format(date),
          interestPaid: monthlyAccruedInterest,
          totalOffset: $scope.accruedOffsetBalance,
          totalInterest: $scope.accruedInterestBalance,
          loanBalance: runningLoanBalance,
        });

        // Reset monthly accrued interest
        monthlyAccruedInterest = 0;
      }
    }
  };

  function getLastDayOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  function format(date) {
    return moment(date).format('DD MMM YYYY');
  }

  $scope.setScenario(0);
});
