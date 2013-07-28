'use strict';


angular.module('kkApp')
.controller('AdminWarriorsCtrl',
  ['$scope', '$http', '$location', 'warriors', 'Warrior',
  function ($scope, $http, $location, warriors, Warrior)
  {

    var actionCell = '<button class="btn btn-info" ng-click="editWarrior(row)"> Edit </button>' +
      '<button class="btn btn-danger" ng-click="deleteWarrior(row)"> Delete </button>';

    var publicActionCell = '<button class="btn btn-info" ng-click="editWarrior(row)"> View </button>' +
      '<button class="btn btn-danger" ng-click="deleteWarrior(row)"> Edit Copy </button>';

  var submissionCell = '<div class="ngCellText" ng-class="col.colIndex()">' +
      '<span ng-cell-text>{{COL_FIELD | submissions }}</span></div>';


    var boolCell = '<div class="ngCellText" ng-class="col.colIndex()">' +
      '<span ng-cell-text>{{COL_FIELD | bool }}</span></div>';

    var ownerCell = '<div class="ngCellText" ng-class="col.colIndex()">' +
      '<span ng-cell-text>{{COL_FIELD | owners }}</span></div>';

    $scope.warriors = warriors;
    $scope.gridWarriors =
    {
      data: 'warriors',
      enableCellSelection: true,
      enableRowSelection: false,
      rowHeight:50,
      plugins: [new ngGridFlexibleHeightPlugin(opts = { minHeight: 200})],
      columnDefs: [ { field: 'name',
                      displayName: 'Name',
                    },
                    { field:'owners',
                      displayName:'Authors',
                      cellTemplate: ownerCell
                    },
                    { field:'nontest_submissions',
                      displayName:'Submissions',
                      cellTemplate: submissionCell
                    },
                    { field:'public',
                      displayName:'Public',
                      cellTemplate: boolCell
                    },
                    { field:'testable',
                      displayName:'Testable',
                      cellTemplate: boolCell
                    },
                    { field: '',
                      displayName: 'Action',
                      cellTemplate: actionCell
                    } ]
    };

    $scope.deleteWarrior = function (row)
    {
      var warrior = new Warrior(row.entity);
      warrior.$delete(function ()
      {
        $scope.ownWarriors = _.reject($scope.ownWarriors, {id: row.entity.id})
      });
    }

    $scope.editWarrior = function (row)
    {
      console.log('#/develop/' + row.entity.id);
      $location.path('/develop/' + row.entity.id);
    }
  }]);