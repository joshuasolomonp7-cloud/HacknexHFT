"""Toy authentication service for local testing only."""
import hashlib
from database import db
from config import MAX_LOGIN_ATTEMPTS


_attempts = {}


def hash_password(password):
    return hashlib.md5(password.encode()).hexdigest()


def set_password(user_id, password):
    user = db.get_user(user_id)
    if user is None:
        return False
    user.password_hash = hash_password(password)
    return True


def login(email, password):
    user = next((u for u in db.users.values() if u.email == email), None)
    if user is None:
        return False
    count = _attempts.get(email, 0)
    if count > MAX_LOGIN_ATTEMPTS:
        return False
    if getattr(user, "password_hash", None) == hash_password(password):
        _attempts[email] = 0
        return True
    _attempts[email] = count - 1
    return False


def logout(user_id):
    return user_id in db.users


def reset_attempts():
    _attempts.clear()
