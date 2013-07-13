'use strict';

angular.module('kkNavigation', [])
  .controller('NavigationCtrl', function ($scope, $http) {
    $scope.is_admin = true;
    $http.get('/api/is_admin').success(function(data, status, headers, config) {
        $scope.is_admin =  data.is_admin;
    });
  });