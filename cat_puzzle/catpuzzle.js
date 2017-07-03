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
    $scope.attempts = 0;
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
      $scope.attempts++;
      changePosition(doorNum);
    }
  };

  $scope.reset = function () {
    position = chance.integer({min: min, max: max});
    $scope.message = "";
    $scope.attempts = 0;
    $scope.correctDoor = null;
  };

  function changePosition(guessedDoorNum) {
    if (position === min) {
      position++;
      return;
    }

    if (position === max) {
      position--;
      return;
    }

    if (Math.abs(guessedDoorNum - position) === 1) {
      if (position > guessedDoorNum) {
        position++;
      } else {
        position--;
      }
      return;
    }

    position += chance.bool() ? 1 : -1;
  }
});