var myApp = angular.module('kkApp').filter('range', function() {
  return function(input, total) {
    total = parseInt(total);

    for (var i=0; i<total; i++)
      input.push(i);
    return input;
  };
});


angular.module('kkApp')
.controller('MatchesListCtrl',
  ['$scope', '$http', '$location', 'queues', 'own_warriors',
  'QueriedSubmissionLoader', 'QueriedMatchLoader',
  function ($scope, $http, $location, queues, own_warriors,
    QueriedSubmissionLoader, QueriedMatchLoader)
  {

    $http.get('/api/is_admin').success(function(data, status, headers, config) {
      $scope.is_admin =  data.is_admin;
    });

    $scope.queues = queues;
    $scope.avaQueues = _.filter(queues, function(q) { return q.qType == 1;});
    $scope.avaQueueSelection = $scope.avaQueues[0];
    $scope.matches = [];
    $scope.scheduledMatches = [];
    $scope.submissions = [];
    $scope.own_warriors = own_warriors

    $scope.submissionIsOwn = function(submission)
    {
      return $scope.is_admin || _.filter($scope.own_warriors, function(w) { return w.id == submission.warriorId }).length > 0;
    }

    $scope.changeAvaQueueSelection = function(queue)
    {
      $scope.avaQueueSelection = queue;
    }

    $scope.changeQueueSelection = function(queue)
    {
      $scope.queueSelection = queue;
      $scope.reloadSubmissions();
      $scope.reloadMatches(1);
      $scope.reloadScheduledMatches(1);
    }

    $scope.canBeAddedToAllVsAll = function()
    {
      return $scope.is_admin && $scope.queueSelection.qType == 2;
    }

    $scope.copyToAvA = function()
    {
      $http.post("/api/queue/copytoava",
        { queueId: $scope.queueSelection.id,
          avaQueueId: $scope.avaQueueSelection.id
        }).success(function (result) {

        });
    }

    $scope.refresh = function()
    {
      $scope.reloadSubmissions();
      $scope.reloadMatches($scope.matches.page);
      $scope.reloadScheduledMatches($scope.scheduledMatches.page);
    }

    $scope.reloadSubmissions = function()
    {
      if($scope.queueSelection)
        QueriedSubmissionLoader({filters:[{name:"queueId",op:"eq",val:$scope.queueSelection.id},
                                          {name:"active",op:"eq",val:true}],
                                 order_by:[{field: "score", direction: "desc"}]
                               }).then(function(s) {
                               $scope.submissions = s;
                             });
    }

    $scope.reloadMatches = function(page)
    {
      if($scope.queueSelection)
        QueriedMatchLoader(page,
          {filters:[{name:"queueId",op:"eq",val:$scope.queueSelection.id},
            {name:"done",op:"eq",val:true}],
           order_by:[{field: "executed", direction: "desc"}]}).then(function(s) {
            $scope.matches = s;
          });
    }

    $scope.reloadScheduledMatches = function(page)
    {
      if($scope.queueSelection)
        QueriedMatchLoader(page,
          {filters:[{name:"queueId",op:"eq",val:$scope.queueSelection.id},
            {name:"done",op:"eq",val:false}],
           order_by:[{field: "scheduled", direction: "asc"}]}).then(function(s) {
            $scope.scheduledMatches = s;
          });
    }

    $scope.currentMatchPage = function(page)
    {
      if(page == $scope.matches.page)
        return "active";
      return "";
    }

    $scope.editWarrior = function(wId)
    {
      $location.path('/develop/' +  wId);
    }

    $scope.viewMatch = function(m)
    {
      $location.path('/matches/' +  m.id);
    }

    $scope.changeQueueSelection(queues[0]);
  }]);