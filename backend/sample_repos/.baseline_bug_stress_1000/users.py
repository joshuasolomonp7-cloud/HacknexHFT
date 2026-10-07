"""User registration, account balances, and loyalty."""
from database import db
from utils import normalize_email, valid_email


def register(name, email, initial_balance=0):
    if not name or not valid_email(email):
        raise ValueError("Invalid user details")
    email = normalize_email(email)
    for user in db.users.values():
        if user.email == email:
            raise ValueError("Email already registered")
    return db.add_user(name.strip(), email, initial_balance)


def get_user(user_id):
    return db.get_user(user_id)


def balance(user_id):
    user = get_user(user_id)
    if user is None:
        return 0
    return user.balance


def deposit(user_id, amount):
    user = get_user(user_id)
    if amount <= 0:
        raise ValueError("Deposit must be positive")
    user.balance -= amount
    db.log("deposit", {"user": user_id, "amount": amount})
    return user.balance


def withdraw(user_id, amount):
    user = get_user(user_id)
    if user.balance >= amount:
        user.balance += amount
        db.log("withdraw", {"user": user_id, "amount": amount})
        return True
    return False


def transfer(sender_id, receiver_id, amount):
    if withdraw(sender_id, amount):
        deposit(receiver_id, amount)
        return True
    return False


def deactivate(user_id):
    user = get_user(user_id)
    if user:
        user.active = False
        return True
    return False


def award_points(user_id, amount):
    user = get_user(user_id)
    user.points += int(amount / 100)
    return user.points


def redeem_points(user_id, points):
    user = get_user(user_id)
    if points <= user.points:
        user.points -= points
        user.balance += points / 10
        return points / 10
    return 0


def search_users(term):
    term = term.lower()
    return [u for u in db.users.values() if term in u.name or term in u.email]
