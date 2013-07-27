from app import app, db, scheduler, q, match_q, test_q
from models import Match
from datetime import datetime
import time
import subprocess
import json
from trueskill import Rating, rate_1vs1


def run_match(match_id):
    print("Executing match " + str(match_id))
    with app.app_context():
        match = Match.query.get(match_id)
        if match:
            # Execution of match
            code1 = match.participant1.code
            code2 = match.participant2.code
            try:
                match.log = subprocess.check_output(["./mars/kkmars-cli.js","--file","0",code1,code2])
                result = json.loads(match.log)['result']
                print(result)
                if result['event']['event'] == "won":
                    match.winner = result['event']['winner']+1
                elif result['event']['event'] == "tie":
                    match.winner = 0
                else:
                    match.winner = -1
            except Exception, e:
                match.winner = -1
                match.log = "Error({0}): {1}".format(e.errno, e.strerror)
            match.executed = datetime.now()
            match.job = None
            match.done = True
            # Rate match
            rating1 = Rating(match.participant1.mu, match.participant1.sigma)
            rating2 = Rating(match.participant2.mu, match.participant2.sigma)

            if match.winner == 1:
                new_rating1, new_rating2 = rate_1vs1(rating1, rating2)
            elif match.winner == 2:
                new_rating2, new_rating1 = rate_1vs1(rating2, rating1)
            elif match.winner == 0:
                new_rating2, new_rating1 = rate_1vs1(rating2, rating1, drawn=True)

            match.participant1.mu = new_rating1.mu
            match.participant1.sigma = new_rating1.sigma
            match.participant2.mu = new_rating2.mu
            match.participant2.sigma = new_rating2.sigma

            if match.queue.qType == 2:
                match.participant1.score = match.participant1.mu - match.participant1.sigma
                match.participant2.score = match.participant2.mu - match.participant2.sigma
            if match.queue.qType == 1:
                match.participant1.score = match.participant1.mu
                match.participant2.score = match.participant2.mu


            db.session.commit()
            print("Executed match")