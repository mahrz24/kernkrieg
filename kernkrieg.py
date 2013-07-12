# Flask
from flask import Flask
from flask import render_template

# Flask Login
from flask.ext.login import *

# Forms
from forms import LoginForm

# Database & Models
from models import (db, bcrypt, User)


app = Flask(__name__, static_folder = 'angular/app/')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////tmp/test.db'
app.config['SECRET_KEY'] = "KERNKRIEGFTW"

login_manager = LoginManager()

db.init_app(app)
login_manager.init_app(app)
bcrypt.init_app(app)


# User management
login_manager.login_view = "login"
login_manager.login_message = u"Please log in to access this page."
login_manager.refresh_view = "index"


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
    admin = User("admin",
                 "admin@localhost",
                 bcrypt.generate_password_hash("admin"))
    db.session.add(admin)
    db.session.commit()
    return "Done"


@app.route('/')
@login_required
def index():
    return render_template('demo.html')


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
