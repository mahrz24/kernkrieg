

angular.module('kkApp')
.controller('MatchViewCtrl',
  ['$scope', '$http', '$location', '$window', 'own_warriors', 'match',
  function ($scope, $http, $location, $window, own_warriors, match)
  {

    $http.get('/api/is_admin').success(function(data, status, headers, config) {
      $scope.is_admin =  data.is_admin;
    });

    $scope.match = match;
    $scope.log = JSON.parse(match.log);
    $scope.own_warriors = own_warriors;

    $scope.matchIsOwn = function()
    {
      return $scope.is_admin ||
      (_.filter($scope.own_warriors, function(w) { return w.id == $scope.match.participant1.warriorId }).length > 0 &&
      _.filter($scope.own_warriors, function(w) { return w.id == $scope.match.participant2.warriorId }).length > 0);
    }

    $scope.back = function()
    {
      $window.history.back();
    }

    $scope.matchWinner = function()
    {
      if(!$scope.match.done)
        return "Match Running"
      if($scope.match.winner == 1)
        return $scope.match.participant1.name + " wins"
      if($scope.match.winner == 2)
        return $scope.match.participant2.name + " wins"
      if($scope.match.winner == 0)
        return "Tie"
      if($scope.match.winner == -1)
        return "Error"
    }

    $scope.ownershipRenderer = function(el, data) {
      console.log("Rendering");

      el.selectAll("rect")
    .data(d3.zip(data.log.cycle,data.log.warriorOwnerships))
  .enter().append("rect")
    .attr("x", function(d) { return d[0]/4; })
    .attr("y", 100).attr("height", function(d) { return d[1][0]/20}).attr("width", 10);

    }


  }]);