from app import (db, bcrypt)
from sqlalchemy import event
from collections import OrderedDict

class DictSerializable(object):
    def _asdict(self):
        result = OrderedDict()
        for key in self.__mapper__.c.keys():
            result[key] = getattr(self, key)
        return result

team_table = db.Table('teams', db.Model.metadata,
    db.Column('user_id', db.Integer, db.ForeignKey('user.id', ondelete='cascade'), primary_key=True),
    db.Column('warrior_id', db.Integer, db.ForeignKey('warrior.id', ondelete='cascade'), primary_key=True)
)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True)
    email = db.Column(db.String(120), unique=True)
    passwdHash = db.Column(db.String(128), unique=False)
    admin = db.Column(db.Boolean, unique=False)

    warriors = db.relationship("Warrior",
        secondary=team_table,
        backref="owners")

    def check_password(self,password):
        return bcrypt.check_password_hash(self.passwdHash, password)

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
    public = db.Column(db.Boolean)
    testable = db.Column(db.Boolean)


    def authors(self):
        name = ""
        for o in self.owners:
            name += o.username + ", "
            return name[:-2]

@event.listens_for(db.Session, 'after_flush')
def delete_warrior_orphans(session, ctx):
    session.query(Warrior).\
        filter(~Warrior.owners.any()).\
        delete(synchronize_session=False)

class Machine(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), unique=True)
    coreSize = db.Column(db.Integer)
    pSpaceSize = db.Column(db.Integer)
    cyclesUntilTie = db.Column(db.Integer)
    initialInstruction = db.Column(db.String)
    maxTasks = db.Column(db.Integer)
    minSep = db.Column(db.Integer)
    initialSep = db.Column(db.Integer)
    readDist = db.Column(db.Integer)
    writeDist = db.Column(db.Integer)

class Queue(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), unique=True)
    machineId = db.Column(db.Integer, db.ForeignKey('machine.id'))
    machine = db.relationship("Machine")
    qType = db.Column(db.Integer)
    # 0 = Test Queue, 1 = TrueSkill Queue, 2 = All vs All
    maxSubsPerWarrior = db.Column(db.Integer)
    # -1 = No Limit
    maxSubsPerUser = db.Column(db.Integer)
    # -1 = No Limit

class Match(db.Model, DictSerializable):
    id = db.Column(db.Integer, primary_key=True)
    done = db.Column(db.Boolean)
    scheduled = db.Column(db.DateTime)
    executed = db.Column(db.DateTime)
    winner = db.Column(db.Integer)
    participant1Id = db.Column(db.Integer, db.ForeignKey('submission.id'))
    participant1 = db.relationship("Submission", backref="attackerMatches",
        foreign_keys=participant1Id,
        primaryjoin = "Match.participant1Id == Submission.id")
    participant2Id = db.Column(db.Integer, db.ForeignKey('submission.id'))
    participant2 = db.relationship("Submission", backref="defenderMatches",
        foreign_keys=participant2Id,
        primaryjoin = "Match.participant2Id == Submission.id")
    queue_id = db.Column(db.Integer, db.ForeignKey('queue.id'))
    queue = db.relationship("Queue", backref="matches")


class Submission(db.Model, DictSerializable):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128))
    authors = db.Column(db.String(255))
    code = db.Column(db.Text)
    submitted = db.Column(db.DateTime)
    submissionUserId = db.Column(db.Integer, db.ForeignKey('user.id'))
    submissionUser = db.relationship("User", backref="submissions")
    queue_id = db.Column(db.Integer, db.ForeignKey('queue.id'))
    queue = db.relationship("Queue", backref="submissions")
    warrior_id = db.Column(db.Integer, db.ForeignKey('warrior.id'))
    warrior = db.relationship("Warrior", backref="submissions")
