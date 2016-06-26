var chance = new Chance();

var app = angular.module("t3coinsApp", ["as.sortable", "ngMaterial"]);

var Coin = function (id) {
  this.id = id;
  this.weight = 2;
  this.weighted = false;
};

app.controller("t3coinsCtrl", function ($scope) {
  $scope.basketCoins = [];
  $scope.leftScaleCoins = [];
  $scope.rightScaleCoins = [];
  $scope.weightingCount = 0;
  $scope.maxWeightingAllowed = 3;

  for (var i = 1; i <= 13; i++) {
    $scope.basketCoins.push(new Coin(i));
  }
  var oddCoin = $scope.basketCoins[chance.integer({min: 0, max: 12})];
  oddCoin.weight += [1, -1][chance.integer({min: 0, max: 1})];

  var leftScale = $("#left-scale");
  var rightScale = $("#right-scale");

  $scope.basketControlListeners = {
    containment: '#draggable-area',
    accept: function (sourceItemHandleScope, destSortableScope) {
      return true;
    }
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

    var lw = getTotalWeight($scope.leftScaleCoins);
    var rw = getTotalWeight($scope.rightScaleCoins);
    var delta = Math.abs(lw - rw);
    if (delta == 0) {
      leftScale.css("margin-top", "0px");
      rightScale.css("margin-top", "0px");
    } else {
      var distance = delta / 2 * 25;
      leftScale.animate({
        marginTop: (lw < rw ? "-" : "") + distance + "px"
      }, 1000 );
      rightScale.animate({
        marginTop: (rw < lw ? "-" : "") + distance + "px"
      }, 1000 );
    }

    $scope.weightingCount++;
  };

  $scope.submitAnswer = function () {
    if (!$scope.answer) {
      $scope.result = null;
      return;
    }

    if ($scope.answer === oddCoin.id.toString()) {
      $scope.result = true;
      alert("Correct! You're a smart cookie");
    } else {
      $scope.result = false;
      alert("Hmm, it's WRONG!");
    }
  };

  function getTotalWeight(coins) {
    var total = 0;
    angular.forEach(coins, function (coin) {
      coin.weighted = true;
      total += coin.weight;
    });
    return total;
  }
});