from sqlalchemy import Column, Integer, String
from flask.ext.sqlalchemy import SQLAlchemy
from flask.ext.bcrypt import Bcrypt

db = SQLAlchemy()
bcrypt = Bcrypt()

class User(db.Model, ):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True)
    email = Column(String(120), unique=True)
    passwd_hash = Column(String(128), unique=False)

    def __init__(self, username=None, email=None, passwd_hash=None):
        self.username = username
        self.email = email
        self.passwd_hash = passwd_hash

    def check_password(self,password):
        return bcrypt.check_password_hash(self.passwd_hash, password)

    def is_active(self):
        return True

    def is_authenticated(self):
        return True

    def get_id(self):
        return unicode(self.id)

    def is_anonymous(self):
        return False

    def __repr__(self):
        return '<User %r>' % (self.username)

    def __eq__(self, other):
        """
        Checks the equality of two `UserMixin` objects using `get_id`.
        """
        if isinstance(other, User):
            return self.get_id() == other.get_id()
            return NotImplemented

    def __ne__(self, other):
        """
        Checks the inequality of two `UserMixin` objects using `get_id`.
        """
        equal = self.__eq__(other)
        if equal is NotImplemented:
            return NotImplemented
        return not equal
