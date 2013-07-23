# App
from app import app, db

# Flask
from flask import jsonify, request

# Models
from models import (User, Warrior, Machine, Queue, Match, Submission)

# REST API
from flask.ext.restless import *

# Post & Preprocessors
from processors import *

# Handle dates
from datetime import datetime

# Queue Handling
from wqueue import *

manager = APIManager(app, flask_sqlalchemy_db=db)


manager.create_api(User, methods=['GET', 'POST', 'PUT', 'DELETE'],
                   exclude_columns=['passwdHash', 'warriors'],
                   preprocessors={'GET_SINGLE': [check_admin_or_user],
                                  'GET_MANY':   [check_admin],
                                  'PUT_SINGLE': [check_admin_or_user,
                                                 pre_hash],
                                  'PUT_MANY':   [check_admin,
                                                 pre_hash],
                                  'POST':       [check_admin,
                                                 pre_hash],
                                  'DELETE':     [check_admin]})

manager.create_api(Warrior, methods=['GET', 'POST', 'PUT', 'DELETE'],
                   include_columns=['id',
                                    'name',
                                    'code',
                                    'public',
                                    'testable',
                                    'owners',
                                    'owners.id',
                                    'owners.username'],
                   preprocessors={'GET_SINGLE': [check_owner_single],
                                  'GET_MANY':   [check_auth],
                                  'PUT_SINGLE': [check_owner_single],
                                  'PUT_MANY':   [deny],
                                  'POST':       [check_owner_single],
                                  'DELETE':     [check_owner_single]},
                   postprocessors={'GET_MANY':   [post_check_owner_many]})


manager.create_api(Machine, methods=['GET', 'POST', 'PUT', 'DELETE'],
                   preprocessors={'PUT_SINGLE': [check_admin],
                                  'PUT_MANY':   [check_admin],
                                  'POST':       [check_admin],
                                  'DELETE':     [check_admin]},
                   postprocessors={'POST':  [post_create_testq]})

manager.create_api(Queue, methods=['GET', 'POST', 'PUT', 'DELETE'],
                   preprocessors={'PUT_SINGLE': [check_admin],
                                  'PUT_MANY':   [check_admin],
                                  'POST':       [check_admin],
                                  'DELETE':     [check_admin]})


@app.route('/api/testables', methods=['GET'])
def get_testables():
    if not current_user.is_authenticated():
        raise ProcessingException(message='Not Authorized',
                                  status_code=401)
    if current_user.admin:
        result = Warrior.query.all()
    else:
        own_warriors = Warrior.query.filter(Warrior.owners.any(id=current_user.id))
        testable_warriors = Warrior.query.filter(Warrior.testable==True)
        public_warriors = Warrior.query.filter(Warrior.public==True)
        result = own_warriors.union(testable_warriors, public_warriors).all()
    result_array = []
    for w in result:
        result_array.append({'id': w.id, 'name': w.name + " by " + w.authors()})
    return jsonify({'results': result_array})



@app.route('/api/queue/submit_test', methods=['POST'])
def post_queue_submit_test():
    if (not request.json) or (not 'queueId' in request.json):
        abort(400)
    if (not 'warrior1Id' in request.json) or (not 'warrior2Id' in request.json):
        abort(400)

    q_id = int(request.json['queueId'])
    # Get the queue information
    queue = Queue.query.filter(Queue.id == q_id).first()

    if not queue:
        abort(404)

    # Check if test queue
    if queue.qType != 0:
        abort(403)

    # Submit to queue using normal submission function
    sub1 = frontend_submit_to_queue(queue, int(request.json['warrior1Id']))
    sub2 = frontend_submit_to_queue(queue, int(request.json['warrior2Id']))
    # Create match to be scheduled
    match = schedule_match(queue, sub1, sub2)

    return jsonify({'match': match,
                    'submission1': sub1,
                    'submission2': sub2}), 201


@app.route('/api/user_id', methods=['GET'])
def get_user_id():
    return jsonify({'user_id': current_user.id})


@app.route('/api/is_admin', methods=['GET'])
def get_is_admin():
    return jsonify({'is_admin': current_user.admin})
