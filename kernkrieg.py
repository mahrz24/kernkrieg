# App
from app import (app, db, bcrypt)

# Flask
from flask import render_template

# Flask Login
from flask.ext.login import *

# Forms
from forms import LoginForm

# Assets
from flask.ext.assets import (Environment, Bundle)

# Database & Models
from models import (User)

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
        raise ProcessingException(message='Not Authorized',
                                  status_code=401)

manager.create_api(User, methods=['GET', 'POST', 'DELETE'],
                        preprocessors={'GET_SINGLE': [check_auth],
                                       'GET_MANY' : [check_auth],
                                       'PATCH_SINGLE': [check_admin],
                                       'PATCH_MANY' : [check_admin],
                                       'POST': [check_admin],
                                       'DELETE' : [check_admin]})

# User management
login_manager.login_view = "login"
login_manager.login_message = u"Please log in to access this page."
login_manager.refresh_view = "index"

# Assets
js_base = Bundle(
    'bower_components/jquery/jquery.js',
    'bower_components/bootstrap-sass/js/bootstrap-affix.js',
    'bower_components/bootstrap-sass/js/bootstrap-alert.js',
    'bower_components/bootstrap-sass/js/bootstrap-dropdown.js',
    'bower_components/bootstrap-sass/js/bootstrap-tooltip.js',
    'bower_components/bootstrap-sass/js/bootstrap-modal.js',
    'bower_components/bootstrap-sass/js/bootstrap-transition.js',
    'bower_components/bootstrap-sass/js/bootstrap-button.js',
    'bower_components/bootstrap-sass/js/bootstrap-popover.js',
    'bower_components/bootstrap-sass/js/bootstrap-typeahead.js',
    'bower_components/bootstrap-sass/js/bootstrap-carousel.js',
    'bower_components/bootstrap-sass/js/bootstrap-scrollspy.js',
    'bower_components/bootstrap-sass/js/bootstrap-collapse.js',
    'bower_components/bootstrap-sass/js/bootstrap-tab.js',
    'vendor/bootstrap-select.js',
    'vendor/bootstrap-switch.js',
    'vendor/flatui-checkbox.js',
    'vendor/flatui-radio.js',
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
    'scripts/app.js',
    'scripts/controllers/main.js',
    #filters='jsmin',
    output='gen/packed_angular.js')
assets.register('js_angular', js_angular)

css_base = Bundle(
    'styles/bootstrap.css',
    'styles/flat-ui.css',
    filters='cssmin',
    output='gen/packed_base.css')
assets.register('css_base', css_base)

css_main = Bundle(
    'styles/main.css',
    output='gen/packed_main.css')
assets.register('css_main', css_main)


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
