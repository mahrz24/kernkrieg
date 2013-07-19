'use strict';

angular.module('kkApp')
.controller('AccountsCtrl',
  ['$scope', 'accounts', 'User',
  function ($scope, accounts, User) {
    var passwordCell = '<div class="ngCellText" ng-class="col.colIndex()">' +
      '<span ng-cell-text>******</span></div>';

    var editCell = '<input type="text" ng-cell-input ng-class="\'colt\' + $index" ng-input="COL_FIELD" ng-model="COL_FIELD"></input>';
    var passwordEditCell = '<input type="password" ng-cell-input ng-class="\'colt\' + $index" ng-input="COL_FIELD" ng-model="COL_FIELD"></input>';

    $scope.accounts = accounts;
    $scope.gridOptions =
    {
      data: 'accounts',
      enableCellSelection: true,
      enableRowSelection: false,
      rowHeight:50,
      columnDefs: [ { field: 'username',
                      displayName: 'Username',
                      enableCellEdit: true,
                      editableCellTemplate: editCell,
                    },
                    { field:'email',
                      displayName:'E-Mail',
                      enableCellEdit: true,
                      editableCellTemplate: editCell,
                    },
                    { field:'passwd_hash',
                      displayName:'Password',
                      cellTemplate: passwordCell,
                      editableCellTemplate: passwordEditCell,
                      enableCellEdit: true
                    } ]
    };

    $scope.$watch('accounts', function(newValue, oldValue)
    {
      // Added an account or deleted one should not trigger an update
      // Performance wise this is not ideal, but works so far
      for (var i = newValue.length - 1; i >= 0; i--)
      {
        if(i<oldValue.length)
        {
          if(!angular.equals(oldValue[i],newValue[i]) && oldValue[i].id == newValue[i].id)
          {
            // Update account
            console.log("Updating " + i);
            var user = new User($scope.accounts[i]);
            user.$update(function(user) {
            }, function() {
            });
          }
        }
      }
    }, true);

    $scope.addNewUser = function ()
    {
      var user = new User({ username: "user" + $scope.accounts.length,
        email : "user" + $scope.accounts.length + "@localhost",
        passwd_hash : "password",
        admin : false});

      user.$save( function(user) {
        $scope.accounts.unshift(user);
      });
    };
  }]);