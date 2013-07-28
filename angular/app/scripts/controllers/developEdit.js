angular.module('kkApp')
.controller('DevelopEditCtrl',
  ['$scope', '$http', '$location', '$window', '$timeout', 'warrior', 'Warrior',
  'testables', 'test_queues', 'SublQueueLoader',
  function ($scope, $http, $location, $window, $timeout, warrior,
   Warrior, testables, test_queues, SublQueueLoader)
  {
    $scope.warrior = warrior;
    $scope.testables = testables.results;
    $scope.testWarriorSelection = $scope.testables[0];
    $scope.testQueues = test_queues;
    $scope.testQueueSelection = test_queues[0];
    $scope.savedCode = warrior.code;
    $scope.errorInCode = false;
    $scope.message = "";
    $scope.messageTimeout = 0;

    $scope.$watch('warrior.code', function(scope, newValue, oldValue)
    {
        try
        {
          mars.redcode.assembleString(warrior.code);
          $scope.errorInCode = false;
        }
        catch(e)
        {
          $scope.errorInCode = true;
          $scope.errorMessage = e;
        }
    });

    $scope.makeMarker = function makeMarker() {
      var marker = document.createElement("div");
      marker.innerHTML = "✘";
      marker.className = "error";
      return marker;
    }

    $scope.updateError = function(cm)
    {
      cm.clearGutter("errors");
      if($scope.errorInCode)
      {
        cm.setGutterMarker($scope.errorMessage.line-1, "errors", $scope.makeMarker());
      }
    }

    $scope.timer = function()
    {
        $scope.messageTimeout--;
        if($scope.messageTimeout < 0)
          $scope.message = "";

        if($scope.savedCode != $scope.warrior.code)
        {
          $scope.saveWarrior();
          $scope.message = "Auto Saved Warrior";
          $scope.messageTimeout = 1;
        }

        timer = $timeout($scope.timer,5000);
    }

    var timer = $timeout($scope.timer,5000);



    $scope.back = function()
    {
      $window.history.back();
    }

    $scope.saveWarrior = function ()
    {
      $scope.warrior.$update()
      $scope.savedCode = warrior.code;
    }

    // Debugger
    $scope.selectedItem = "1";
        $scope.selects = [
      {
        "id": "1",
        "name": "foo"
      },
      {
        "id": "2",
        "name": "bar"
      },
      {
        "id": "3",
        "name": "baz"
      }
    ];

    // Test & Submission

    SublQueueLoader(warrior).then(function(s) {
          $scope.sublQueues = s.results;
          $scope.sublQueueSelection = s.results[0];
    })

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