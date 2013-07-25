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

angular.module('kkApp')
.factory('QueriedSubmissionLoader', ['Submission', '$q',
  function(Submission, $q) {
    return function(query) {
      var delay = $q.defer();
      Submission.query({q: angular.toJson(query)}, function(submissions) {
        delay.resolve(submissions.objects);
      }, function() {
        delay.reject('Unable to fetch submissions');
      });
      return delay.promise;
    };
  }]);