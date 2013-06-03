# Flask
from flask import Flask
from flask import render_template

# Flask Login
from flask.ext.login import *

# Database & Models
from models import (db, User)

# Hashes
from flask.ext.bcrypt import Bcrypt




app = Flask(__name__, static_url_path='')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////tmp/test.db'
app.config['SECRET_KEY'] = "KERNKRIEGFTW"

login_manager = LoginManager()
bcrypt = Bcrypt(app)
db.init_app(app)
login_manager.init_app(app)


# User management
login_manager.login_view = "login"
login_manager.login_message = u"Please log in to access this page."
login_manager.refresh_view = "reauth"


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
def hello_world():
    print(len(bcrypt.generate_password_hash('hunter2')))
    return render_template('demo.html')


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST" and "username" in request.form:
        username = request.form["username"]
        users = User.query.filter_by(name=username)
        if users:
            remember = request.form.get("remember", "no") == "yes"
            if login_user(users.first().id, remember=remember):
                flash("Logged in!")
                return redirect(request.args.get("next") or url_for("index"))
            else:
                flash("Sorry, but you could not log in.")
        else:
            flash(u"Invalid username.")
    return render_template("login.html")


if __name__ == '__main__':
    app.run(debug=True)
