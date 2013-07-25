angular.module('kkApp')
.controller('DevelopEditCtrl',
  ['$scope', '$http', '$location', '$window', 'warrior', 'Warrior',
  'testables', 'test_queues', 'SublQueueLoader',
  function ($scope, $http, $location, $window, warrior,
   Warrior, testables, test_queues, SublQueueLoader)
  {
    $scope.warrior = warrior;
    $scope.testables = testables.results;
    $scope.testWarriorSelection = $scope.testables[0];
    $scope.testQueues = test_queues;
    $scope.testQueueSelection = test_queues[0];

    SublQueueLoader(warrior).then(function(s) {
          $scope.sublQueues = s.results;
          $scope.sublQueueSelection = s.results[0];
    })

    $scope.back = function()
    {
      $window.history.back();
    }

    $scope.saveWarrior = function ()
    {
      $scope.warrior.$update();
    }

    $scope.changeTestWarriorSelection = function(testable)
    {
      $scope.testWarriorSelection = testable;
    }

    $scope.changeTestQueueSelection = function(queue)
    {
      $scope.testQueueSelection = queue;
    }

    $scope.changeSublQueueSelection = function(queue)
    {
      $scope.sublQueueSelection = queue;
    }

    $scope.submitTest = function()
    {
      $http.post("/api/queue/submit_test",
        { queueId: $scope.testQueueSelection.id,
          warrior1Id: $scope.warrior.id,
          warrior2Id: $scope.testWarriorSelection.id
        }).success(function (result) {
          var match = result.match;
          match.opponent = $scope.testWarriorSelection.name;
          match.op_authors = $scope.testWarriorSelection.authors;
          $scope.warrior.test_matches.unshift(match);
        });
    }

    $scope.viewMatch = function(m)
    {
      $location.path('/matches/' +  m.id);
    }

    $scope.submit = function()
    {
      $http.post("/api/queue/submit",
        { queueId: $scope.sublQueueSelection.id,
          warriorId: $scope.warrior.id,
        }).success(function (result) {
          var sub = result.submission;
          sub.queueName = $scope.sublQueueSelection.name;
          $scope.warrior.nontest_submissions.unshift(sub);

          SublQueueLoader(warrior).then(function(s) {
            $scope.sublQueues = s.results;
            $scope.sublQueueSelection = s.results[0];
          })
        });
      }

    $scope.resubmit = function(sub)
    {
      $http.post("/api/queue/resubmit",
        { submissionId: sub.id
        }).success(function (result) {
          var resub = result.submission;
          resub.queueName = sub.queueName;
          $scope.warrior.nontest_submissions = _.map($scope.warrior.nontest_submissions,
            function(x)
            {
              if(angular.equals(x, sub))
                return resub;
              return x;
            });
        });
    }

    $scope.removeSubmission = function(sub)
    {
      $http.delete("/api/queue/remove_submission/" + sub.id).success(function () {
          $scope.warrior.nontest_submissions = _.reject($scope.warrior.nontest_submissions,
            function(x) { return angular.equals(x, sub) });
                    SublQueueLoader(warrior).then(function(s) {
            $scope.sublQueues = s.results;
            $scope.sublQueueSelection = s.results[0];
          })
        });
    }

  }]);