from flask.ext.login import current_user
from flask.ext.restless import *
from models import (Warrior, Queue)
from app import db, bcrypt
from wqueue import schedule_queue

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


def check_owner_single(instance_id=None, data=None, **kw):
    if current_user.admin:
        return
    if not data:
        w = Warrior.query.get(instance_id)
        if w.public:
            return

        is_owner = False
        for owner in w.owners:
            if current_user.id == owner.id:
                is_owner = True
                if not is_owner:
                    raise ProcessingException(message='Not Authorized for this Resource',
                                              status_code=401)
        return
    if data['public']:
        return

    is_owner = False
    for owner in data['owners']:
        if current_user.id == owner['id']:
            is_owner = True

    if not is_owner:
        raise ProcessingException(message='Not Authorized for this Resource',
                                  status_code=401)


def post_check_owner_many(result=None, **kw):
    print(result)
    if current_user.admin:
        return

    for obj in result['objects']:
        is_owner = False
        for owner in obj['owners']:
            if current_user.id == owner['id']:
                is_owner = True

        if (not is_owner) and (not obj['public']):
            raise ProcessingException(message='Not Authorized for this Resource',
                                      status_code=401)


def deny(**kw):
    raise ProcessingException(message='Not Allowed',
                              status_code=401)


def pre_hash(data=None, **kw):
    if "passwdHash" in data.keys():
        data["passwdHash"] = bcrypt.generate_password_hash(data["passwdHash"])


def post_create_testq(result=None, **kw):
    testq = Queue(name=result['name'] + " Testing",
                  machineId=result['id'],
                  qType=0,
                  maxSubsPerWarrior=-1,
                  maxSubsPerUser=-1)
    db.session.add(testq)
    db.session.commit()

def post_schedule_queue_job(result=None, **kw):
    if result['active'] and result['qType'] == 2:
        queue = Queue.query.get(result['id'])
        if not queue.job:
            queue.job = schedule_queue(queue)
            db.session.commit()
    if not result['active'] and result['qType'] == 2:
        queue = Queue.query.get(result['id'])
        if queue.job:
            queue.stop_queue()
            queue.job = None
            db.session.commit()