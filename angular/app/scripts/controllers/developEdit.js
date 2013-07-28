angular.module('kkApp')
.controller('DevelopEditCtrl',
  ['$scope', '$http', '$location', '$window', '$timeout', 'warrior', 'Warrior',
  'testables', 'test_queues', 'SublQueueLoader', 'own_warriors', 'public_warriors',
  'machines',
  function ($scope, $http, $location, $window, $timeout, warrior,
   Warrior, testables, test_queues, SublQueueLoader, own_warriors, public_warriors,
   machines)
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
    $scope.debuggables = _.filter(own_warriors, function(w)
    {
        var ok = false;
        try
        {
          mars.redcode.assembleString(w.code);
          ok = true;
        }
        catch(e)
        {
        }

        return ok;
    });
    $scope.debugAgainst = $scope.debuggables[0];
    $scope.machines = machines;
    $scope.selectedMachine = $scope.machines[0];

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

    $scope.running = false;
    $scope.loaded = false;
    $scope.cycle = 0;
    $scope.iteration = 0;
    $scope.lastCycle;
    $scope.cyclesPerStep = 1;
    var debugTimer;

    $scope.$watch('cycle', function(scope, newValue, oldValue)
    {
      $scope.lastCycle = oldValue;
      if($scope.loaded)
      {
        $scope.mars.runTo(newValue, false);
        $scope.iteration++;
      }
    });

    $scope.coreRenderer = function(el, data)
    {
      if($scope.mars && $scope.iteration == 1)
      {
        var red = d3.rgb(255, 0, 0);
        var blue = d3.rgb(0, 0, 255);
        el.selectAll("rect")
        .data(d3.zip($scope.mars.coreOwner,$scope.mars.core))
        .enter().append("rect")
        .attr("x", function(d,i) { return (i%$scope.memWidth)*$scope.cellWidth; })
        .attr("y",  function(d,i) { return (Math.floor(i/$scope.memWidth)*$scope.cellWidth); })
        .attr("height",$scope.cellWidth*0.8)
        .attr("width", $scope.cellWidth*0.8)
        .style("fill", function(d) {
          if(d[0] < 0)
            return blue;
          else
           return red.darker(d[0]); });
      }
      else if($scope.mars)
      {
        var red = d3.rgb(255, 0, 0);
        var blue = d3.rgb(0, 0, 255);
        el.selectAll("rect")
        .data(d3.zip($scope.mars.coreOwner,$scope.mars.core))
        .attr("x", function(d,i) { return (i%$scope.memWidth)*$scope.cellWidth; })
        .attr("y",  function(d,i) { return (Math.floor(i/$scope.memWidth)*$scope.cellWidth); })
        .attr("height",$scope.cellWidth*0.8)
        .attr("width", $scope.cellWidth*0.8)
        .style("fill", function(d) {
          if(d[0] < 0)
            return blue;
          else
           return red.darker(d[0]); });
      }
    }

    $scope.load = function ()
    {
      $scope.running = false;
      $scope.cycle = 0;
      $scope.mars = new mars.MARS($scope.selectedMachine, {
          eventTypes: {
              detectWinner: true,
              detectTie: true,
              detectDeath: true
          },
          logTypes: {
              warriorTasks: true,
              warriorOwnerships: true
          }
      });
      w1 = mars.redcode.assembleString($scope.warrior.code);
      w2 = mars.redcode.assembleString($scope.debugAgainst.code);
      $scope.mars.loadWarrior(w1);
      $scope.mars.loadWarrior(w2);
      $scope.memWidth = Math.floor(Math.sqrt($scope.mars.coreSize));
      $scope.cellWidth = 100/$scope.memWidth;
      $scope.loaded = true;
      $scope.iteration++;
    }

    $scope.reset = function ()
    {
      $scope.running = false;
      $scope.cycle = 0;
      $scope.iteration = 0;
    }

    $scope.pause = function ()
    {
      $scope.running = false;
    }

    $scope.start = function ()
    {
      $scope.running = true;
      $scope.run();
    }

    $scope.run = function()
    {
        if($scope.running)
        {
          $scope.step();
          debugTimer = $timeout($scope.run,10);
        }
    }

    $scope.step = function()
    {
      $scope.cycle += $scope.cyclesPerStep;
    }

    $scope.stepback = function()
    {
      if($scope.cycle >= $scope.cyclesPerStep)
        $scope.cycle -= $scope.cyclesPerStep;
      else
        $scope.cycle = 0;
    }

    $scope.increaseCPS = function ()
    {
      $scope.cyclesPerStep++;
    }

    $scope.decreaseCPS = function ()
    {
      $scope.cyclesPerStep--;
    }

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