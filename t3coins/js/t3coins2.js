var chance = new Chance();

var app = angular.module("t3coinsApp", ["as.sortable", "ngMaterial"]);

app.controller("t3coinsCtrl", function ($scope) {
  $scope.basket = new Basket();
  $scope.basket.reset();
  $scope.balanceScale = new BalanceScale("left-scale", "right-scale");
  $scope.weightingCount = 0;
  $scope.maxWeightingAllowed = 3;

  $scope.basketControlListeners = {
    containment: '#draggable-area'
  };

  $scope.scaleControlListeners = {
    containment: '#draggable-area',
    accept: function (sourceItemHandleScope, destSortableScope) {
      if (destSortableScope && destSortableScope.modelValue.length < 6) {
        return true;
      }
      alert("You cannot put more than 6 coins on a scale");
      return false;
    }
  };

  $scope.doWeighing = function () {
    if ($scope.weightingCount >= $scope.maxWeightingAllowed) {
      return;
    }
    $scope.balanceScale.weigh();
    $scope.weightingCount++;
  };

  $scope.submitAnswer = function () {
    if (!$scope.answer) {
      $scope.result = null;
      return;
    }
    $scope.result = $scope.answer.toString() === $scope.basket.oddCoin.id.toString();
  };

  $scope.reset = function () {
    $scope.answer = null;
    $scope.result = null;
    $scope.weightingCount = 0;
    $scope.basket.reset();
    $scope.balanceScale.reset();
  };

  $scope.simulate = function () {
    if ($scope.simulating == true) {
      if ($scope.simId) {
        clearInterval($scope.simId);
        $scope.reset();
      }
      $scope.simulating = false;
    } else {
      $scope.simulating = true;
      solveT3Coins($scope.basket, $scope.balanceScale, $scope.doWeighing, $scope);
      $scope.simId = setInterval(function () {
        $scope.reset();
        solveT3Coins($scope.basket, $scope.balanceScale, $scope.doWeighing, $scope);
      }, 7000);
    }
  };
});

function solveT3Coins(basket, balanceScale, weighingCallbackFn, ngScope) {
  // First weigh
  // Put 4 coins in each scale
  moveNCoins(basket, balanceScale.left, 4);
  moveNCoins(basket, balanceScale.right, 4);

  weighingCallbackFn();
  var lw1st = balanceScale.left.weigh();
  var rw1st = balanceScale.right.weigh();

  var theCounterfeit;
  var tmp = new Basket(); // temp basket
  var heavyScale, lightScale;

  var secondWeighingTime = 1000;
  var thirdWeighingTime = 2000;
  var answerTime = 3000;

  // Second weigh
  window.setTimeout(function () {
    // Case 1 scale is balanced
    if (lw1st === rw1st) {
      moveNCoins(balanceScale.right, tmp, 3);
      moveNCoins(basket, balanceScale.right, 3);
      moveNCoins(tmp, basket, 3);
      weighingCallbackFn();
    }
    // Case 2 scale if not balanced
    else {
      heavyScale = balanceScale.getHeavy();
      lightScale = balanceScale.getLight();
      moveNCoins(lightScale, basket, 2);
      moveNCoins(lightScale, tmp, 1);
      moveNCoins(heavyScale, lightScale, 2);
      moveNCoins(tmp, heavyScale, 1);
      weighingCallbackFn();
    }

    ngScope.$apply(); // refresh UI
  }, secondWeighingTime);

  // Third weigh
  window.setTimeout(function () {
    var lw2nd = balanceScale.left.weigh();
    var rw2nd = balanceScale.right.weigh();

    // Case 1 continue
    if (balanceScale.left.size() === balanceScale.right.size() && balanceScale.left.size() === 4) {
      // Case 1.1
      if (lw2nd === rw2nd) {
        // One of the 2 unweighted coins (basically the first 2 coins) remaining in the basket is the counterfeit
        // Swap the 2nd coin in the basket with the first coin (normal) in the right scale
        var normalCoin = balanceScale.right.get(0);
        balanceScale.right.set(0, basket.get(1));
        basket.set(1, normalCoin);

        // Weigh
        weighingCallbackFn();
        if (balanceScale.left.weigh() === balanceScale.right.weigh()) {
          // Case 1.1.1, counterfeit weight is unknown
          theCounterfeit = basket.get(0);
          ngScope.simulationCase = "1.1.1";
        } else {
          // Case 1.1.2, counterfeit weight is unknown
          theCounterfeit = balanceScale.right.get(0);
          ngScope.simulationCase = "1.1.2";
        }
      }
      // Case 1.2
      else {
        var toBeWeighted = new Basket();
        moveNCoins(balanceScale.right, toBeWeighted, 3);
        moveAllCoins(balanceScale.right, basket);
        moveAllCoins(balanceScale.left, basket);
        moveNCoins(toBeWeighted, balanceScale.left, 1);
        moveNCoins(toBeWeighted, balanceScale.right, 1);
        moveNCoins(toBeWeighted, basket, 1);

        weighingCallbackFn();
        var lw3rd = balanceScale.left.weigh();
        var rw3rd = balanceScale.right.weigh();

        if (lw3rd == rw3rd) {
          // Case 1.2.1, counterfeit weight is unknown
          theCounterfeit = basket.get(basket.size() - 1);
          ngScope.simulationCase = "1.2.1";
        } else {
          if (rw2nd > lw2nd) {
            // Case 1.2.2, the counterfeit is heavier
            theCounterfeit = rw3rd > lw3rd ? balanceScale.right.get(0) : balanceScale.left.get(0);
            ngScope.simulationCase = "1.2.2";
          } else {
            // Case 1.2.3, the counterfeit is lighter
            theCounterfeit = rw3rd < lw3rd ? balanceScale.right.get(0) : balanceScale.left.get(0);
            ngScope.simulationCase = "1.2.3";
          }
        }
      }
    }

    // Case 2 continue
    if (balanceScale.left.size() === balanceScale.right.size() && balanceScale.left.size() === 3) {
      // Case 2.1
      if (lw2nd === rw2nd) {
        // One of the 2 last coins (they were moved from lighter scale before) in the basket is the counterfeit
        var tmp = new Basket();
        moveNCoins(basket, tmp, 2);
        moveNCoins(balanceScale.right, basket, 1);
        moveNCoins(tmp, balanceScale.right, 1);
        moveNCoins(tmp, basket, 1);

        // Weigh
        weighingCallbackFn();
        if (balanceScale.left.weigh() === balanceScale.right.weigh()) {
          // Case 2.1.1, counterfeit weight is unknown
          theCounterfeit = basket.get(basket.size() - 1);
          ngScope.simulationCase = "2.1.1";
        } else {
          // Case 2.1.2, counterfeit weight is unknown
          theCounterfeit = balanceScale.right.get(balanceScale.right.size() - 1);
          ngScope.simulationCase = "2.1.2";
        }
      }
      // Case 2.2
      else {
        var newHeavyScale = lw2nd < rw2nd ? balanceScale.right : balanceScale.left;
        var newLightScale = lw2nd < rw2nd ? balanceScale.left : balanceScale.right;
        if (heavyScale === newHeavyScale) { // the scale does not shift
          // Case 2.2.1, the counterfeit coin is either the heavier coin of the unmoved 2 coins on the old heavy scale or
          // or the lighter coin of the unmoved coin on the old light scale
          var lightCoin = lightScale.get(0);

          moveAllCoins(lightScale, basket);
          moveNCoins(heavyScale, basket, 1);
          moveNCoins(heavyScale, lightScale, 1);

          weighingCallbackFn();
          var lw3rd = balanceScale.left.weigh();
          var rw3rd = balanceScale.right.weigh();

          if (lw3rd === rw3rd) {
            theCounterfeit = lightCoin;
            ngScope.simulationCase = "2.2.1.1";
          } else if (lw3rd > rw3rd) {
            theCounterfeit = balanceScale.left.get(0);
            ngScope.simulationCase = "2.2.1.2";
          } else {
            theCounterfeit = balanceScale.right.get(0);
            ngScope.simulationCase = "2.2.1.3";
          }
        } else { // the scale does shift
          // Case 2.2.2, the counterfeit coin is either the heavier coin of the moved 2 coins on the new heavy scale or
          // or the lighter coin of the moved coin on the new light scale
          var lightCoin = newLightScale.get(newLightScale.size() - 1);

          moveAllCoins(newLightScale, basket);
          moveNCoins(newHeavyScale, newLightScale, 2);
          moveNCoins(newHeavyScale, basket, 1);
          moveNCoins(newLightScale, newHeavyScale, 1);

          weighingCallbackFn();
          var lw3rd = balanceScale.left.weigh();
          var rw3rd = balanceScale.right.weigh();

          if (lw3rd === rw3rd) {
            theCounterfeit = lightCoin;
            ngScope.simulationCase = "2.2.2.1";
          } else if (lw3rd > rw3rd) {
            theCounterfeit = balanceScale.left.get(0);
            ngScope.simulationCase = "2.2.2.2";
          } else {
            theCounterfeit = balanceScale.right.get(0);
            ngScope.simulationCase = "2.2.2.3";
          }
        }
      }
    }
  }, thirdWeighingTime);

  window.setTimeout(function () {
    // Answer
    console.log(ngScope.simulationCase + ": " + (theCounterfeit.id.toString() === ngScope.basket.oddCoin.id.toString()));
    ngScope.answer = theCounterfeit.id.toString();
    ngScope.submitAnswer();
    ngScope.$apply(); // refresh UI
  }, answerTime);
}