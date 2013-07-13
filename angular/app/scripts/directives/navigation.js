angular.module('kkNavigation').directive('kkNavbutton', [ '$location', function($location) {
    return {
        restrict: 'E',
        template: '<li class="{{liclass}}" ng-show="visible"><a href="{{href}}" ng-transclude></a></li>',
        transclude: true,
        replace: true,
        scope: { href: '@' ,
                 is_admin: '=',
                 adminOnly: '@'},

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
                scope.visible = attrs.adminOnly;
            else
                scope.visible = true;
        }
    }
}]);