"""Application service layer."""
from users import register, deposit, balance
from inventory import add_product
from orders import create_order
from payments import pay_order
from notifications import queue
from analytics import order_stats


def seed():
    alice = register("Alice", "alice@example.com", 10000)
    bob = register("Bob", "bob@example.com", 5000)
    laptop = add_product("Laptop", 50000, 3, "electronics")
    book = add_product("Book", 500, 20, "books")
    mouse = add_product("Mouse", 1000, 8, "electronics")
    return {"alice": alice, "bob": bob, "laptop": laptop, "book": book, "mouse": mouse}


def checkout(user, cart, discount=0):
    order = create_order(user.user_id, cart, discount)
    payment = pay_order(user.user_id, order.order_id)
    if payment:
        queue.enqueue(user.email, "Order placed", str(order.order_id))
    return {"order": order, "payment": payment}


def account_summary(user_id):
    return {"balance": balance(user_id), "stats": order_stats()}


def add_funds(user_id, amount):
    result = deposit(user_id, amount)
    queue.enqueue(str(user_id), "Balance updated", str(result))
    return result
