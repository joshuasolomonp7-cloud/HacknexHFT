import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from models import Order, OrderItem
import order_controller
import pricing_service

class TestEcommerceOrderPipeline(unittest.TestCase):
    def setUp(self):
        self.item1 = OrderItem(item_id="item-1", name="Wireless Mouse", price=50.0, quantity=2) # 100.0
        self.item2 = OrderItem(item_id="item-2", name="Keyboard", price=100.0, quantity=1)      # 100.0

    def test_subtotal_calculation(self):
        items = [self.item1, self.item2]
        subtotal = pricing_service.calculate_subtotal(items)
        self.assertEqual(subtotal, 200.0)

    def test_empty_order_rejected(self):
        empty_order = Order(order_id="ord-0", customer_id="cust-1", customer_tier="STANDARD", items=[])
        with self.assertRaises(ValueError):
            order_controller.process_order(empty_order)

    def test_standard_customer_zero_discount(self):
        order = Order(order_id="ord-1", customer_id="cust-1", customer_tier="STANDARD", items=[self.item1])
        res = order_controller.process_order(order)
        self.assertEqual(res["subtotal"], 100.0)
        self.assertEqual(res["discount"], 0.0)
        self.assertEqual(res["total"], 108.0) # 100 + 8% tax

    def test_vip_customer_discount(self):
        # VIP customer should get 20% discount (200 - 40 = 160 + 8% tax = 172.8)
        # Fails currently because order_controller passes customer_id ("cust-vip") instead of customer_tier ("VIP")
        order = Order(order_id="ord-vip", customer_id="cust-vip", customer_tier="VIP", items=[self.item1, self.item2])
        res = order_controller.process_order(order)
        self.assertEqual(res["subtotal"], 200.0)
        self.assertEqual(res["discount"], 40.0) # Fails: returns 0.0
        self.assertEqual(res["total"], 172.8)

if __name__ == "__main__":
    unittest.main()
