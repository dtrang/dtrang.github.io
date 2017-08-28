var app = angular.module('mortgageApp', []);

app.controller('mortgageCtrl', function ($scope) {
  $scope.scenarios = [{
    loanBalance: 500000,
    interestRate: 5,
    monthlyExpense: 3000,
    monthlyIncome: 6000,
    offsetBalance: 1000
  }, {
    loanBalance: 900000.00,
    interestRate: 5,
    monthlyExpense: 6000,
    monthlyIncome: 14000.00,
    offsetBalance: 50000.00
  }, {
    loanBalance: 1500000.00,
    interestRate: 5,
    monthlyExpense: 10000,
    monthlyIncome: 20000.00,
    offsetBalance: 0.00
  }, {
    loanBalance: 3000000.00,
    interestRate: 5,
    monthlyExpense: 10000,
    monthlyIncome: 20000.00,
    offsetBalance: 500000.00
  }];

  $scope.setScenario = function (idx) {
    var scenario = $scope.scenarios[idx];
    $scope.loanBalance = scenario.loanBalance;
    $scope.interestRate = scenario.interestRate;
    $scope.monthlyExpense = scenario.monthlyExpense;
    $scope.monthlyIncome = scenario.monthlyIncome;
    $scope.offsetBalance = scenario.offsetBalance;
    $scope.monthlyDataArray = [];
  };

  $scope.calculate = function () {
    var annualInterestRate = $scope.interestRate / 100;
    $scope.accruedOffsetBalance = $scope.offsetBalance;
    $scope.accruedInterestBalance = 0.0;
    $scope.monthlyDataArray = [];

    var date = new Date();
    var monthlyAccruedInterest = 0.0;
    while ($scope.loanBalance >= $scope.accruedOffsetBalance && $scope.accruedOffsetBalance >= 0) {
      date = moment(date).add(1, 'days').toDate();
      var endOfMonthDate = getLastDayOfMonth(date);
      monthlyAccruedInterest += ($scope.loanBalance - $scope.accruedOffsetBalance) * annualInterestRate / 365;

      if (format(endOfMonthDate) === format(date)) {
        var data = {date: format(date), interestPaid: monthlyAccruedInterest};
        var remainingMoney = $scope.monthlyIncome - monthlyAccruedInterest - $scope.monthlyExpense;
        $scope.accruedOffsetBalance = $scope.accruedOffsetBalance + remainingMoney;
        $scope.accruedInterestBalance += monthlyAccruedInterest;
        monthlyAccruedInterest = 0;

        data.totalOffset = $scope.accruedOffsetBalance;
        data.totalInterest = $scope.accruedInterestBalance;
        $scope.monthlyDataArray.push(data);
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