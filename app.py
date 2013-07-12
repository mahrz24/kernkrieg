from flask import Flask
from flask.ext.sqlalchemy import SQLAlchemy
from flask.ext.bcrypt import Bcrypt

app = Flask(__name__, static_folder = './angular/app', static_url_path='/app')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////tmp/test.db'
app.config['SECRET_KEY'] = "KERNKRIEGFTW"

db = SQLAlchemy(app)

bcrypt = Bcrypt()
