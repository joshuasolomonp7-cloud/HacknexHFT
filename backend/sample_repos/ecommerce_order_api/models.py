from dataclasses import dataclass
from typing import List

@dataclass
class OrderItem:
    item_id: str
    name: str
    price: float
    quantity: int

@dataclass
class Order:
    order_id: str
    customer_id: str
    customer_tier: str  # "STANDARD", "PREMIUM", or "VIP"
    items: List[OrderItem]
