
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

angular.module('kkApp')
.factory('QueriedMatchLoader', ['Match', '$q',
  function(Match, $q) {
    return function(page,query) {
      var delay = $q.defer();
      Match.query({page: page, q: angular.toJson(query)}, function(matches) {
        delay.resolve(matches);
      }, function() {
        delay.reject('Unable to fetch matches');
      });
      return delay.promise;
    };
  }]);

angular.module('kkApp')
.factory('MatchLoader', ['Match', '$route', '$q',
  function(Match, $route, $q) {
    return function() {
      var delay = $q.defer();
      Match.get({id: $route.current.params.matchId},function(match) {
        delay.resolve(match);
      }, function() {
        delay.reject('Unable to fetch match' + $route.current.params.matchId);
      });
      return delay.promise;
    };
  }]);