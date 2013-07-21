'use strict';

angular.module('kkApp')
.controller('AccountEditCtrl',
  ['$scope', 'account', 'User',
  function ($scope, account, User) {
    $scope.account = account;

    $scope.save = function() {
      if($scope.account.passwdHash == $scope.passwordConfirm)
      {
        $scope.account.$update();
      }
    }
  }]);