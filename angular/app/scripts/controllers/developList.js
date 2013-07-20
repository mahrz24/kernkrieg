'use strict';

angular.module('kkApp')
.controller('DevelopListCtrl',
  ['$scope', 'own_warriors',
  function ($scope, own_warriors)
  {
    $scope.own_warriors = own_warriors;
  }]);