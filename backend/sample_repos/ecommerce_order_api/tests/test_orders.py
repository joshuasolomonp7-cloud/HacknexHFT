"""
Unit and integration tests for Ecommerce Order API.
"""

import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from models import Customer, OrderItem, Order
from pricing_service import PricingService
from order_controller import OrderController


class TestOrdersAPI(unittest.TestCase):
    def setUp(self):
        self.pricing = PricingService()
        self.controller = OrderController(self.pricing)
        self.std_customer = Customer(customer_id="C001", name="Alice", is_vip=False)
        self.vip_customer = Customer(customer_id="C002", name="Bob", is_vip=True, discount_tier=0.15)

    def test_single_item_basic_pricing(self):
        item = OrderItem(item_id="P1", name="Wireless Mouse", unit_price=50.0, quantity=1)
        order = Order(order_id="ORD-101", customer=self.std_customer, items=[item])
        
        res = self.controller.checkout(order)
        self.assertEqual(res["subtotal"], 50.0)
        self.assertEqual(res["total_discounts"], 0.0)
        # 50.0 + 8% tax (4.0) = 54.0
        self.assertEqual(res["final_total"], 54.0)

    def test_bulk_discount_threshold_10_items(self):
        # 10 items @ $20.0 = $200.0 subtotal
        # Bulk discount should be 10% ($20.0)
        item = OrderItem(item_id="P2", name="USB-C Cable", unit_price=20.0, quantity=10)
        order = Order(order_id="ORD-102", customer=self.std_customer, items=[item])

        bulk_disc = self.pricing.calculate_bulk_discount(order)
        self.assertEqual(bulk_disc, 20.0)  # Fails with current bug (> 10 instead of >= 10)

    def test_vip_customer_discount(self):
        item = OrderItem(item_id="P3", name="Mechanical Keyboard", unit_price=100.0, quantity=1)
        order = Order(order_id="ORD-103", customer=self.vip_customer, items=[item])

        cust_disc = self.pricing.calculate_customer_discount(self.vip_customer, 100.0)
        self.assertEqual(cust_disc, 15.0)

    def test_discounted_subtotal_tax_calculation(self):
        # Subtotal: $100.0, Coupon SAVE20 gives $20 discount -> Discounted subtotal: $80.0
        # Tax should be 8% of $80 = $6.40, Total = $86.40 (Bug calculates tax on $100 -> $8.00)
        item = OrderItem(item_id="P4", name="Headphones", unit_price=100.0, quantity=1)
        order = Order(order_id="ORD-104", customer=self.std_customer, items=[item], coupon_code="SAVE20")

        res = self.controller.checkout(order)
        self.assertEqual(res["coupon_discount"], 20.0)
        self.assertEqual(res["discounted_subtotal"], 80.0)
        self.assertEqual(res["tax"], 6.40)  # Fails with current bug (returns 8.00)
        self.assertEqual(res["final_total"], 86.40)


if __name__ == "__main__":
    unittest.main()
