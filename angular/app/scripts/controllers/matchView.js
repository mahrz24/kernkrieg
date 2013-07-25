

angular.module('kkApp')
.controller('MatchViewCtrl',
  ['$scope', '$http', '$location', '$window', 'own_warriors', 'match',
  function ($scope, $http, $location, $window, own_warriors, match)
  {

    $http.get('/api/is_admin').success(function(data, status, headers, config) {
      $scope.is_admin =  data.is_admin;
    });

    $scope.match = match;
    $scope.own_warriors = own_warriors;

    $scope.matchIsOwn = function()
    {
      return $scope.is_admin ||
      (_.filter($scope.own_warriors, function(w) { return w.id == $scope.match.participant1.warriorId }).length > 0 &&
      _.filter($scope.own_warriors, function(w) { return w.id == $scope.match.participant2.warriorId }).length > 0);
    }

    $scope.back = function()
    {
      $window.history.back();
    }


  }]);