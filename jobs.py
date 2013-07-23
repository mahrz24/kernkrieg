from app import app, db, bcrypt
from models import Match
from datetime import datetime

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