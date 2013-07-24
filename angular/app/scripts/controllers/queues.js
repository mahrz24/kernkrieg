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
.controller('QueuesCtrl',
  ['$scope', '$http', 'queues', 'Queue', 'machines', 'Machine',
  function ($scope, $http, queues, Queue, machines, Machine) {

    var actionCell = '<button class="btn btn-danger" ng-click="deleteQueue(row)" ng-disabled="row.entity.id==queue_id"> Delete </button>';

    var checkCell = '<input type="checkbox" ng-class="\'colt\' + $index"' +
                   ' ng-checked="COL_FIELD" ng-model="COL_FIELD"  ng-disabled="row.entity.id==queue_id"/>';

    var editCell = '<input type="text" ng-cell-input ng-class="\'colt\' + $index"' +
                   ' ng-input="COL_FIELD" ng-model="COL_FIELD" />';

    var machineCell = '<div class="btn-group">' +
    '<a class="btn dropdown-toggle" data-toggle="dropdown" href="#">'+
    ' <span ng-bind="row.entity.machine.name"></span>'+
    '<span class="caret"></span>'+
    '</a>'+
    '<ul class="dropdown-menu">'+
    '<li  ng-repeat="machine in machines"><a tabindex="-1" ng-click="changeMachine(machine,row)">{{machine.name}}</a></li>'+
    '</ul>'+
    '</div>';


    $scope.machines = machines;
    $scope.queues = queues;
    $scope.gridQueues =
    {
      data: 'queues',
      enableCellSelection: true,
      enableRowSelection: false,
      rowHeight:50,
      plugins: [new ngGridFlexibleHeightPlugin(opts={ minHeight: 200})],
      columnDefs: [ { field: 'name',
                      displayName: 'Name',
                      enableCellEdit: true,
                      editableCellTemplate: editCell
                    },
                    { field:'machine',
                      displayName:'Machine',
                      cellTemplate: machineCell,
                    },
                    { field:'qType',
                      displayName:'Type',
                      enableCellEdit: true,
                      editableCellTemplate: editCell
                    },
                    { field:'isOpen',
                      displayName:'Open',
                      enableCellEdit: true,
                      editableCellTemplate: editCell
                    },
                    { field:'active',
                      displayName:'Active',
                      enableCellEdit: true,
                      editableCellTemplate: editCell
                    },
                    { field:'maxSubsPerWarrior',
                      displayName:'Submissions per Warrior',
                      enableCellEdit: true,
                      editableCellTemplate: editCell
                    },
                    { field:'maxSubsPerUser',
                      displayName:'Submissions per User',
                      enableCellEdit: true,
                      editableCellTemplate: editCell
                    },
                    { field: '',
                      displayName: 'Action',
                      cellTemplate: actionCell
                    } ]
    };


    $scope.$watch('queues', function(newValue, oldValue)
    {
      // Added a queue or deleted one should not trigger an update
      // Performance wise this is not ideal, but works so far
      for (var i = newValue.length - 1; i >= 0; i--)
      {
        if(i<oldValue.length)
        {
          if(!angular.equals(oldValue[i],newValue[i]) &&
             oldValue[i].id == newValue[i].id)
          {
            // Update account
            var queue = new Queue($scope.queues[i]);
            queue.$update(function(queue) {}, function() {});
          }
        }
      }
    }, true);

    $scope.addNewQueue = function ()
    {
      var queue = new Queue({ name: "Queue " + $scope.queues.length,
        machine: machines[0],
        qType: 1,
        isOpen: false,
        active: true,
        maxSubsPerWarrior: 1,
        maxSubsPerUser: 1
      });

      queue.$save( function(queue) {
        $scope.queues.unshift(queue);
      });
    };

    $scope.deleteQueue = function (row)
    {
      var queue = new Queue(row.entity);
      queue.$delete(function ()
      {
        $scope.queues = _.reject($scope.queues, {id: row.entity.id})
      });
    }

    $scope.changeMachine = function(machine, row)
    {
      row.entity.machine = machine;
    }
  }]);