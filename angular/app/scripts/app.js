'use strict';

angular.module('kkApp', ['kkNavbar'])
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
      .otherwise({
        redirectTo: '/'
      });
  });
