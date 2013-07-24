
angular.module('kkApp')
.controller('MatchesListCtrl',
  ['$scope', '$http', '$location', 'queues',
  function ($scope, $http, $location, queues)
  {
    $scope.queues = queues;
    $scope.queueSelection = queues[0];

    $scope.changeQueueSelection = function(queue)
    {
      $scope.queueSelection = queue;
    }
  }]);