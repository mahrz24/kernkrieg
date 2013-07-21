# App
from app import (app, db, bcrypt)

# Flask
from flask import render_template, jsonify, url_for, flash, redirect, request

# Flask Login
from flask.ext.login import login_required, LoginManager, current_user, login_user, logout_user

# Forms
from forms import LoginForm

# Assets
from flask.ext.assets import (Environment, Bundle)

# Database & Models
from models import (User, Warrior)

# REST API
from flask.ext.restless import *

login_manager = LoginManager()

login_manager.init_app(app)
bcrypt.init_app(app)

assets = Environment()
assets.init_app(app)

db.create_all()

manager = APIManager(app, flask_sqlalchemy_db=db)

# Create the REST API
def check_auth(instance_id=None, **kw):
    if not current_user.is_authenticated():
        raise ProcessingException(message='Not Authorized',
                                  status_code=401)


def check_admin(instance_id=None, **kw):
    if not current_user.is_authenticated():
        raise ProcessingException(message='Not Authorized',
                                  status_code=401)
    if not current_user.admin:
        raise ProcessingException(message='Not Authorized as Administrator',
                                  status_code=401)

def check_admin_or_user(instance_id=None, **kw):
    if not current_user.is_authenticated():
        raise ProcessingException(message='Not Authorized',
                                  status_code=401)

    if current_user.admin:
        return

    if current_user.id != int(instance_id):
        raise ProcessingException(message='Not Authorized for this Resource',
                                  status_code=401)


def pre_hash(data=None, **kw):
    if "passwd_hash" in data.keys():
        data["passwd_hash"] = bcrypt.generate_password_hash(data["passwd_hash"])


manager.create_api(User, methods=['GET', 'POST', 'PUT', 'DELETE'],
                   exclude_columns=['passwd_hash','warriors'],
                   preprocessors={'GET_SINGLE': [check_admin_or_user],
                                  'GET_MANY':   [check_admin],
                                  'PUT_SINGLE': [check_admin_or_user,
                                                 pre_hash],
                                  'PUT_MANY':   [check_admin,
                                                 pre_hash],
                                  'POST':       [check_admin,
                                                 pre_hash],
                                  'DELETE':     [check_admin]})

manager.create_api(Warrior, methods=['GET', 'POST', 'PUT', 'DELETE'],
     include_columns=['id', 'name', 'code', 'public', 'testable', 'owners', 'owners.id', 'owners.username'])


@app.route('/api/is_admin', methods = ['GET'])
def get_is_admin():
    return jsonify( { 'is_admin': current_user.admin } )

@app.route('/api/user_id', methods = ['GET'])
def get_user_id():
    return jsonify( { 'user_id': current_user.id } )


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
    'bower_components/flatui/js/bootstrap-select.js',
    'bower_components/flatui/js/bootstrap-switch.js',
    'bower_components/flatui/js/flatui-checkbox.js',
    'bower_components/flatui/js/flatui-radio.js',
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
    'vendor/mars.js',
    'scripts/controllers/navigation.js',
    'scripts/directives/navigation.js',
    'scripts/app.js',
    'scripts/services/accounts.js',
    'scripts/services/warriors.js',
    'scripts/controllers/main.js',
    'scripts/controllers/developList.js',
    'scripts/controllers/accounts.js',
    'scripts/controllers/accountEdit.js',
    #filters='jsmin',
    output='gen/packed_angular.js')
assets.register('js_angular', js_angular)

css_base = Bundle(
    'bower_components/flatui/bootstrap/css/bootstrap.css',
    'bower_components/flatui/css/flat-ui.css',
    'bower_components/ng-grid/ng-grid.min.css',
    filters='cssmin',
    output='gen/packed_base.css')
assets.register('css_base', css_base)

css_main = Bundle(
    'styles/main.css',
    output='gen/packed_main.css')
assets.register('css_main', css_main)

# User management
login_manager.login_view = "login"
login_manager.login_message = u"Please log in to access this page."
login_manager.refresh_view = "index"

# Views
@login_manager.user_loader
def load_user(userid):
    users = User.query.filter_by(id=userid)
    if not users:
        return None
    return users.first()


@app.route('/reset_db')
def reset_db():
    db.drop_all()
    db.create_all()
    admin = User(username = "admin",
                 email = "admin@localhost",
                 passwd_hash = bcrypt.generate_password_hash("admin"),
                 admin = True)
    db.session.add(admin)
    db.session.commit()
    return "Done"


@app.route('/')
@login_required
def index():
    return render_template('angular.html')

@app.route('/ui/<path:p>')
@login_required
def ui(p):
    return render_template('angular.html')


@app.route("/login", methods=["GET", "POST"])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        if login_user(form.user, remember=form.remember):
            print("Logged in!")
            print(url_for("index"))
            flash("Logged in!")
            return redirect(request.args.get("next") or url_for("index"))
        else:
            flash("Sorry, but you could not log in.")

    return render_template("login.html", form=form)


@app.route("/logout")
@login_required
def logout():
    logout_user()
    flash(u"Logged out")
    return redirect(url_for("login", next=url_for("index")))


if __name__ == '__main__':
    app.run(debug=True)
