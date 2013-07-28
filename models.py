from app import (app,db, redis_conn, scheduler, bcrypt)
from sqlalchemy import event
from collections import OrderedDict
from flask import jsonify
from flask.ext.sqlalchemy import models_committed
import itertools
import rq

def on_models_committed(sender, changes):
    for obj, change in changes:
        if change == 'delete' and hasattr(obj, '__commit_delete__'):
            obj.__commit_delete__()

models_committed.connect(on_models_committed, sender=app)

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

def removeLog(x):
    x['log'] = ''
    return x

class Warrior(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128))
    code = db.Column(db.Text)
    public = db.Column(db.Boolean)
    testable = db.Column(db.Boolean)

    def test_matches(self):
        subs = filter(lambda s: s.queue.qType == 0 and s.active, self.submissions)
        j = list(itertools.chain(*map(lambda s: s.attackerMatches, subs)))
        j = map(lambda x: dict(x._asdict().items() + {"opponent": x.participant2.name, "op_authors": x.participant2.authors}.items()), j)
        j = map(removeLog, j)
        return j

    def nontest_submissions(self):
        subs = filter(lambda s: s.queue.qType != 0 and s.queue.isOpen and s.active, self.submissions)
        subs = map(lambda x: dict(x._asdict().items() + {"queueName": x.queue.name}.items()), subs)
        return subs


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
    instructionLimit = db.Column(db.Integer)
    initialInstruction = db.Column(db.String)
    maxTasks = db.Column(db.Integer)
    minSep = db.Column(db.Integer)
    initialSep = db.Column(db.Integer)
    readDist = db.Column(db.Integer)
    writeDist = db.Column(db.Integer)


class Queue(db.Model, DictSerializable):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), unique=True)
    machineId = db.Column(db.Integer, db.ForeignKey('machine.id'))
    machine = db.relationship("Machine")
    qType = db.Column(db.Integer)
    isOpen = db.Column(db.Boolean, default=True)
    active = db.Column(db.Boolean, default=True)
    job = db.Column(db.String(256))
    # 0 = Test Queue, 1 = All vs. All, 2 = TrueSkill Queue
    maxSubsPerWarrior = db.Column(db.Integer)
    # -1 = No Limit
    maxSubsPerUser = db.Column(db.Integer)
    # -1 = No Limit

    def stop_queue(self):
        if self.job:
            print("Canceling periodic job queue: " + str(self.job))
            scheduler.cancel(self.job)

    def __commit_delete__(self):
        self.stop_queue()


class Match(db.Model, DictSerializable):
    id = db.Column(db.Integer, primary_key=True)
    done = db.Column(db.Boolean)
    scheduled = db.Column(db.DateTime)
    job = db.Column(db.String(256))
    executed = db.Column(db.DateTime)
    winner = db.Column(db.Integer)
    log = db.Column(db.Text)
    seed = db.Column(db.Integer)
    participant1Id = db.Column(db.Integer, db.ForeignKey('submission.id'))
    participant1 = db.relationship("Submission",
        backref=db.backref("attackerMatches", cascade="all,delete"),
        foreign_keys=participant1Id,
        primaryjoin = "Match.participant1Id == Submission.id")
    participant2Id = db.Column(db.Integer, db.ForeignKey('submission.id'))
    participant2 = db.relationship("Submission",
        backref=db.backref("defenderMatches", cascade="all,delete"),
        foreign_keys=participant2Id,
        primaryjoin="Match.participant2Id == Submission.id")
    queueId = db.Column(db.Integer, db.ForeignKey('queue.id'))
    queue = db.relationship("Queue",
        backref=db.backref("matches", cascade="all,delete"))

    def stop_match(self):
        if self.job:
            print("Canceling match job: " + str(self.job))
            rq.cancel_job(self.job, connection=redis_conn)

    def __commit_delete__(self):
        self.stop_match()


class Submission(db.Model, DictSerializable):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128))
    authors = db.Column(db.String(255))
    code = db.Column(db.Text)
    active = db.Column(db.Boolean, default=True)
    mu = db.Column(db.Float, default=25.0)
    sigma = db.Column(db.Float, default=208.3)
    score = db.Column(db.Float, default=0)
    submitted = db.Column(db.DateTime)
    submissionUserId = db.Column(db.Integer, db.ForeignKey('user.id'))
    submissionUser = db.relationship("User", backref="submissions")
    queueId = db.Column(db.Integer, db.ForeignKey('queue.id'))
    queue = db.relationship("Queue",
        backref=db.backref("submissions", cascade="all,delete"))
    warriorId = db.Column(db.Integer, db.ForeignKey('warrior.id'))
    warrior = db.relationship("Warrior", backref="submissions")

    def ava_clone(self, source, ava_queue):
        for c in Submission.__table__.c:
            print(c)
            if c.name != 'id' and c.name != 'queueId':
                setattr(self, c.name, getattr(source, c.name))
        self.mu = 25.0
        self.sigma = 208.3
        self.score = 25.0
        self.queueId = ava_queue.id
