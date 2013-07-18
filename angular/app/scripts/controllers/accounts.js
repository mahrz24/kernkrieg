'use strict';

angular.module('kkApp')
.controller('AccountsCtrl',
  ['$scope', 'accounts', 'User',
  function ($scope, accounts, User) {
    $scope.accounts = accounts;
    $scope.gridOptions =
    {
      data: 'accounts',
      enableCellSelection: true,
      enableRowSelection: false,
      columnDefs: [ { field: 'username',
                      displayName: 'Username',
                      enableCellEdit: true
                    },
                    { field:'email',
                      displayName:'E-Mail',
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
          if(oldValue[i] != newValue[i] && oldValue[i].id == newValue[i].id)
          {
            // Update account
            console.log("Update account " + i);
          }
        }
      }
    }, true);

    $scope.addNewUser = function ()
    {
      var user = new User({ username: "user" + $scope.accounts.length,
        email : "user@localhost",
        passwd_hash : "password",
        admin : false});

      user.$save( function(user) {
        $scope.accounts.unshift(user);
      });
    };
  }]);