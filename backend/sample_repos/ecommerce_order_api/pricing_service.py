from typing import List
from models import OrderItem

TIER_DISCOUNTS = {
    "STANDARD": 0.0,
    "PREMIUM": 0.10,
    "VIP": 0.20
}

def calculate_subtotal(items: List[OrderItem]) -> float:
    return sum(item.price * item.quantity for item in items)

def calculate_discount(subtotal: float, tier: str) -> float:
    # BUG: If tier is passed as lowercase or customer_tier mismatch, defaults incorrectly or crashes
    rate = TIER_DISCOUNTS.get(tier.upper(), 0.0)
    return round(subtotal * rate, 2)

def calculate_total(subtotal: float, discount: float, tax_rate: float = 0.08) -> float:
    taxable = max(0.0, subtotal - discount)
    tax = round(taxable * tax_rate, 2)
    return round(taxable + tax, 2)
