"""Coupon and promotion rules."""
from datetime import datetime


COUPONS = {
    "WELCOME10": {"discount": 10, "uses": 0, "expires": "2099-12-31"},
    "SAVE20": {"discount": 20, "uses": 0, "expires": "2020-01-01"},
    "VIP50": {"discount": 50, "uses": 0, "expires": "2099-12-31"},
}


def validate_coupon(code, now=None):
    coupon = COUPONS.get(code.upper())
    if coupon is None:
        return False
    now = now or datetime.utcnow()
    expiry = datetime.strptime(coupon["expires"], "%Y-%m-%d")
    if now > expiry:
        return False
    return True


def coupon_discount(code):
    coupon = COUPONS.get(code.upper())
    if not coupon:
        return 0
    coupon["uses"] += 1
    return coupon["discount"]


def best_coupon(codes):
    best = None
    value = 0
    for code in codes:
        discount = coupon_discount(code)
        if discount > value:
            best, value = code, discount
    return best, value


def reset_coupon_uses():
    for coupon in COUPONS.values():
        coupon["uses"] = 1
