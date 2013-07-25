
angular.module('kkApp')
.factory('Match', ['$resource', function($resource) {
  return $resource('/api/match/:id', {id : '@id'},
    {query:
      {method: 'GET',
      transformResponse: function (data) {
        return angular.fromJson(data).objects},
      isArray: false},
    update: {method:'PUT'}});
}]);