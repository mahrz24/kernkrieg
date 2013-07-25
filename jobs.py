from app import app, db, scheduler, q, match_q, test_q
from models import Match
from datetime import datetime
import time
import subprocess



def run_match(match_id):
    print("Executing match " + str(match_id))
    time.sleep(5)
    with app.app_context():
        match = Match.query.get(match_id)
        if match:
            # Execution of match
            code1 = match.participant1.code
            code2 = match.participant2.code
            print(subprocess.check_output(["./mars/kkmars-cli.js","--file","0",code1,code2]))
            match.executed = datetime.now()
            match.winner = 1
            match.job = None
            match.done = True
            db.session.commit()
            print("Executed match")