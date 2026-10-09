"""
Order Controller managing checkout, discount aggregation, and invoice generation.
"""

from typing import Dict, Any
from models import Order
from pricing_service import PricingService


class OrderController:
    def __init__(self, pricing_service: PricingService = None):
        self.pricing_service = pricing_service or PricingService()

    def checkout(self, order: Order) -> Dict[str, Any]:
        """Calculates item totals, discounts, taxes, and final payable amount."""
        subtotal = self.pricing_service.calculate_subtotal(order)
        bulk_discount = self.pricing_service.calculate_bulk_discount(order)
        cust_discount = self.pricing_service.calculate_customer_discount(order.customer, subtotal)
        
        coupon_discount = 0.0
        if order.coupon_code:
            coupon_discount = self.pricing_service.calculate_coupon_discount(order.coupon_code, subtotal)

        total_discounts = bulk_discount + cust_discount + coupon_discount
        discounted_subtotal = max(0.0, subtotal - total_discounts)

        # BUG: Sales tax was calculated on raw subtotal instead of discounted_subtotal
        tax = discounted_subtotal * order.tax_rate
        final_total = round(discounted_subtotal + tax, 2)

        return {
            "order_id": order.order_id,
            "subtotal": round(subtotal, 2),
            "bulk_discount": round(bulk_discount, 2),
            "customer_discount": round(cust_discount, 2),
            "coupon_discount": round(coupon_discount, 2),
            "total_discounts": round(total_discounts, 2),
            "discounted_subtotal": round(discounted_subtotal, 2),
            "tax": round(tax, 2),
            "final_total": final_total
        }
