'use strict';

angular.module('kkApp')
.factory('User', ['$resource', function($resource) {
  return $resource('/api/users/:id', {id : '@id'},
    {query:
      {method: 'GET',
      transformResponse: function (data) {
        return angular.fromJson(data).objects},
      isArray: false},
    update: {method:'PUT'}});
}]);

angular.module('kkApp')
.factory('MultiUserLoader', ['User', '$q',
  function(User, $q) {
    return function() {
      var delay = $q.defer();
      User.query(function(users) {
        console.log(users);
        delay.resolve(users.objects);
      }, function() {
        delay.reject('Unable to fetch users');
      });
      return delay.promise;
    };
  }]);

angular.module('kkApp')
.factory('UserLoader', ['User', '$route', '$q',
  function(User, $route, $q) {
    return function() {
      var delay = $q.defer();
      User.get({id: $route.current.params.userId},function(user) {
        delay.resolve(user);
      }, function() {
        delay.reject('Unable to fetch user' + $route.current.params.userId);
      });
      return delay.promise;
    };
  }]);