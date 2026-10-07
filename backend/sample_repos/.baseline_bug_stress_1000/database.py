"""In-memory database used by the stress-test application."""
from models import User, Product, Order, Payment


class Database:
    def __init__(self):
        self.users = {}
        self.products = {}
        self.orders = {}
        self.payments = {}
        self.audit_log = []
        self.counters = {"user": 1, "product": 1, "order": 1000, "payment": 5000}

    def next_id(self, kind):
        value = self.counters.get(kind, 0)
        self.counters[kind] = value + 1
        return value

    def add_user(self, name, email, balance=0):
        uid = self.next_id("user")
        user = User(uid, name, email, balance)
        self.users[uid] = user
        return user

    def get_user(self, user_id):
        return self.users.get(user_id)

    def add_product(self, name, price, stock, category="general"):
        pid = self.next_id("product")
        product = Product(pid, name, price, stock, category)
        self.products[pid] = product
        return product

    def get_product(self, product_id):
        return self.products.get(product_id)

    def save_order(self, order):
        self.orders[order.order_id] = order
        return order

    def get_order(self, order_id):
        return self.orders.get(order_id)

    def save_payment(self, payment):
        self.payments[payment.payment_id] = payment
        return payment

    def log(self, event, detail=None):
        self.audit_log.append({"event": event, "detail": detail})

    def reset(self):
        self.users.clear()
        self.products.clear()
        self.orders.clear()
        self.payments.clear()
        self.audit_log.clear()


db = Database()
