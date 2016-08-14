/******************************************** The model ************************************************/
var Person = function (id, name) {
  this.id = id;
  this.name = name;
  this.preferences = [];
  this.fiance = null
};

Person.prototype.toString = function () {
  return this.name;
};

Person.prototype.likeThisPersonBetterThan = function (thisPerson, thatPerson) {
  return this.choice(thisPerson) < this.choice(thatPerson);
};

Person.prototype.choice = function (person) {
  return this.preferences.indexOf(person);
};

Person.prototype.fianceAsChoice = function () {
  return stringifyNumber(this.choice(this.fiance) + 1);
};

/******************************************** The algorithms ************************************************/
function proposeOfMen(men) {
  var freeMen = men.slice();

  while (freeMen.length > 0) {
    var thisGuy = freeMen.pop();
    for (var i = 0; i < thisGuy.preferences.length; i++) {
      var theWoman = thisGuy.preferences[i];

      if (theWoman.fiance == null) {
        theWoman.fiance = thisGuy;
        thisGuy.fiance = theWoman;
        break;
      } else {
        if (theWoman.likeThisPersonBetterThan(thisGuy, theWoman.fiance)) {
          var poorGuy = theWoman.fiance;
          poorGuy.fiance = null;
          theWoman.fiance = thisGuy;
          thisGuy.fiance = theWoman;
          freeMen.push(poorGuy);
          break;
        }
      }
    }
  }
}

function isStable(guys, gals) {
  for (var i = 0; i < guys.length; i++) {
    var theGuy = guys[i];
    for (var j = 0; j < gals.length; j++) {
      var theGal = gals[j];
      if (theGuy.likeThisPersonBetterThan(theGal, theGuy.fiance)
        && theGal.likeThisPersonBetterThan(theGuy, theGal.fiance)) {
        return false;
      }
    }
  }

  return true;
}

/******************************************** Angular App ************************************************/
var app = angular.module('smpApp', []);
app.controller('smpCtrl', function ($scope) {
  $scope.totalRounds = 0;
  $scope.totalMatched = 0;
  $scope.numPeoplePerGender = 5;
  $scope.maxNumPeople = 20;
  $scope.maxRound = 10;
  $scope.womenChoiceStats = {};
  $scope.menChoiceStats = {};

  initChart();

  $scope.startSimulation = function () {
    if ($scope.numPeoplePerGender > $scope.maxNumPeople) {
      alert("Number of people per gender cannot exceed " + $scope.maxNumPeople);
      return;
    }

    $scope.categories = [];
    for (var i = 1; i <= $scope.numPeoplePerGender; i++) {
      $scope.categories.push(i);
    }
    $scope.columnChart.xAxis[0].setCategories($scope.categories);

    $scope.counter = 0;
    $scope.intervalId = setInterval(performSingleSimulation, 200);

  };

  $scope.stopSimulation = function () {
    if ($scope.intervalId) {
      clearInterval($scope.intervalId);
      $scope.simulating = false;
    }
  };

  function performSingleSimulation() {
    if ($scope.counter++ >= $scope.maxRound) {
      clearInterval($scope.intervalId);
      $scope.simulating = false;
      $scope.$apply(); // force UI refreshing
      return
    }
    $scope.simulating = true;
    $scope.totalRounds++;
    $scope.men = [];
    $scope.women = [];
    generatePeople($scope.women, $scope.men, $scope.numPeoplePerGender);
    proposeOfMen($scope.men);
    if (!isStable($scope.men, $scope.women)) {
      alert("Marriage arrangement is not stable at round " + $scope.totalRounds);
    }
    calculateStats($scope.womenChoiceStats, $scope.women);
    calculateStats($scope.menChoiceStats, $scope.men);
    $scope.totalMatched += $scope.women.length + $scope.men.length;
    $scope.$apply(); // force UI refreshing

    // Refresh chart
    var womenData = [];
    var menData = [];
    angular.forEach($scope.categories, function (cat) {
      if ($scope.womenChoiceStats[cat]) {
        womenData.push($scope.womenChoiceStats[cat]);
      } else {
        womenData.push(0);
      }

      if ($scope.menChoiceStats[cat]) {
        menData.push($scope.menChoiceStats[cat]);
      } else {
        menData.push(0);
      }
    });
    $scope.columnChart.series[0].setData(womenData, true);
    $scope.columnChart.series[1].setData(menData, true);
  }

  function calculateStats(choiceStats, people) {
    angular.forEach(people, function (person) {
      var choice = person.choice(person.fiance) + 1;
      if (choiceStats[choice]) {
        choiceStats[choice] += 1;
      } else {
        choiceStats[choice] = 1;
      }
    });
  }

  function initChart() {
    var chartOptions = {
      chart: {
        renderTo: 'chart-container',
        type: 'column',
        style: {
          fontFamily: 'inherit'
        }
      },
      credits: {
        enabled: false
      },
      title: {
        text: 'Statistics of people getting their nth choice'
      },
      xAxis: {
        labels: {
          formatter: function () {
            return stringifyNumber(this.value) + " choice";
          }
        }
      },
      yAxis: {
        min: 0,
        title: {
          text: null
        },
        stackLabels: {
          enabled: true,
          style: {
            fontWeight: 'bold',
            color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'
          }
        }
      },
      tooltip: {
        headerFormat: '<b>{point.x}</b><br/>',
        pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}'
      },
      plotOptions: {
        column: {
          stacking: 'normal',
          dataLabels: {
            enabled: true,
            color: (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'white',
            style: {
              textShadow: '0 0 3px black'
            }
          }
        }
      },
      series: [{
        name: "Women's choice",
        data: []
      }, {
        name: "Men's choice",
        data: []
      }]
    };

    $scope.columnChart = new Highcharts.Chart(chartOptions);
  }
});

/******************************************** Util methods ************************************************/
function generatePeople(women, men, numPeoplePerGender) {
  var chance = new Chance();

  // Create women
  for (var i = 1; i <= numPeoplePerGender; i++) {
    women.push(new Person(i, chance.first({gender: "female"})));
  }
  // Create men
  for (i = (numPeoplePerGender + 1); i <= (numPeoplePerGender * 2); i++) {
    var man = new Person(i, chance.first({gender: "male"}));
    man.preferences = shuffle(women.slice());
    men.push(man);
  }
  // Randomise women's preferences
  angular.forEach(women, function (woman) {
    woman.preferences = shuffle(men.slice());
  });
}

function randomiseText(numOfChars) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (var i = 0; i < numOfChars; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function shuffle(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

var special = ['zeroth', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelvth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth'];
var deca = ['twent', 'thirt', 'fourt', 'fift', 'sixt', 'sevent', 'eight', 'ninet'];

function stringifyNumber(n) {
  var retVal = "";

  if (n < 20) {
    retVal = special[n];
  }
  else if (n % 10 === 0) {
    retVal = deca[Math.floor(n / 10) - 2] + 'ieth';
  } else {
    retVal = deca[Math.floor(n / 10) - 2] + 'y-' + special[n % 10];
  }

  return n + retVal.slice(-2)
}
