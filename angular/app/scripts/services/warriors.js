'use strict';

angular.module('kkApp')
.factory('Warrior', ['$resource', function($resource) {
  return $resource('/api/warrior/:id', {id : '@id'},
    {query:
      {method: 'GET',
      transformResponse: function (data) {
        return angular.fromJson(data).objects},
      isArray: false},
     update: {method:'PUT'}});
}]);

angular.module('kkApp')
.factory('AllWarriorLoader', ['Warrior', '$q',
  function(Warrior, $q) {
    return function() {
      var delay = $q.defer();
      Warrior.query(function(warriors) {
        delay.resolve(warriors.objects);
      }, function() {
        delay.reject('Unable to fetch warriors');
      });
      return delay.promise;
    };
  }]);

angular.module('kkApp')
.factory('QueriedWarriorLoader', ['Warrior', '$q',
  function(Warrior, $q) {
    return function(query) {
      var delay = $q.defer();
      Warrior.query({q: angular.toJson(query)}, function(warriors) {
        delay.resolve(warriors.objects);
      }, function() {
        delay.reject('Unable to fetch warriors');
      });
      return delay.promise;
    };
  }]);

angular.module('kkApp')
.factory('TestableWarriorIdLoader', ['$http',
  function($http) {
    return function() {
      var promise = $http.get('/api/warrior/testable').then(function (response) {
        return response.data;
      });
      // Return the promise to the controller
      return promise;
    };
  }]);

angular.module('kkApp')
.factory('WarriorLoader', ['Warrior', '$route', '$q',
  function(Warrior, $route, $q) {
    return function() {
      var delay = $q.defer();
      Warrior.get({id: $route.current.params.warriorId},function(warrior) {
        delay.resolve(warrior);
      }, function() {
        delay.reject('Unable to fetch warrior' + $route.current.params.warriorId);
      });
      return delay.promise;
    };
  }]);