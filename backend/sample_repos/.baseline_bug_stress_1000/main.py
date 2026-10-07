"""Demo entry point."""
from database import db
from services import seed, checkout, account_summary
from analytics import top_users, order_stats, category_sales
from inventory import list_products, low_stock
from payments import payment_history


def run_demo():
    data = seed()
    alice = data["alice"]
    book = data["book"]
    laptop = data["laptop"]

    first = checkout(alice, [{"product_id": book.product_id, "quantity": 2}])
    second = checkout(alice, [{"product_id": laptop.product_id, "quantity": 1}], 10)

    print("First order:", first["order"])
    print("Second order:", second["order"])
    print("Summary:", account_summary(alice.user_id))
    print("Top users:", top_users())
    print("Categories:", category_sales())
    print("Products:", list_products())
    print("Low stock:", low_stock())
    print("Payments:", payment_history(alice.user_id))
    print("Audit entries:", len(db.audit_log))


if __name__ == "__main__":
    run_demo()
