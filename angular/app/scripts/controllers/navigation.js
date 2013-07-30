'use strict';

angular.module('kkNavigation', [])
  .controller('NavigationCtrl', function ($scope, $http) {
    $http.get('/api/is_admin').success(function(data, status, headers, config) {
        $scope.is_admin =  data.is_admin;
    });
    $http.get('/api/user_id').success(function(data, status, headers, config) {
        $scope.user_id =  data.user_id;
    });
    $http.get('/api/hide_matches').success(function(data, status, headers, config) {
        $scope.hide_matches =  data.hide_matches;
    });
  });