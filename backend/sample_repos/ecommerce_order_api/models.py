"""
Domain models for Ecommerce Order API.
"""

from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class OrderItem:
    item_id: str
    name: str
    unit_price: float
    quantity: int

    @property
    def total_price(self) -> float:
        return self.unit_price * self.quantity


@dataclass
class Customer:
    customer_id: str
    name: str
    is_vip: bool = False
    discount_tier: float = 0.0  # e.g., 0.10 for 10%


@dataclass
class Order:
    order_id: str
    customer: Customer
    items: List[OrderItem] = field(default_factory=list)
    coupon_code: Optional[str] = None
    tax_rate: float = 0.08  # 8% sales tax
