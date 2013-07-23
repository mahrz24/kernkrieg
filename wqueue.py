# App
from app import db, q
from flask.ext.login import current_user
from models import Warrior, Submission, Match
from flask import abort
from datetime import datetime
from jobs import run_match


def frontend_submit_to_queue(q, w_id):
    w = Warrior.query.filter(Warrior.id == w_id).first()
    if not w:
        abort(404)
    # Only an owner, or the admin can submit to the queue
    # Testables can be submitted to a test queue
    if (not (q.qType == 0 and w.testable)) and (not current_user.admin):
        is_owner = False
        for o in w.owners:
            if o.id == current_user.id:
                is_owner = True
        if not is_owner:
            abort(401)

    sub = Submission(name=w.name,
                     authors=w.authors(),
                     code=w.code,
                     submitted=datetime.now(),
                     submissionUser=current_user.id,
                     queue_id=q.id,
                     warrior_id=w.id)
    db.session.add(sub)
    db.session.commit()

    return sub

def schedule_match(queue, sub1, sub2):
    match = Match(done=False,
                  scheduled=datetime.now(),
                  executed=None,
                  winner=-1,
                  participant1Id=sub1.id,
                  participant2Id=sub2.id,
                  queue_id=queue.id)
    db.session.add(match)
    db.session.commit()
    q.enqueue(run_match, match.id)

# @app.route('/make/')
# def make():
#     job = q.enqueue(stuff, 'argument')
#     session['job'] = job.id
#     return job.id

# @app.route('/get/')
# def get():

#     job = rq.job.Job.fetch(session['job'], connection=redis_conn)
#     out = str(job.result)
#     #except:
#     #    out = 'No result yet'
#     return out