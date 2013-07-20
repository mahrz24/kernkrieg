'use strict';

angular.module('kkApp', ['kkNavigation','ngGrid', 'ngResource'])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: '/app/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/develop', {
        templateUrl: '/app/views/developList.html',
        controller: 'DevelopListCtrl'
      })
      .when('/develop/:warriorId', {
        templateUrl: '/app/views/developEdit.html',
        controller: 'DevelopEditCtrl'
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
      .when('/edit_account/:userId', {
        templateUrl: '/app/views/accountEditForm.html',
        controller: 'AccountEditCtrl',
        resolve: {
          account: function(UserLoader) {
            return UserLoader();
          }
        }
      })
      .otherwise({
        redirectTo: '/'
      });
  });
