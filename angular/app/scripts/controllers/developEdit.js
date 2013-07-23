angular.module('kkApp')
.controller('DevelopEditCtrl',
  ['$scope', '$http', '$location', 'warrior', 'Warrior',
  'testables', 'test_queues', 'SublQueueLoader',
  function ($scope, $http, $location, warrior,
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

    $scope.submit = function()
    {
      $http.post("/api/queue/submit",
        { queueId: $scope.sublQueueSelection.id,
          warriorId: $scope.warrior.id,
        }).success(function () {
          console.log("Posted warrior");
        });
    }

  }]);