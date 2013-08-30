# Assets
from flask.ext.assets import (Environment, Bundle)
from app import app

assets = Environment()
assets.init_app(app)

# Assets
js_base = Bundle(
    'bower_components/jquery/jquery.js',
    'bower_components/lodash/lodash.js',
    'bower_components/sass-bootstrap/js/bootstrap-affix.js',
    'bower_components/sass-bootstrap/js/bootstrap-alert.js',
    'bower_components/sass-bootstrap/js/bootstrap-dropdown.js',
    'bower_components/sass-bootstrap/js/bootstrap-tooltip.js',
    'bower_components/sass-bootstrap/js/bootstrap-modal.js',
    'bower_components/sass-bootstrap/js/bootstrap-transition.js',
    'bower_components/sass-bootstrap/js/bootstrap-button.js',
    'bower_components/sass-bootstrap/js/bootstrap-popover.js',
    'bower_components/sass-bootstrap/js/bootstrap-typeahead.js',
    'bower_components/sass-bootstrap/js/bootstrap-carousel.js',
    'bower_components/sass-bootstrap/js/bootstrap-scrollspy.js',
    'bower_components/sass-bootstrap/js/bootstrap-collapse.js',
    'bower_components/sass-bootstrap/js/bootstrap-tab.js',
    'bower_components/bootstrap-select/bootstrap-select.js',
    #filters='jsmin',
    output='gen/packed_base.js')
assets.register('js_base', js_base)

js_ie9 = Bundle(
    'bower_components/es5-shim/es5-shim.js',
    'bower_components/json3/lib/json3.min.js',
    filters='jsmin',
    output='gen/packed_ie9.js')
assets.register('js_ie9', js_ie9)

js_angular = Bundle(
    'bower_components/angular/angular.js',
    'bower_components/angular-resource/angular-resource.js',
    'bower_components/ng-grid/ng-grid-2.0.7.debug.js',
    'bower_components/ng-grid/plugins/ng-grid-flexible-height.js',
    'bower_components/CodeMirror/lib/codemirror.js',
    'bower_components/d3/d3.js',
    'bower_components/d3-angular/dist/angular-d3.js',
    'bower_components/angular-strap/dist/angular-strap.js',
    #'vendor/angular-strap.js',
    'vendor/redcode_cm.js',
    'vendor/mars.js',
    'scripts/controllers/navigation.js',
    'scripts/directives/navigation.js',
    'scripts/app.js',
    'scripts/directives/codemirror.js',
    'scripts/services/accounts.js',
    'scripts/services/warriors.js',
    'scripts/services/machines.js',
    'scripts/services/queues.js',
    'scripts/services/matches.js',
    'scripts/services/submissions.js',
    'scripts/controllers/main.js',
    'scripts/controllers/developList.js',
    'scripts/controllers/developEdit.js',
    'scripts/controllers/matchesList.js',
    'scripts/controllers/matchView.js',
    'scripts/controllers/adminWarriors.js',
    'scripts/controllers/accounts.js',
    'scripts/controllers/machines.js',
    'scripts/controllers/queues.js',
    'scripts/controllers/accountEdit.js',
    #filters='jsmin',
    output='gen/packed_angular.js')
assets.register('js_angular', js_angular)

css_base = Bundle(
    'bower_components/sass-bootstrap/bootstrap-2.3.2.css',
    'bower_components/bootstrap-select/bootstrap-select.css',
    #'bower_components/flatui/css/flat-ui.css',
    'bower_components/ng-grid/ng-grid.min.css',
    'bower_components/CodeMirror/lib/codemirror.css',
    'bower_components/CodeMirror/theme/eclipse.css',
    filters='cssmin',
    output='gen/packed_base.css')
assets.register('css_base', css_base)

css_main = Bundle(
    'styles/main.css',
    output='gen/packed_main.css')
assets.register('css_main', css_main)