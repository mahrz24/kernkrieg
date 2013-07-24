from app import app, db, scheduler, q, match_q, test_q
from models import Match
from datetime import datetime
import time



def run_match(match_id):
    print("Executing match " + str(match_id))
    time.sleep(5)
    with app.app_context():
        match = Match.query.get(match_id)
        if match:
            match.executed = datetime.now()
            match.winner = 1
            match.job = None
            match.done = True
            db.session.commit()
            print("Executed match")