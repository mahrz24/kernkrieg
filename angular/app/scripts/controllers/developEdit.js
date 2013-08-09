angular.module('kkApp')
.controller('DevelopEditCtrl',
  ['$scope', '$http', '$location', '$window', '$timeout', 'warrior', 'Warrior',
  'testables', 'test_queues', 'SublQueueLoader', 'own_warriors', 'public_warriors',
  'machines', 'hide_matches', 'hide_tests', 'users', 'user_id',
  function ($scope, $http, $location, $window, $timeout, warrior,
   Warrior, testables, test_queues, SublQueueLoader, own_warriors, public_warriors,
   machines, hide_matches, hide_tests, users, user_id)
  {
    $scope.users = [{id: -1, username: "None"}].concat(_.filter(users, function(u) { return u.id != user_id.data.user_id; }));
    var coauthors = _.filter(warrior.owners, function(u) { return u.id != user_id.data.user_id; });
    if(coauthors.length)
      $scope.coauthor = _.head(coauthors).id;
    else
      $scope.coauthor = -1;
    $scope.warrior = warrior;
    $scope.hideMatches = hide_matches.data.hide_matches;
    $scope.hideTests = hide_tests.data.hide_tests;
    $scope.testables = testables.results;
    $scope.testWarriorSelection = $scope.testables[0];
    $scope.testQueues = test_queues;
    $scope.testQueueSelection = test_queues[0];
    $scope.savedWarrior = angular.copy(warrior);
    $scope.errorInCode = false;
    $scope.message = "";
    $scope.messageTimeout = 0;
    $scope.dirtyWarrior = false;

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
    $scope.machines = _.map(machines, function(m) {
      if(m.initialInstruction != "random")
        m.initialInstruction = mars.redcode.assembleString(";redcode\n" + m.initialInstruction).instructions[0];
      return m;

    });
    $scope.selectedMachine = $scope.machines[0];

    $scope.$watch('coauthor', function(newValue, oldValue)
    {
      if($scope.coauthor == -1)
        $scope.warrior.owners = [{id: user_id.data.user_id }];
      else
        $scope.warrior.owners = [{id: user_id.data.user_id }, {id: $scope.coauthor}];
    });

    $scope.$watch('warrior', function(newValue, oldValue)
    {
        $scope.checkDirty();
    }, true);

    $scope.$watch('warrior.code', function(newValue, oldValue)
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

    $scope.checkDirty = function checkDirty()
    {
        if($scope.savedWarrior.code != $scope.warrior.code ||
          $scope.savedWarrior.name != $scope.warrior.name ||
          $scope.savedWarrior.public != $scope.warrior.public ||
          $scope.savedWarrior.testable != $scope.warrior.testable ||
          !angular.equals($scope.savedWarrior.owners, $scope.warrior.owners))
          $scope.dirtyWarrior = true;
        else
          $scope.dirtyWarrior = false;
    }

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
      $scope.savedWarrior = angular.copy($scope.warrior);
      $scope.dirtyWarrior = false;
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
    $scope.maxSize = 400;
    $scope.zoom = 3;
    $scope.visibleSize = 0;
    var debugTimer;

    $scope.$watch('memorySelection', function(newValue)
    {
      d3.select("#detail-view").selectAll("tr").remove();
      if($scope.mars)
      {
        var row = d3.select("#detail-view").selectAll("tr").data($scope.mars.core.slice(newValue[0], newValue[1]+1)).enter().append("tr")
        $scope.detailRow(row);
      }
    }, true);

    $scope.$watch('cycle', function(newValue, oldValue)
    {
      $scope.lastCycle = oldValue;
      if($scope.loaded)
      {
        if(newValue)
        {
          $scope.mars.runTo(newValue, false);
          $scope.coreRenderer();
        }
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
        $scope.memoryOffset = 0;
        $scope.visibleSize = $scope.mars.coreSize;
        if($scope.visibleSize > $scope.maxSize)
          $scope.visibleSize = $scope.maxSize;
        $scope.memWidth = Math.ceil(Math.sqrt($scope.visibleSize));
        $scope.cellWidth = Math.floor(430/$scope.memWidth);

        var data = d3.zip($scope.mars.coreOwner,$scope.mars.core);
        data = data.slice(0, 0 + $scope.visibleSize);

        d3.select("g#core-view").selectAll("g").remove();
        d3.select("#tt").selectAll("div").remove();

        var g = $scope.appendRenderer(data);
        $scope.coreInner(g, 0);
      }
    }

    $scope.appendRenderer = function(data)
    {
      var g;
      if($scope.memoryOffset >= $scope.mars.coreSize/$scope.memWidth-$scope.memWidth &&
         $scope.mars.coreSize > $scope.maxSize)
      {
        g = d3.select("g#core-view").selectAll("g")
          .data(data)
          .exit().remove();
      }
      else
      {
        g = d3.select("g#core-view").selectAll("g")
          .data(data)
          .enter().append("g");

          g.append("path").attr("class", "aop");
          g.append("path").attr("class", "bop");
          g.append("path").attr("class", "cmd");
          g.append("rect").attr("class", "frame");
      }
      return g;
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

        $scope.appendRenderer(data);

        var g = d3.select("g#core-view").selectAll("g").data(data);
        $scope.coreInner(g,offset);

        d3.select("#tt").selectAll("div").style("visibility", "hidden");

        var row = d3.select("#detail-view").selectAll("tr").data($scope.mars.core.slice($scope.memorySelection[0], $scope.memorySelection[1]+1));
        row.selectAll("td").remove();
        $scope.detailRow(row);


      }
    }

    $scope.detailRow = function(row)
    {
      row.append("td").text(function(d) { return d.opcode; });
      row.append("td").text(function(d) { if(d.modifier) return "."; else return "";});
      row.append("td").style("width", "30px").text(function(d) { return d.modifier; });
      row.append("td").text(function(d) { return d.aoperand[0]; });
      row.append("td").style("text-align", "right").text(function(d) { return d.aoperand[1]; });
      row.append("td").style("width", "30px").text(",");
      row.append("td").text(function(d) { return d.boperand[0]; });
      row.append("td").style("text-align", "right").text(function(d) { return d.boperand[1]; });

    }

    $scope.coreInner = function(el, offset)
    {
      var bkg = d3.rgb(245, 245, 245);
      var full = d3.rgb(120, 120, 120);
      var valueI = d3.interpolateRgb(bkg, full);

      var selectedBkg = d3.rgb(180,180,230);
      var selectedFull = d3.rgb(100,100,150);
      var selectedValueI = d3.interpolateRgb(selectedBkg, selectedFull);

      var cmd = d3.rgb(50, 50, 50);

      var grid = d3.rgb(200, 200, 200);
      var gridOwn = d3.rgb(90, 210, 90);
      var gridOther = d3.rgb(210, 90, 90);
      var gridPC = d3.rgb(100, 100, 10);
      var gridPCOther = d3.rgb(90, 210, 210);
      var cellSize = Math.floor($scope.cellWidth)-4;

      var tooltip = d3.select("#tt")
      .append("div")
      .style("background", d3.rgb(220,220,220))
      .style("position", "absolute")
      .style("z-index", "10")
      .style("visibility", "hidden")
      .style("padding", "5px")
      .style("border-width", "1px")
      .style("border-style", "solid")
      .style("border-color", d3.rgb(90,90,90))
      .style("border-radius", "4px");

      var locx = function(i)
      {
         return 2.5+(i%$scope.memWidth)*$scope.cellWidth;
      };

      var locy = function(i)
      {
         return 2.5+(Math.floor(i/$scope.memWidth)*$scope.cellWidth);
      };

      var clickable = function(el)
      {
        var tooltiptext = function(d) {
          return d[1].toString();
        }
        el.on("click", function(d,i)
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
          return tooltip.style("visibility", "hidden");
        }).on("mouseover", function(d){return tooltip.text(tooltiptext(d)).style("visibility", "visible");})
        .on("mousemove", function(d){return tooltip.text(tooltiptext(d)).style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");})
        .on("mouseout", function(d){return tooltip.style("visibility", "hidden");});
      };



      var sels = ["path.aop", "path.bop", "rect.frame", "cmd"];

      _.each(sels, function(s)
      {
        var sel = el.select(s);
        clickable(sel);
      });

      el.select("rect.frame").attr("x", function(d,i) { return locx(i); })
      .attr("y",  function(d,i) { return locy(i); })
      .attr("height", cellSize)
      .attr("width", cellSize)
      .attr("rx", 2)
      .attr("ry", 2)
      .style("fill", "none")
      .style("stroke-width",  function(d,i)
      {
        if(d[0] < 0)
          return 1.5;
        return 2.5;
      })
      .style("stroke", function(d,i)
      {
        if($scope.mars.taskQueues[0])
          if(_.contains($scope.mars.taskQueues[0], i+offset))
            return gridPC;

        if($scope.mars.taskQueues[1])
          if(_.contains($scope.mars.taskQueues[1], i+offset))
            return gridPCOther;

        if(d[0]==0)
          return gridOwn;
        if(d[0]==1)
          return gridOther;
        return grid;
     });

      el.select("path.aop")
      .attr('d', function(d,i) {
        var x = locx(i), y = locy(i);
        return 'M ' + x +' '+ y + ' l 0 ' + cellSize + ' l ' + cellSize + ' 0 z';
      }).style("fill", function(d,i)
      {
        if(i+offset >= $scope.memorySelection[0] && i+offset <= $scope.memorySelection[1] )
          return selectedValueI(d[1].aoperand[1]/$scope.mars.coreSize);
        else
          return valueI(d[1].aoperand[1]/$scope.mars.coreSize);
      })

      el.select("path.bop").
      attr('d', function(d,i) {
        var x = locx(i), y = locy(i);
        return 'M ' + (x) +' '+ (y) + ' l ' + (cellSize) + ' 0 l 0 ' + (cellSize) + ' z';
      }).style("fill", function(d,i)
      {
        if(i+offset >= $scope.memorySelection[0] && i+offset <= $scope.memorySelection[1] )
          return selectedValueI(d[1].boperand[1]/$scope.mars.coreSize);
        else
          return valueI(d[1].boperand[1]/$scope.mars.coreSize);
      });

      el.select("path.cmd").
      attr('d', function(d,i) {
        if(d[1].opcode == "dat")
        {
          var x = locx(i), y = locy(i);
          return 'M ' + (x+3) +' '+ (y+3) + ' l ' + (cellSize-6) + ' ' + (cellSize-6) + ' z';
        }
        return "M 0 0 l 0 0 z";
      })
      .style("stroke-width", 2.5)
      .style("stroke", function(d,i)
      {
          return cmd;
      });
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

      $scope.loaded = true;
      $scope.initCoreView();
    }

    $scope.stop = function ()
    {
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


    $scope.increaseMS = function ()
    {
      $scope.zoom+=1;
    }

    $scope.decreaseMS = function ()
    {
      $scope.zoom-=1;
    }

    $scope.$watch('zoom', function(newValue)
    {
      $scope.maxSize = [100,225,324,400,576,729,841,900,961,1024,1156][newValue];
      $scope.initCoreView();
    });

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