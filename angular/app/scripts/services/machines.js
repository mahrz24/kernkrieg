'use strict';

angular.module('kkApp')
.factory('Machine', ['$resource', function($resource) {
  return $resource('/api/machine/:id', {id : '@id'},
    {query:
      {method: 'GET',
      transformResponse: function (data) {
        return angular.fromJson(data).objects},
      isArray: false},
    update: {method:'PUT'}});
}]);


angular.module('kkApp')
.factory('MultiMachineLoader', ['Machine', '$q',
  function(Machine, $q) {
    return function() {
      var delay = $q.defer();
      Machine.query(function(machines) {
        delay.resolve(machines.objects);
      }, function() {
        delay.reject('Unable to fetch machines');
      });
      return delay.promise;
    };
  }]);

angular.module('kkApp')
.factory('MachineLoader', ['Machine', '$route', '$q',
  function(Machine, $route, $q) {
    return function() {
      var delay = $q.defer();
      Machine.get({id: $route.current.params.machineId},function(machine) {
        delay.resolve(machine);
      }, function() {
        delay.reject('Unable to fetch machine' + $route.current.params.machineId);
      });
      return delay.promise;
    };
  }]);

angular.module('kkApp')
.factory('MachineID', ['$q',
  function(Machine, $q) {
    var machineId
    return function() {
      var delay = $q.defer();
      Machine.query(function(machines) {
        delay.resolve(machines.objects);
      }, function() {
        delay.reject('Unable to fetch machines');
      });
      return delay.promise;
    };
  }]);