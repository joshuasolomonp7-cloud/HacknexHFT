from typing import Dict, Any
from models import Order
import pricing_service

def process_order(order: Order) -> Dict[str, Any]:
    """Processes customer order and returns itemized receipt."""
    if not order.items:
        raise ValueError("Cannot process empty order")

    subtotal = pricing_service.calculate_subtotal(order.items)
    
    # MULTI-FILE BUG: Order has customer_tier, but controller erroneously passed order.customer_id instead of order.customer_tier
    discount = pricing_service.calculate_discount(subtotal, order.customer_id)
    
    total = pricing_service.calculate_total(subtotal, discount)

    return {
        "order_id": order.order_id,
        "subtotal": subtotal,
        "discount": discount,
        "total": total,
        "status": "PROCESSED"
    }
