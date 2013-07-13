'use strict';

angular.module('kkApp', ['kkNavigation','ngGrid', 'ngResource'])
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
      .when('/accounts', {
        templateUrl: '/app/views/accounts.html',
        controller: 'AccountsCtrl',
        resolve: {
          accounts: function(MultiUserLoader) {
            return MultiUserLoader();
          }
        }
      })
      .otherwise({
        redirectTo: '/'
      });
  });
