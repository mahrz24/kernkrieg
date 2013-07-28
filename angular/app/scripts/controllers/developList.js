'use strict';

angular.module('kkApp').
filter('bool', function() {
  return function(input) {
   if(input)
    return "Yes";
  return "No";
  }
});

angular.module('kkApp').
filter('owners', function() {
  return function(input) {
   return _.map(input, function (x) { return x.username }).join(", ");
  }
});

angular.module('kkApp').
filter('submissions', function() {
  return function(input) {
   return _.map(input, function (x) { return x.queueName }).join(", ");
  }
});

angular.module('kkApp')
.controller('DevelopListCtrl',
  ['$scope', '$http', '$location', '$q', '$modal', 'own_warriors', 'public_warriors', 'Warrior',
  function ($scope, $http, $location, $q, $modal, own_warriors, public_warriors, Warrior)
  {

    var actionCell = '<button class="btn btn-info" ng-click="editWarrior(row)"> Edit </button>' +
      '<button class="btn btn-danger" ng-click="deleteWarrior(row)"> Delete </button>';

    var publicActionCell = '<button class="btn btn-info" ng-click="editWarrior(row)"> View </button>' +
      '<button class="btn btn-danger" ng-click=""> Edit Copy </button>';


    var boolCell = '<div class="ngCellText" ng-class="col.colIndex()">' +
      '<span ng-cell-text>{{COL_FIELD | bool }}</span></div>';

    var submissionCell = '<div class="ngCellText" ng-class="col.colIndex()">' +
      '<span ng-cell-text>{{COL_FIELD | submissions }}</span></div>';

    var ownerCell = '<div class="ngCellText" ng-class="col.colIndex()">' +
      '<span ng-cell-text>{{COL_FIELD | owners }}</span></div>';

    var modalPromise = $modal({template: 'app/views/elements/delete.html',
      persist: true, show: false, backdrop: 'static', scope: $scope});

    $http.get('/api/user_id').success(function(data, status, headers, config) {
        $scope.user_id =  data.user_id;
    });

    $scope.ownWarriors = own_warriors;
    $scope.publicWarriors = public_warriors;

    $scope.gridOwnWarriors =
    {
      data: 'ownWarriors',
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

    $scope.gridPublicWarriors =
    {
      data: 'publicWarriors',
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
                    { field: '',
                      displayName: 'Action',
                      cellTemplate: publicActionCell
                    } ]
    };

    $scope.addNewWarrior = function ()
    {
      var warrior = new Warrior({ name: "Untitled warrior", code: "",
        public: false, testable: false, owners : [{id: $scope.user_id}]});

      warrior.$save( function(warrior) {
        $scope.ownWarriors.unshift(warrior);
      });
    };

    $scope.deleteWarrior = function (row)
    {
      $scope.delRow = row;
      $scope.delObject = "Warrior";
      $q.when(modalPromise).then(function(modalEl) {
        modalEl.modal('show');
      });
    }

    $scope.doDelete = function()
    {
      var warrior = new Warrior($scope.delRow.entity);
      warrior.$delete(function ()
      {
        $scope.ownWarriors = _.reject($scope.ownWarriors, {id: $scope.delRow.entity.id})
      });
    }

    $scope.editWarrior = function (row)
    {
      $location.path('/develop/' + row.entity.id);
    }
  }]);