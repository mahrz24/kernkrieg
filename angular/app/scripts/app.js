;
angular.module('kkApp', ['kkNavigation','ngGrid', 'ngResource', 'd3', '$strap.directives'])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: '/app/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/matches', {
        templateUrl: '/app/views/matchesList.html',
        controller: 'MatchesListCtrl',
        resolve: {
          queues: function(NonTestQueueLoader) {
            return NonTestQueueLoader();
          },
          own_warriors: function(QueriedWarriorLoader, $q, $http)
          {
            var delay = $q.defer();

            $http.get('/api/user_id').success(function(data, status, headers, config) {
              delay.resolve(QueriedWarriorLoader({filters:[{name:"owners__id",op:"any",val:data.user_id}]}));
            });

            return delay.promise;
          },
        }
      })
      .when('/matches/:matchId', {
        templateUrl: '/app/views/matchView.html',
        controller: 'MatchViewCtrl',
        resolve: {
          match: function(MatchLoader) {
            return MatchLoader();
          },
          own_warriors: function(QueriedWarriorLoader, $q, $http)
          {
            var delay = $q.defer();

            $http.get('/api/user_id').success(function(data, status, headers, config) {
              delay.resolve(QueriedWarriorLoader({filters:[{name:"owners__id",op:"any",val:data.user_id}]}));
            });

            return delay.promise;
          }
        }
      })
      .when('/develop', {
        templateUrl: '/app/views/developList.html',
        controller: 'DevelopListCtrl',
        resolve: {
          own_warriors: function(QueriedWarriorLoader, $q, $http)
          {
            var delay = $q.defer();

            $http.get('/api/user_id').success(function(data, status, headers, config) {
              delay.resolve(QueriedWarriorLoader({filters:[{name:"owners__id",op:"any",val:data.user_id}]}));
            });

            return delay.promise;
          },
          public_warriors: function(QueriedWarriorLoader, $q, $http)
          {
            return QueriedWarriorLoader({filters:[{name:"public",op:"eq",val:true}]});
          }
        }
      })
      .when('/develop/:warriorId', {
        templateUrl: '/app/views/developEdit.html',
        controller: 'DevelopEditCtrl',
        resolve: {
          warrior: function(WarriorLoader) {
            return WarriorLoader();
          },
          testables: function(TestableWarriorIdLoader) {
            return TestableWarriorIdLoader();
          },
          public_warriors: function(QueriedWarriorLoader, $q, $http)
          {
            return QueriedWarriorLoader({filters:[{name:"public",op:"eq",val:true}]});
          },
          own_warriors: function(QueriedWarriorLoader, $q, $http)
          {
            var delay = $q.defer();

            $http.get('/api/user_id').success(function(data, status, headers, config) {
              delay.resolve(QueriedWarriorLoader({filters:[{name:"owners__id",op:"any",val:data.user_id}]}));
            });

            return delay.promise;
          },
          test_queues: function(TestQueueLoader) {
            return TestQueueLoader();
          },
          machines: function(MultiMachineLoader) {
            return MultiMachineLoader();
          },
          users: function(MultiUserLoader) {
            return MultiUserLoader();
          },
          user_id: function($http) {
            return $http.get('/api/user_id');
          },
          hide_matches: function($http)
          {
            return $http.get('/api/hide_matches');
          },
          hide_tests: function($http)
          {
            return $http.get('/api/hide_tests');
          }
        }
      })
      .when('/admin/warriors', {
        templateUrl: '/app/views/adminWarriors.html',
        controller: 'AdminWarriorsCtrl',
        resolve: {
          warriors: function(AllWarriorLoader) {
            return AllWarriorLoader();
          },
        }
      })
      .when('/admin/machines', {
        templateUrl: '/app/views/machines.html',
        controller: 'MachinesCtrl',
        resolve: {
          machines: function(MultiMachineLoader) {
            return MultiMachineLoader();
          },
        }
      })
      .when('/admin/queues', {
        templateUrl: '/app/views/queues.html',
        controller: 'QueuesCtrl',
        resolve: {
          queues: function(MultiQueueLoader) {
            return MultiQueueLoader();
          },
          machines: function(MultiMachineLoader) {
            return MultiMachineLoader();
          }
        }
      })
      .when('/admin/accounts', {
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
