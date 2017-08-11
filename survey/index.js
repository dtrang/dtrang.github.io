var app = angular.module('surveyApp', []);
app.controller('surveyCtrl', function ($scope, $http) {
  var url = 'data.json';

  $http({method: "GET", url: url}).then(function(response) {
    $scope.data = response.data;
    $scope.osData = _.countBy($scope.data, "os");
    $scope.browserData = _.countBy($scope.data, "browser");
    $scope.deviceData = _.countBy($scope.data, "device");
    $scope.countryData = _.countBy($scope.data, "country");
    $scope.ratingData = _.countBy($scope.data, "how_easy");

    $scope.mostLike = _.map($scope.data, function (feedback) {
      if (feedback.most_like) {
        return {how_easy: feedback.how_easy, most_like: feedback.most_like};
      }
    });
    $scope.mostLike = $scope.mostLike.filter(function (obj) {
      return obj !== undefined;
    });

    $scope.leastLike = _.map($scope.data, function (feedback) {
      if (feedback.least_like) {
        return {how_easy: feedback.how_easy, least_like: feedback.least_like};
      }
    });
    $scope.leastLike = $scope.leastLike.filter(function (obj) {
      return obj !== undefined;
    });

    displayRatings($scope.ratingData);
    displayPie($scope.browserData, "browser-pie");
    displayPie($scope.osData, "os-pie");
    displayPie($scope.deviceData, "device-pie");
    displayMap($scope.countryData);
  }, function(response) {
    $scope.data = response.data || 'Request failed';
  });

  function displayPie(data, containerName) {
    var seriesData = [];

    _.each(data, function (value, key) {
      seriesData.push({
        name: key,
        y: value
      })
    });

    Highcharts.chart(containerName, {
      chart: {
        plotBackgroundColor: null,
        plotBorderWidth: null,
        plotShadow: false,
        type: 'pie',
        style: {
          fontFamily: 'inherit'
        }
      },
      credits: {
        enabled: false
      },
      title: {
        text: null
      },
      tooltip: {
        pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
      },
      plotOptions: {
        pie: {
          size: 250,
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: true,
            format: '<b>{point.name}</b>: {point.percentage:.1f} %',
            style: {
              color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
            }
          }
        }
      },
      series: [{
        name: 'Share',
        colorByPoint: true,
        data: seriesData
      }]
    });
  }

  function displayRatings(ratingData) {
    var categories = [];
    var series = {
      name: "Ease of use",
      data: []
    };
    _.sortBy(ratingData, 'key');
    _.each(ratingData, function (value, key) {
      categories.push(key);
      series.data.push(value);
    });

    Highcharts.chart('rating-chart', {
      chart: {
        type: 'column',
        style: {
          fontFamily: 'inherit'
        }
      },
      credits: {
        enabled: false
      },
      title: {
        text: ' '
      },
      xAxis: {
        categories: categories,
        crosshair: true
      },
      yAxis: {
        min: 0,
        title: {
          text: 'Total ratings'
        }
      },
      tooltip: {
        headerFormat: '<span>Ease of use: {point.key}</span><table>',
        pointFormat: '<tr><td style="color:{series.color};padding:0">Total ratings: </td>' +
        '<td style="padding:0"><b>{point.y}</b></td></tr>',
        footerFormat: '</table>',
        shared: true,
        useHTML: true
      },
      plotOptions: {
        column: {
          pointPadding: 0.2,
          borderWidth: 0
        }
      },
      series: [series]
    });
  }

  function displayMap(_data) {
    var mapData = [];
    _.each(_data, function (value, key) {
      mapData.push({
        name: key,
        value: value
      });
    });

    Highcharts.mapChart('map-container', {
      chart: {

      },
      credits: {
        enabled: false
      },
      title: {
        text: null
      },
      colorAxis: {
        min: 1,
        max: 3000,
        type: 'logarithmic'
      },
      series: [{
        data: mapData,
        mapData: Highcharts.maps['custom/world'],
        joinBy: ['name'],
        name: 'Total applicants',
        states: {
          hover: {
            color: '#a4edba'
          }
        }
      }]
    });
  }
});