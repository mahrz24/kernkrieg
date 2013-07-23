from app import (app, db, bcrypt)
from models import (User)
import time

def stuff(i):
    print("Started job stuff" + i)
    time.sleep(20)
    with app.app_context():
        return User.query.first().username