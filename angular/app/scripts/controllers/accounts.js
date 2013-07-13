'use strict';

angular.module('kkApp')
  .controller('AccountsCtrl', ['$scope','accounts',function ($scope, accounts) {
    $scope.myData = [{name: "Moroni", age: 50},
                 {name: "Tiancum", age: 43},
                 {name: "Jacob", age: 27},
                 {name: "Nephi", age: 29},
                 {name: "Enos", age: 34}];
    $scope.accounts = accounts;
    $scope.gridOptions = { data: 'accounts' };
}]);