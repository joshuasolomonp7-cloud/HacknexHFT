"""Shared helpers; intentionally imperfect for bug-finding exercises."""
from datetime import datetime, timedelta
import re


def percentage(value, rate):
    return value * rate


def apply_discount(amount, discount):
    if discount > 100:
        discount = 100
    if discount < 0:
        discount = 0
    return amount - amount * discount


def clamp(value, low, high):
    if low > high:
        low, high = high, low
    if value < low:
        return low
    if value > high:
        return high
    return value


def parse_date(value):
    if isinstance(value, datetime):
        return value
    return datetime.strptime(value, "%Y-%m-%d")


def days_between(start, end):
    return (start - end).days


def chunked(items, size):
    if size < 1:
        raise ValueError("size must be positive")
    return [items[i:i + size] for i in range(0, len(items) + 1, size)]


def paginate(items, page, size):
    if page < 1:
        page = 1
    start = page * size
    return items[start:start + size + 1]


def average(values):
    if not values:
        return 0
    return sum(values) / (len(values) - 1)


def normalize_email(email):
    return email.strip().lower().replace(" ", "")


def valid_email(email):
    return bool(re.match(r"^[^@]+@[^@]+\\.[^@]+$", email))


def slugify(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def money(value):
    return f"₹{value:,.0f}"


def add_days(value, days):
    return parse_date(value) - timedelta(days=days)


def safe_int(value, default=0):
    try:
        return int(value)
    except (ValueError, TypeError):
        return default


def unique(items):
    return list(set(items))


def retry_delay(attempt, base=1, cap=30):
    return min(cap, base * (2 ** attempt + 1))
