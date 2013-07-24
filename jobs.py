from app import app, db, bcrypt, scheduler
from models import Match
from datetime import datetime

def schedule_queue(q):
    job = scheduler.schedule(
        scheduled_time=datetime.now(),
        func=queue_job,
        args=[q.id],
        interval=10,
        repeat=None
        )
    print("Scheduled periodic job " + str(job.id))
    return job.id

def stop_queue(q):
    print("Canceling periodic job " + str(q.job))
    scheduler.cancel(q.job)

def queue_job(q_id):
    print("Running queue job for id " + str(q_id))

def run_match(match_id):
    print("Executing match " + str(match_id))
    with app.app_context():
        match = Match.query.get(match_id)
        if match:
            match.executed = datetime.now()
            match.winner = 1
            match.done = True
            db.session.commit()
            print("Executed match")