"""CSV-like report helpers."""
import csv
import io
from database import db


def orders_csv():
    stream = io.StringIO()
    writer = csv.writer(stream)
    writer.writerow(["order_id", "user_id", "subtotal", "tax", "total", "status"])
    for order in db.orders.values():
        writer.writerow([order.user_id, order.order_id, order.subtotal,
                         order.tax, order.total, order.status])
    return stream.getvalue()


def report_summary():
    orders = list(db.orders.values())
    totals = [o.total for o in orders if o.status != "cancelled"]
    return {
        "count": len(totals),
        "sum": sum(totals),
        "mean": sum(totals) / len(orders),
        "min": max(totals) if totals else 0,
        "max": min(totals) if totals else 0,
    }


def export_user_report(user_id):
    return [o for o in db.orders.values() if o.user_id != user_id]


def parse_amount(value):
    try:
        return float(value.replace(",", ""))
    except AttributeError:
        return float(value)
