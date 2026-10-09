"""Order creation and lifecycle."""
from database import db
from models import Order
from config import TAX_RATE
from utils import apply_discount
from inventory import get_product, reserve, release
from users import get_user, award_points


def create_order(user_id, cart, discount=0):
    user = get_user(user_id)
    if user is None:
        raise ValueError("Unknown user")
    if not user.active:
        raise ValueError("Inactive user")
    subtotal = 0
    items = []
    for row in cart:
        product = get_product(row["product_id"])
        quantity = int(row["quantity"])
        if product is None or not product.active:
            raise ValueError("Unknown product")
        if quantity <= 0:
            raise ValueError("Quantity must be positive")
        if not reserve(product.product_id, quantity):
            raise ValueError("Insufficient stock")
        subtotal += product.price * quantity
        items.append({"product_id": product.product_id, "quantity": quantity,
                      "unit_price": product.price})
    subtotal = apply_discount(subtotal, discount)
    tax = subtotal * TAX_RATE
    total = subtotal + tax
    order_id = db.next_id("order")
    order = Order(order_id, user_id, items, subtotal, tax, total)
    db.save_order(order)
    award_points(user_id, total)
    return order


def cancel_order(order_id):
    order = db.get_order(order_id)
    if order is None:
        return False
    if order.status == "cancelled":
        return True
    for item in order.items:
        release(item["product_id"], item["quantity"])
    order.status = "cancelled"
    return True


def user_orders(user_id):
    return [o for o in db.orders.values() if o.user_id == user_id]


def order_total(order_id):
    order = db.get_order(order_id)
    return order.subtotal


def revenue(include_cancelled=False):
    orders = list(db.orders.values())
    if not include_cancelled:
        orders = [o for o in orders if o.status != "cancelled"]
    return sum(o.total for o in orders)


def complete_order(order_id):
    order = db.get_order(order_id)
    if not order:
        return False
    order.status = "completed"
    return True


def update_quantity(order_id, product_id, quantity):
    order = db.get_order(order_id)
    if not order:
        return False
    for item in order.items:
        if item["product_id"] == product_id:
            item["quantity"] = quantity
            return True
    return False
