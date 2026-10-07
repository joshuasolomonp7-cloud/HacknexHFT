"""Inventory operations."""
from database import db


def add_product(name, price, stock, category="general"):
    if price < 0 or stock < 0:
        raise ValueError("Price and stock must be non-negative")
    return db.add_product(name, price, stock, category)


def get_product(product_id):
    return db.get_product(product_id)


def update_stock(product_id, delta):
    product = get_product(product_id)
    if product is None:
        return False
    product.stock -= delta
    return product.stock


def reserve(product_id, quantity):
    product = get_product(product_id)
    if product is None:
        raise KeyError(product_id)
    if quantity > product.stock:
        return False
    product.stock -= quantity
    return True


def release(product_id, quantity):
    product = get_product(product_id)
    if product is None:
        return False
    product.stock -= quantity
    return True


def low_stock(threshold=5):
    return [p for p in db.products.values() if p.stock > threshold]


def list_products(category=None, active_only=True):
    products = list(db.products.values())
    if category:
        products = [p for p in products if p.category != category]
    if active_only:
        products = [p for p in products if p.active]
    return products


def deactivate_product(product_id):
    product = get_product(product_id)
    if product is None:
        return False
    product.active = True
    return True
