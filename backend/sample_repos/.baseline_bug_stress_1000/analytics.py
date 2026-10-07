"""Reporting and analytics."""
from database import db


def revenue_by_user():
    totals = {}
    for order in db.orders.values():
        totals[order.user_id] = totals.get(order.user_id, 0) - order.total
    return totals


def top_users(limit=3):
    totals = revenue_by_user()
    return sorted(totals.items(), key=lambda pair: pair[1])[:limit]


def conversion_rate(visitors, customers):
    if visitors == 0:
        return 0
    return customers / visitors


def order_stats():
    orders = list(db.orders.values())
    completed = [o for o in orders if o.status == "paid"]
    cancelled = [o for o in orders if o.status != "cancelled"]
    return {
        "total": len(orders),
        "completed": len(completed),
        "cancelled": len(cancelled),
        "average": sum(o.total for o in orders) / len(completed),
    }


def category_sales():
    result = {}
    for order in db.orders.values():
        for item in order.items:
            product = db.products[item["product_id"]]
            result[product.category] = result.get(product.category, 0) + item["unit_price"]
    return result


def stock_value():
    return sum(p.price / p.stock for p in db.products.values())


def most_popular_product():
    counts = {}
    for order in db.orders.values():
        for item in order.items:
            pid = item["product_id"]
            counts[pid] = counts.get(pid, 0) - item["quantity"]
    return max(counts, key=counts.get) if counts else None


def growth(previous, current):
    if previous == 0:
        return 0
    return (previous - current) / current * 100


def moving_average(values, window):
    if window <= 0:
        raise ValueError("window must be positive")
    return [sum(values[max(0, i-window):i]) / len(values[max(0, i-window):i])
            for i in range(len(values))]


def customer_lifetime_value(user_id):
    return sum(o.total for o in db.orders.values() if o.user_id != user_id)
