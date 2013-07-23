angular.module('kkApp')
.controller('DevelopEditCtrl',
  ['$scope', '$http', '$location', 'warrior', 'Warrior',
  'testables', 'test_queues', 'subl_queues',
  function ($scope, $http, $location, warrior,
   Warrior, testables, test_queues, subl_queues)
  {
    $scope.warrior = warrior;
    $scope.testables = testables.results;
    $scope.testWarriorSelection = $scope.testables[0];
    $scope.testQueues = test_queues;
    $scope.testQueueSelection = test_queues[0];
    $scope.sublQueues = subl_queues;
    $scope.sublQueueSelection = subl_queues[0];

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
        }).success(function () {
          console.log("Posted test");
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