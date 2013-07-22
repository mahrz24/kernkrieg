angular.module('kkApp')
.controller('DevelopEditCtrl',
  ['$scope', '$http', '$location', 'warrior', 'Warrior', 'testables',
  function ($scope, $http, $location, warrior, Warrior, testables)
  {
    $scope.warrior = warrior;
    $scope.testables = testables.results;
    $scope.testSelection = $scope.testables[0];

    $scope.saveWarrior = function ()
    {
      $scope.warrior.$update();
    }

    $scope.changeTestSelection = function(testable)
    {
      console.log("Hello");
      $scope.testSelection = testable;
    }

  }]);