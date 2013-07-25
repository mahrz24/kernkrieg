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
    $scope.matches = [];
    $scope.scheduledMatches = [];
    $scope.submissions = [];
    $scope.own_warriors = own_warriors

    $scope.submissionIsOwn = function(submission)
    {
      return $scope.is_admin || _.filter($scope.own_warriors, function(w) { return w.id == submission.warriorId }).length > 0;
    }

    $scope.changeQueueSelection = function(queue)
    {
      $scope.queueSelection = queue;
      $scope.reloadSubmissions();
      $scope.reloadMatches(1);
      $scope.reloadScheduledMatches(1);
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
        QueriedSubmissionLoader({filters:[{name:"queueId",op:"eq",val:$scope.queueSelection.id}]}).then(function(s) {
          $scope.submissions = s;
        });
    }

    $scope.reloadMatches = function(page)
    {
      if($scope.queueSelection)
        QueriedMatchLoader(page,
          {filters:[{name:"queueId",op:"eq",val:$scope.queueSelection.id},
          {name:"done",op:"eq",val:true}]}).then(function(s) {
            $scope.matches = s;
          });
    }

    $scope.reloadScheduledMatches = function(page)
    {
      if($scope.queueSelection)
        QueriedMatchLoader(page,
          {filters:[{name:"queueId",op:"eq",val:$scope.queueSelection.id},
          {name:"done",op:"eq",val:false}]}).then(function(s) {
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