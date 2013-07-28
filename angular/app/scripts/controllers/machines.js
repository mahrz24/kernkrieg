'use strict';

angular.module('kkApp')
.directive('ngBlur', function () {
    return function ($scope, elem, attrs) {
        elem.bind('blur', function () {
          if(!$scope.$$phase) {
            $scope.$apply(attrs.ngBlur);
          }
        });
    };
});

angular.module('kkApp')
.controller('MachinesCtrl',
  ['$scope', '$http', '$modal', '$q', 'machines', 'Machine',
  function ($scope, $http, $modal, $q, machines, Machine) {

    var actionCell = '<button class="btn btn-danger" ng-click="deleteMachine(row)" ng-disabled="row.entity.id==machine_id"> Delete </button>';

    var checkCell = '<input type="checkbox" ng-class="\'colt\' + $index"' +
                   ' ng-checked="COL_FIELD" ng-model="COL_FIELD"  ng-disabled="row.entity.id==machine_id"/>';

    var editCell = '<input type="text" ng-cell-input ng-class="\'colt\' + $index"' +
                   ' ng-input="COL_FIELD" ng-model="COL_FIELD" />';


    var modalPromise = $modal({template: 'app/views/elements/delete.html',
      persist: true, show: false, backdrop: 'static', scope: $scope});

    $scope.machines = machines;
    $scope.gridMachines =
    {
      data: 'machines',
      enableCellSelection: true,
      enableRowSelection: false,
      rowHeight:50,
      plugins: [new ngGridFlexibleHeightPlugin(opts = { minHeight: 200})],
      columnDefs: [ { field: 'name',
                      displayName: 'Name',
                      enableCellEdit: true,
                      editableCellTemplate: editCell,
                    },
                    { field:'coreSize',
                      displayName:'Core Size',
                      enableCellEdit: true,
                      editableCellTemplate: editCell,
                    },
                    { field:'pSpaceSize',
                      displayName:'PSpc Size',
                      enableCellEdit: true,
                      editableCellTemplate: editCell,
                    },
                    { field:'cyclesUntilTie',
                      displayName:'Tie After',
                      enableCellEdit: true,
                      editableCellTemplate: editCell,
                    },
                    { field:'instructionLimit',
                      displayName:'Instruction Limit',
                      enableCellEdit: true,
                      editableCellTemplate: editCell,
                    },
                    { field:'initialInstruction',
                      displayName:'Init',
                      enableCellEdit: true,
                      editableCellTemplate: editCell,
                    },
                    { field:'maxTasks',
                      displayName:'Max Tasks',
                      enableCellEdit: true,
                      editableCellTemplate: editCell,
                    },
                    { field:'minSep',
                      displayName:'Min Sep',
                      enableCellEdit: true,
                      editableCellTemplate: editCell,
                    },
                    { field:'initialSep',
                      displayName:'Init Sep',
                      enableCellEdit: true,
                      editableCellTemplate: editCell,
                    },
                    { field:'readDist',
                      displayName:'Read Dist',
                      enableCellEdit: true,
                      editableCellTemplate: editCell,
                    },
                    { field:'writeDist',
                      displayName:'Write Dist',
                      enableCellEdit: true,
                      editableCellTemplate: editCell,
                    },
                    { field: '',
                      displayName: 'Action',
                      cellTemplate: actionCell
                    } ]
    };


    $scope.$watch('machines', function(newValue, oldValue)
    {
      // Added a machine or deleted one should not trigger an update
      // Performance wise this is not ideal, but works so far
      for (var i = newValue.length - 1; i >= 0; i--)
      {
        if(i<oldValue.length)
        {
          if(!angular.equals(oldValue[i],newValue[i]) &&
             oldValue[i].id == newValue[i].id)
          {
            // Update account
            var machine = new Machine($scope.machines[i]);
            machine.$update(function(machine) {}, function() {});
          }
        }
      }
    }, true);

    $scope.addNewMachine = function ()
    {
      var machine = new Machine({ name: "Machine " + $scope.machines.length,
        coreSize: 8000,
        pSpaceSize: 8,
        cyclesUntilTie: 80000,
        instructionLimit: 100,
        initialInstruction: "random",
        maxTasks: 8000,
        minSep: 100,
        initialSep: -1,
        readDist: -1,
        writeDist: -1
      });

      machine.$save( function(machine) {
        $scope.machines.unshift(machine);
      });
    };

    $scope.deleteMachine = function (row)
    {
      $scope.delRow = row;
      $scope.delObject = "Machine";
      $q.when(modalPromise).then(function(modalEl) {
        modalEl.modal('show');
      });
    }

    $scope.doDelete = function()
    {
      var machine = new Machine($scope.delRow.entity);
      machine.$delete(function ()
      {
        $scope.machines = _.reject($scope.machines, {id: $scope.delRow.entity.id})
      });
    }
  }]);