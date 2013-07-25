angular.module('kkApp')
.factory('Submission', ['$resource', function($resource) {
  return $resource('/api/submission/:id', {id : '@id'},
    {query:
      {method: 'GET',
      transformResponse: function (data) {
        return angular.fromJson(data).objects},
      isArray: false},
    update: {method:'PUT'}});
}]);