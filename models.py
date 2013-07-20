from app import (db, bcrypt)
from sqlalchemy import event

team_table = db.Table('teams', db.Model.metadata,
    db.Column('user_id', db.Integer, db.ForeignKey('user.id', ondelete='cascade'), primary_key=True),
    db.Column('warrior_id', db.Integer, db.ForeignKey('warrior.id', ondelete='cascade'), primary_key=True)
)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True)
    email = db.Column(db.String(120), unique=True)
    passwd_hash = db.Column(db.String(128), unique=False)
    admin = db.Column(db.Boolean, unique=False)

    warriors = db.relationship("Warrior",
        secondary=team_table,
        backref="owners")

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

class Warrior(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128))
    code = db.Column(db.Text)
    public = db.Column(db.Boolean, unique=False)
    testable = db.Column(db.Boolean, unique=False)

@event.listens_for(db.Session, 'after_flush')
def delete_warrior_orphans(session, ctx):
    session.query(Warrior).\
        filter(~Warrior.owners.any()).\
        delete(synchronize_session=False)