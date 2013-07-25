# App
from app import app, db

# Flask
from flask import jsonify, request, Response

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
                   results_per_page=None,
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
                   results_per_page=None,
                   include_columns=['id',
                                    'name',
                                    'code',
                                    'public',
                                    'testable',
                                    'owners',
                                    'owners.id',
                                    'owners.username'],
                   include_methods=['test_matches',
                                    'nontest_submissions'],
                   preprocessors={'GET_SINGLE': [check_owner_single],
                                  'GET_MANY':   [check_auth],
                                  'PUT_SINGLE': [check_owner_single],
                                  'PUT_MANY':   [deny],
                                  'POST':       [check_owner_single],
                                  'DELETE':     [check_owner_single]},
                   postprocessors={'GET_MANY':   [post_check_owner_many]})


manager.create_api(Machine, methods=['GET', 'POST', 'PUT', 'DELETE'],
                   results_per_page=None,
                   preprocessors={'PUT_SINGLE': [check_admin],
                                  'PUT_MANY':   [check_admin],
                                  'POST':       [check_admin],
                                  'DELETE':     [check_admin]},
                   postprocessors={'POST':  [post_create_testq]})

manager.create_api(Queue, methods=['GET', 'POST', 'PUT', 'DELETE'],
                   results_per_page=None,
                   exclude_columns=['matches','submissions','job'],
                   preprocessors={'PUT_SINGLE': [check_admin],
                                  'PUT_MANY':   [deny],
                                  'POST':       [check_admin],
                                  'DELETE':     [check_admin]},
                   postprocessors={'POST':  [post_schedule_queue_job],
                                   'PUT_SINGLE':  [post_schedule_queue_job],})

manager.create_api(Match, methods=['GET', 'POST', 'PUT', 'DELETE'],
                   results_per_page=25,
                   exclude_columns=['participant1.code',
                                    'participant2.code'],
                   preprocessors={'PUT_SINGLE': [check_admin],
                                  'PUT_MANY':   [deny],
                                  'POST':       [check_admin],
                                  'DELETE':     [check_admin]})

manager.create_api(Submission, methods=['GET', 'POST', 'PUT', 'DELETE'],
                   results_per_page=None,
                   exclude_columns=['code',
                                    'submissionUser',
                                    'attackerMatches',
                                    'defenderMatches'],
                   preprocessors={'PUT_SINGLE': [check_admin],
                                  'PUT_MANY':   [deny],
                                  'POST':       [check_admin],
                                  'DELETE':     [check_admin]})



@app.route('/api/warrior/testable', methods=['GET'])
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
        result_array.append({'id': w.id, 'name': w.name, 'authors': w.authors()})
    return jsonify({'results': result_array})

@app.route('/api/queue/submittable', methods=['GET'])
def get_submittables():
    if not current_user.is_authenticated():
        raise ProcessingException(message='Not Authorized',
                                  status_code=401)

    qs = Queue.query.filter(Queue.qType==2).all()
    results = []
    w_id = request.args['w']
    for q in qs:
        user_subs = Submission.query.filter(Submission.active == True).filter(Submission.submissionUserId == current_user.id).filter(Submission.queueId == q.id).count()
        warrior_subs = Submission.query.filter(Submission.active == True).filter(Submission.warriorId == w_id).filter(Submission.queueId == q.id).count()
        if (user_subs < q.maxSubsPerUser or q.maxSubsPerUser < 0) and (warrior_subs < q.maxSubsPerWarrior or q.maxSubsPerWarrior < 0) and q.isOpen:
            results.append(q)

    return jsonify({'results': results})

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
    match = schedule_match(queue, sub1, sub2, test=True)

    return jsonify({'match': match,
                    'submission1': sub1,
                    'submission2': sub2}), 201


@app.route('/api/queue/submit', methods=['POST'])
def post_queue_submit():
    if (not request.json) or (not 'queueId' in request.json):
        abort(400)
    if (not 'warriorId' in request.json):
        abort(400)

    q_id = int(request.json['queueId'])
    # Get the queue information
    queue = Queue.query.filter(Queue.id == q_id).first()

    if not queue:
        abort(404)

    # Check if submittable queue
    if queue.qType != 2:
        abort(403)

    # Submit to queue using normal submission function
    sub = frontend_submit_to_queue(queue, int(request.json['warriorId']))

    return jsonify({'submission': sub}), 201


@app.route('/api/queue/resubmit', methods=['POST'])
def post_queue_resubmit():
    if (not request.json) or (not 'submissionId' in request.json):
        abort(400)

    submissionId = int(request.json['submissionId'])
    sub = Submission.query.get(submissionId)

    if not sub:
        abort(404)

    if not current_user.admin and not sub.submissionUserId == current_user.id:
        abort(401)

    if not current_user.admin and not sub.active:
        abort(401)

    sub.active = False
    db.session.commit()

    # Submit to queue using normal submission function
    resub = frontend_submit_to_queue(sub.queue, sub.warriorId)

    return jsonify({'submission': resub}), 201


@app.route('/api/queue/remove_submission/<int:submissionId>', methods=['DELETE'])
def delete_queue_submission(submissionId):
    sub = Submission.query.get(submissionId)

    if not sub:
        abort(404)

    if not current_user.admin and not sub.submissionUserId == current_user.id:
        abort(401)

    if not current_user.admin and not sub.active:
        abort(401)

    db.session.delete(sub)
    db.session.commit()
    response = Response(status=204)
    del response.headers['content-type']
    return response


@app.route('/api/user_id', methods=['GET'])
def get_user_id():
    return jsonify({'user_id': current_user.id})


@app.route('/api/is_admin', methods=['GET'])
def get_is_admin():
    return jsonify({'is_admin': current_user.admin})
