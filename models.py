from sqlalchemy import Column, Integer, String
from flask.ext.sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True)
    email = Column(String(120), unique=True)
    passwd_hash = Column(String(60), unique=False)

    def __init__(self, name=None, email=None, passwd_hash=None):
        self.name = name
        self.email = email
        self.passwd_hash = passwd_hash

    def __repr__(self):
        return '<User %r>' % (self.name)
