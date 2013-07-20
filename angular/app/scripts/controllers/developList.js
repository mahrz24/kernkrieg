'use strict';

angular.module('kkApp')
.controller('DevelopListCtrl',
  ['$scope', '$http', 'own_warriors', 'Warrior',
  function ($scope, $http, own_warriors, Warrior)
  {
    $http.get('/api/user_id').success(function(data, status, headers, config) {
        $scope.user_id =  data.user_id;
    });

    $scope.own_warriors = own_warriors;

    $scope.addNewWarrior = function ()
    {
      var warrior = new Warrior({ name: "Untitled warrior", code: "",
        public: false, testable: false, owners : [{id: $scope.user_id}]});

      warrior.$save( function(warrior) {
        $scope.own_warriors.unshift(warrior);
      });
    };
  }]);