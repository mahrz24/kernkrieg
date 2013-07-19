angular.module('kkNavigation').directive('kkNavbutton', [ '$location', function($location) {
    return {
        restrict: 'E',
        template: '<li class="{{liclass}}" ng-show="visible"><a href="{{href}}" ng-transclude></a></li>',
        transclude: true,
        replace: true,
        scope: { href: '@' ,
                 adminOnly: '=' },

        link: function(scope, element, attrs)
        {
            scope.$location = $location;
            scope.$watch('$location.path()', function (locationPath)
            {
                 if(("#" + locationPath).split("/")[1] == scope.href.split("/")[1])
                 {
                    scope.liclass = "active";
                 }
                 else
                 {
                    scope.liclass = "";
                 }


            });
            if(attrs.adminOnly)
                scope.$watch('adminOnly', function(value) {scope.visible = value;});
            else
                scope.visible = true;
        }
    }
}]);