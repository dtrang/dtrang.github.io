var app = angular.module('mortgageApp', []);

app.controller('mortgageCtrl', [
  '$scope',
  '$timeout',
  function ($scope, $timeout) {
    $scope.loanOption = 1;

    const commonValues = {
      lvrValue: 80,
      purchaseExpenses: 3000,
      loanTerm: 30,
      interestRate: 6,
      savingsValue: 820000,
      monthlyExpense: 10350,
      monthlyIncome: 24000,
    };

    $scope.scenarios = [
      Object.assign({ purchaseValue: 1500000 }, commonValues),
      Object.assign({ purchaseValue: 1600000 }, commonValues),
      Object.assign({ purchaseValue: 1700000 }, commonValues),
      Object.assign({ purchaseValue: 1800000 }, commonValues),
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
      $scope.offsetBalance = $scope.calcInitialOffsetBalance();
      $scope.monthlyDataArray = [];
      $scope.monthyRepayment = $scope.calcMonthlyRepayment();
    };

    // Watch both 'purchaseValue' and 'lvrValue' since they influence multiple calculations
    $scope.$watchGroup(
      ['purchaseValue', 'lvrValue'],
      (newValues, oldValues) => {
        const purchaseValue = newValues[0];
        const lvrValue = newValues[1];

        $scope.loanBalance = calcLoanBalance(purchaseValue, lvrValue);
        $scope.downPaymentAmount = calcDownPaymentAmount(
          purchaseValue,
          lvrValue
        );
        $scope.stampDuty = calculateStampDuty(purchaseValue);
        $scope.offsetBalance = $scope.calcInitialOffsetBalance();

        [
          'loanBalance',
          'downPaymentAmount',
          'stampDuty',
          'offsetBalance',
        ].forEach((str) => {
          highlightChange(str);
        });
      }
    );

    // Watch 'savingsValue' and 'purchaseExpenses' together as they only affect 'offsetBalance'
    $scope.$watchGroup(
      ['savingsValue', 'purchaseExpenses'],
      (newValues, oldValues) => {
        $scope.offsetBalance = $scope.calcInitialOffsetBalance();
        highlightChange('offsetBalance');
      }
    );

    $scope.$watchGroup(
      ['loanBalance', 'loanTerm', 'interestRate'],
      (newValues, oldValues) => {
        $scope.monthyRepayment = $scope.calcMonthlyRepayment();
        highlightChange('monthyRepayment');
      }
    );

    /********************** Math util functions **********************/

    $scope.calcInitialOffsetBalance = () => {
      return calcInitialOffsetBalance(
        $scope.savingsValue,
        $scope.stampDuty,
        $scope.purchaseExpenses,
        $scope.downPaymentAmount
      );
    };

    $scope.calcMonthlyRepayment = () => {
      return calcMonthlyRepayment(
        $scope.loanBalance,
        $scope.loanTerm,
        $scope.interestRate
      );
    };

    $scope.calculate = () => {
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

    const calcInitialOffsetBalance = (savingsAmount, ...expenses) => {
      return savingsAmount - expenses.reduce((a, b) => a + b, 0);
    };

    const calcDownPaymentAmount = (purchaseValue, lvrValue) => {
      return purchaseValue * (1 - lvrValue / 100);
    };

    const calcLoanBalance = (purchaseValue, lvrValue) => {
      return purchaseValue * (lvrValue / 100);
    };

    const calcMonthlyRepayment = (
      loanAmount,
      loanYears,
      annualInterestRate
    ) => {
      const monthlyInterestRate = annualInterestRate / 12 / 100;
      const loanMonths = loanYears * 12;
      return Math.round(
        (loanAmount * monthlyInterestRate) /
          (1 - Math.pow(1 + monthlyInterestRate, -loanMonths))
      );
    };

    const calculateLengthOfRepayment = (
      loanAmount,
      interestRate,
      monthlyRepayment
    ) => {
      const monthlyInterestRate = interestRate / 12 / 100;
      return Math.round(
        Math.log(
          monthlyRepayment /
            (monthlyRepayment - monthlyInterestRate * loanAmount)
        ) / Math.log(1 + monthlyInterestRate)
      );
    };

    const calcDailyInterest = (
      currentLoanBalance,
      annualInterestRate,
      offsetAccountBalance
    ) => {
      return (
        ((currentLoanBalance - offsetAccountBalance) * annualInterestRate) / 365
      );
    };

    const calculatePrincipalAndInterest = (
      loanBalance,
      loanTerm,
      interestRate,
      loanStartDate,
      offsetAccountStartBalance,
      monthlyIncome,
      monthlyExpenses,
      monthlyRepayment,
      isPrincipalAndInterest = true
    ) => {
      const annualInterestRate = interestRate / 100;
      const loanEndDate = moment(date).add(loanTerm, 'years').toDate();
      const monthlyDataArray = [];

      var runningLoanBalance = loanBalance;
      var accruedOffsetBalance = offsetAccountStartBalance;
      var accruedInterest = 0.0;
      var monthlyAccruedInterest = 0.0;
      var date = loanStartDate;

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
    };

    const getLastDayOfMonth = (date) => {
      return new Date(date.getFullYear(), date.getMonth() + 1, 0);
    };

    const format = (date) => {
      return moment(date).format('DD MMM YYYY');
    };

    const calculateStampDuty = (propertyValue) => {
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
    };

    $scope.setScenario(0);
    $scope.calculate();

    // Helper function to highlight the changes
    const highlightChange = (variableName) => {
      var element = angular.element(document.querySelector('#' + variableName));
      element.addClass('highlight');
      $timeout(() => {
        element.removeClass('highlight');
      }, 2000); // Remove highlight after 2 seconds
    };
  },
]);
