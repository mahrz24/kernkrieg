'use strict';

angular.module('kkApp', ['kkNavigation'])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: '/app/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/manage', {
        templateUrl: '/app/views/main.html',
        controller: 'ManageCtrl'
      })
      .when('/develop', {
        templateUrl: '/app/views/main.html',
        controller: 'DevelopCtrl'
      })
      .when('/users', {
        templateUrl: '/app/views/users.html',
        controller: 'UsersCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
