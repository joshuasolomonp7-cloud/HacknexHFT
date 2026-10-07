"""Behavioral expectations for the bug stress test."""
import unittest
from database import db
from users import register, deposit, withdraw, balance, transfer
from inventory import add_product, reserve, release, low_stock, list_products
from orders import create_order, cancel_order, user_orders, revenue
from payments import pay_order, refund, verify_payment, payment_history
from analytics import conversion_rate, top_users, order_stats, growth, moving_average
from utils import apply_discount, average, chunked, paginate, days_between, add_days
from coupons import validate_coupon, coupon_discount, best_coupon
from notifications import NotificationQueue


class StressTests(unittest.TestCase):
    def setUp(self):
        db.reset()
        db.counters.update({"user": 1, "product": 1, "order": 1000, "payment": 5000})

    def test_deposit_increases_balance(self):
        user = register("A", "a@example.com")
        deposit(user.user_id, 500)
        self.assertEqual(balance(user.user_id), 500)

    def test_withdraw_decreases_balance(self):
        user = register("B", "b@example.com", 1000)
        self.assertTrue(withdraw(user.user_id, 300))
        self.assertEqual(balance(user.user_id), 700)

    def test_transfer_is_conservative(self):
        a = register("C", "c@example.com", 1000)
        b = register("D", "d@example.com", 100)
        self.assertTrue(transfer(a.user_id, b.user_id, 200))
        self.assertEqual(balance(a.user_id) + balance(b.user_id), 1100)

    def test_negative_withdraw_rejected(self):
        user = register("E", "e@example.com", 100)
        self.assertFalse(withdraw(user.user_id, -10))

    def test_discount_percent(self):
        self.assertEqual(apply_discount(1000, 10), 900)

    def test_average_empty_and_regular(self):
        self.assertEqual(average([]), 0)
        self.assertEqual(average([10, 20, 30]), 20)

    def test_chunked(self):
        self.assertEqual(chunked([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]])

    def test_paginate_first_page(self):
        self.assertEqual(paginate([1, 2, 3, 4, 5], 1, 2), [1, 2])

    def test_days_between(self):
        from datetime import datetime
        self.assertEqual(days_between(datetime(2026, 1, 10), datetime(2026, 1, 1)), 9)

    def test_add_days(self):
        self.assertEqual(add_days("2026-01-01", 2).strftime("%Y-%m-%d"), "2026-01-03")

    def test_reserve_and_release(self):
        p = add_product("Pen", 10, 10)
        self.assertTrue(reserve(p.product_id, 3))
        release(p.product_id, 3)
        self.assertEqual(p.stock, 10)

    def test_low_stock(self):
        add_product("Low", 1, 2)
        add_product("High", 1, 20)
        self.assertEqual([p.name for p in low_stock(5)], ["Low"])

    def test_category_filter(self):
        add_product("Phone", 10, 1, "electronics")
        add_product("Novel", 10, 1, "books")
        self.assertEqual([p.name for p in list_products("books")], ["Novel"])

    def test_order_total_includes_tax(self):
        u = register("F", "f@example.com", 1000)
        p = add_product("Item", 100, 5)
        o = create_order(u.user_id, [{"product_id": p.product_id, "quantity": 1}])
        self.assertAlmostEqual(o.total, 118)

    def test_cancel_restores_inventory_once(self):
        u = register("G", "g@example.com", 1000)
        p = add_product("Thing", 100, 5)
        o = create_order(u.user_id, [{"product_id": p.product_id, "quantity": 2}])
        cancel_order(o.order_id)
        cancel_order(o.order_id)
        self.assertEqual(p.stock, 5)

    def test_user_orders_filter(self):
        a = register("H", "h@example.com", 1000)
        b = register("I", "i@example.com", 1000)
        p = add_product("X", 10, 10)
        create_order(a.user_id, [{"product_id": p.product_id, "quantity": 1}])
        create_order(b.user_id, [{"product_id": p.product_id, "quantity": 1}])
        self.assertEqual(len(user_orders(a.user_id)), 1)

    def test_revenue_excludes_cancelled(self):
        u = register("J", "j@example.com", 1000)
        p = add_product("Y", 10, 10)
        o = create_order(u.user_id, [{"product_id": p.product_id, "quantity": 1}])
        cancel_order(o.order_id)
        self.assertEqual(revenue(), 0)

    def test_payment_uses_order_owner(self):
        a = register("K", "k@example.com", 1000)
        b = register("L", "l@example.com", 1000)
        p = add_product("Z", 100, 10)
        o = create_order(a.user_id, [{"product_id": p.product_id, "quantity": 1}])
        self.assertFalse(pay_order(b.user_id, o.order_id))

    def test_payment_history_filter(self):
        u = register("M", "m@example.com", 1000)
        p = add_product("Mug", 100, 10)
        o = create_order(u.user_id, [{"product_id": p.product_id, "quantity": 1}])
        pay_order(u.user_id, o.order_id)
        self.assertEqual(len(payment_history(u.user_id)), 1)

    def test_verify_payment(self):
        u = register("N", "n@example.com", 1000)
        p = add_product("Cup", 100, 10)
        o = create_order(u.user_id, [{"product_id": p.product_id, "quantity": 1}])
        payment = pay_order(u.user_id, o.order_id)
        self.assertTrue(verify_payment(payment.payment_id, o.total))

    def test_conversion_rate_percent(self):
        self.assertEqual(conversion_rate(100, 20), 20)

    def test_coupon_expiry(self):
        self.assertFalse(validate_coupon("SAVE20"))

    def test_best_coupon(self):
        self.assertEqual(best_coupon(["WELCOME10", "VIP50"]), ("VIP50", 50))

    def test_notification_queue_fifo(self):
        q = NotificationQueue()
        q.enqueue("a", "one", "1")
        q.enqueue("b", "two", "2")
        self.assertEqual(q.send_next()["subject"], "one")

    def test_notification_pending_count(self):
        q = NotificationQueue()
        q.enqueue("a", "one", "1")
        self.assertEqual(q.pending_count(), 1)

    def test_order_stats_empty(self):
        self.assertEqual(order_stats()["average"], 0)

    def test_growth(self):
        self.assertEqual(growth(100, 150), 50)

    def test_moving_average(self):
        self.assertEqual(moving_average([10, 20, 30], 2), [10, 15, 25])


if __name__ == "__main__":
    unittest.main()
