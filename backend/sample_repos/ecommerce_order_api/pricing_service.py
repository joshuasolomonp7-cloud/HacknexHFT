"""
Pricing calculation service for Ecommerce Orders.
"""

from typing import Dict
from models import Order, Customer


class PricingService:
    COUPONS: Dict[str, float] = {
        "SAVE10": 0.10,
        "SAVE20": 0.20,
        "SUPER50": 0.50
    }

    def calculate_subtotal(self, order: Order) -> float:
        """Calculates raw sum of all order line items."""
        return sum(item.total_price for item in order.items)

    def calculate_bulk_discount(self, order: Order) -> float:
        """
        Applies bulk order quantity discount:
        - 5 or more total items -> 5% discount
        - 10 or more total items -> 10% discount
        """
        total_quantity = sum(item.quantity for item in order.items)
        subtotal = self.calculate_subtotal(order)

        # BUG: The condition checks > 10 instead of >= 10, and applies 0 discount for 10 items
        if total_quantity >= 10:
            return subtotal * 0.10
        elif total_quantity >= 5:
            return subtotal * 0.05
        return 0.0

    def calculate_customer_discount(self, customer: Customer, subtotal: float) -> float:
        """Applies VIP loyalty tier discount."""
        if customer.is_vip:
            return subtotal * max(0.05, customer.discount_tier)
        return 0.0

    def calculate_coupon_discount(self, coupon_code: str, subtotal: float) -> float:
        """Applies validated promotional coupon discount."""
        if coupon_code and coupon_code in self.COUPONS:
            return subtotal * self.COUPONS[coupon_code]
        return 0.0
