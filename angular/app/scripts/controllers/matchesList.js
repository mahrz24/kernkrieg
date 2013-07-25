
angular.module('kkApp')
.controller('MatchesListCtrl',
  ['$scope', '$http', '$location', 'queues',
  'QueriedSubmissionLoader', 'QueriedMatchLoader',
  function ($scope, $http, $location, queues,
    QueriedSubmissionLoader, QueriedMatchLoader)
  {

    $http.get('/api/is_admin').success(function(data, status, headers, config) {
      $scope.is_admin =  data.is_admin;
    });

    $scope.queues = queues;
    $scope.matches = [];
    $scope.scheduledMatches = [];
    $scope.submissions = [];

    $scope.changeQueueSelection = function(queue)
    {
      $scope.queueSelection = queue;
      $scope.reloadSubmissions();
      $scope.reloadMatches(1);
      $scope.reloadScheduledMatches(1);
    }

    $scope.reloadSubmissions = function()
    {
      QueriedSubmissionLoader({filters:[{name:"queueId",op:"eq",val:$scope.queueSelection.id}]}).then(function(s) {
        $scope.submissions = s;
      })
    }

    $scope.reloadMatches = function(page) {
      QueriedMatchLoader(page,
        {filters:[{name:"queueId",op:"eq",val:$scope.queueSelection.id},
        {name:"done",op:"eq",val:true}]}).then(function(s) {
          $scope.matches = s;
        });
    }

    $scope.reloadScheduledMatches = function(page) {
      QueriedMatchLoader(page,
        {filters:[{name:"queueId",op:"eq",val:$scope.queueSelection.id},
        {name:"done",op:"eq",val:false}]}).then(function(s) {
          $scope.scheduledMatches = s;
        });
    }

    $scope.changeQueueSelection(queues[0]);
  }]);