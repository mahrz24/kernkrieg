

angular.module('kkApp')
.controller('MatchViewCtrl',
  ['$scope', '$http', '$location', 'own_warriors', 'match',
  function ($scope, $http, $location, own_warriors, match)
  {

    $http.get('/api/is_admin').success(function(data, status, headers, config) {
      $scope.is_admin =  data.is_admin;
    });

    $scope.queues = queues;
    $scope.matche = match;
    $scope.own_warriors = own_warriors

    $scope.submissionIsOwn = function(submission)
    {
      return $scope.is_admin || _.filter($scope.own_warriors, function(w) { return w.id == submission.warriorId }).length > 0;
    }


  }]);