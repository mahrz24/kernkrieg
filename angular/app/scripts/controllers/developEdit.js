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
    $scope.updateData = false;
    $scope.lastCycle;
    $scope.cyclesPerStep = 1;
    $scope.memoryOffset = 0;
    $scope.memorySelectionInProgress = false;
    $scope.memorySelection = [0,0];
    $scope.maxSize = 900;
    $scope.visibleSize = 0;
    var debugTimer;

    $scope.$watch('cycle', function(newValue, oldValue)
    {
      $scope.lastCycle = oldValue;
      if($scope.loaded)
      {
        $scope.mars.runTo(newValue, false);
        $scope.coreRenderer();
      }
    });

    $scope.$watch('memoryOffset', function(newValue, oldValue)
    {
      if($scope.loaded)
      {
        $scope.coreRenderer();
      }
    });


    $scope.initCoreView = function()
    {
      if($scope.mars)
      {
        var data = d3.zip($scope.mars.coreOwner,$scope.mars.core);
        data = data.slice(0, 0 + $scope.visibleSize);

        d3.select("g#core-view").selectAll("g").remove();
        var g = d3.select("g#core-view").selectAll("g")
        .data(data)
        .enter().append("g");

        g.append("rect").attr("class", "base");
        g.append("circle").attr("class", "owner");
        g.append("rect").attr("class", "cmd");
        $scope.coreInner(g, 0);
      }
    }

    $scope.coreRenderer = function()
    {
      if($scope.mars)
      {
        var data = d3.zip($scope.mars.coreOwner,$scope.mars.core);
        var offset = $scope.memWidth*$scope.memoryOffset;
        var max = offset+$scope.visibleSize;
        if(max > $scope.mars.coreSize)
          max = $scope.mars.coreSize-1;
        data = data.slice(offset, max);

        var g = d3.select("g#core-view").selectAll("g").data(data);
        $scope.coreInner(g,offset);
      }
    }

    $scope.coreInner = function(el, offset)
    {
      var owner = d3.rgb(200, 100, 100);
      var bkg = d3.rgb(180, 180, 180);
      var selected = d3.rgb(210, 210, 219);
      var selectedGrid = d3.rgb(200, 200, 200);
      var grid = d3.rgb(190, 190, 190);
      var cellSize = Math.floor($scope.cellWidth)-1;

      var locx = function(i)
      {
         return 0.5+(i%$scope.memWidth)*$scope.cellWidth;
      };

      var locy = function(i)
      {
         return 0.5+(Math.floor(i/$scope.memWidth)*$scope.cellWidth);
      };

      var clickable = function(el)
      {
        el.on("click", function(d,i)
        {
          console.log(i);
          if(!$scope.memorySelectionInProgress)
          {
            $scope.memorySelectionInProgress = true;
            $scope.memorySelection[0] = i+offset;
            $scope.memorySelection[1] = i+offset;
          }
          else
          {
            $scope.memorySelectionInProgress = false;
            if(i+offset < $scope.memorySelection[1])
              $scope.memorySelection[0] = i+offset;
            else
              $scope.memorySelection[1] = i+offset;
          }
          $scope.coreRenderer();

        })
      };

      clickable(el.select("rect.base"));
      clickable(el.select("circle.owner"));
//      clickable(el.select("circle.owner"));

      el.select("rect.base").attr("x", function(d,i) { return locx(i); })
      .attr("y",  function(d,i) { return locy(i); })
      .attr("height", cellSize)
      .attr("width", cellSize)
      .style("fill", function(d,i)
      {
        if(i+offset >= $scope.memorySelection[0] && i+offset <= $scope.memorySelection[1] )
          return selected;
        else
         return bkg;
     })
      .style("stroke-width", 1)
      .style("stroke", function(d,i)
      {
        if(i+offset >= $scope.memorySelection[0] && i+offset <= $scope.memorySelection[1] )
          return selectedGrid;
        else
         return grid;
     });

      el.select("circle.owner").attr("cx", function(d,i) { return locx(i)+3; })
        .attr("cy",  function(d,i) { return locy(i)+3; })
        .attr("r", 2)
        .style("fill", function(d) {
          if(d[0] < 0)
            return owner;
          else
           return owner.darker(d[0]+1); });
/*
      el.select("rect.cmd").attr("x", function(d,i) { return 0.5+(i%$scope.memWidth)*$scope.cellWidth; })
        .attr("y",  function(d,i) { return 0.5+(Math.floor(i/$scope.memWidth)*$scope.cellWidth); })
        .attr("height",Math.floor($scope.cellWidth*0.3))
        .attr("width", Math.floor($scope.cellWidth*0.3))
        .attr("rx", 2)
        .attr("ry", 2)
        .on("click", function(d,i)
          {
            if(!$scope.memorySelectionInProgress)
            {
              $scope.memorySelectionInProgress = true;
              $scope.memorySelection[0] = i+offset;
              $scope.memorySelection[1] = i+offset;
            }
            else
            {
              $scope.memorySelectionInProgress = false;
              if(i+offset < $scope.memorySelection[1])
                $scope.memorySelection[0] = i+offset;
              else
                $scope.memorySelection[1] = i+offset;
            }
            $scope.coreRenderer();

          })
        .style("fill", function(d) {
          if(d[0] < 0)
            return blue;
          else
           return red.darker(d[0]); })
        .style("stroke", function(d,i) {
          if(i+offset >= $scope.memorySelection[0] && i+offset <= $scope.memorySelection[1] )
            return green;
          else
           return d3.rgb(80, 80, 80); }) */
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
      $scope.memorySelection = $scope.mars.loadWarrior(w1);
      $scope.mars.loadWarrior(w2);
      $scope.memoryOffset = 0;
      $scope.visibleSize = $scope.mars.coreSize;
      if($scope.visibleSize > $scope.maxSize)
        $scope.visibleSize = $scope.maxSize;
      $scope.memWidth = Math.ceil(Math.sqrt($scope.visibleSize));
      $scope.cellWidth = Math.floor(430/$scope.memWidth);
      $scope.loaded = true;
      $scope.initCoreView();
    }

    $scope.stop = function ()
    {
      $timeout.cancel(debugTimer);
      $scope.running = false;
      $scope.cycle = 0;
    }

    $scope.pause = function ()
    {
      $scope.running = false;
    }

    $scope.start = function ()
    {
      $scope.reset = false;
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

    $scope.singleStep = function()
    {
      $scope.cycle++;
    }

    $scope.singleStepback = function()
    {
      if($scope.cycle >= 1)
        $scope.cycle--;
    }

    $scope.increaseCPS = function ()
    {
      $scope.cyclesPerStep++;
    }

    $scope.decreaseCPS = function ()
    {
      $scope.cyclesPerStep--;
    }

    $scope.increaseMO = function ()
    {
      $scope.memoryOffset+=$scope.memWidth;
    }

    $scope.decreaseMO = function ()
    {
      $scope.memoryOffset-=$scope.memWidth;
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