var app = angular.module('catApp', []);

app.controller('catCtrl', function ($scope) {
  var min = 1;
  var max = 7;
  var position = 0;
  $scope.doors = [];

  function init() {
    for (var i = 1; i <= max; i++) {
      $scope.doors.push(i);
    }
    position = chance.integer({min: min, max: max});
  }

  init();

  $scope.openDoor = function (doorNum) {
    if ($scope.correctDoor) {
      return;
    }

    if (doorNum === position) {
      $scope.correctDoor = doorNum;
      $scope.message = "Congrats, you caught the cat!";
    } else {
      $scope.message = "Oops, wrong door";
      changePosition();
    }
  };

  $scope.reset = function () {
    position = chance.integer({min: min, max: max});
    $scope.message = "";
  };

  function changePosition() {
    if (position === min) {
      position += 1;
    } else if (position === max) {
      position -= 1;
    } else {
      position += chance.bool() ? 1 : -1;
    }
  }
});