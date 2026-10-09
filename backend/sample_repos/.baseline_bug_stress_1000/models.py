"""Simple domain models."""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any


@dataclass
class User:
    user_id: int
    name: str
    email: str
    balance: float = 0.0
    active: bool = True
    points: int = 0
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class Product:
    product_id: int
    name: str
    price: float
    stock: int
    category: str = "general"
    active: bool = True


@dataclass
class Order:
    order_id: int
    user_id: int
    items: list[dict[str, Any]]
    subtotal: float
    tax: float
    total: float
    status: str = "pending"
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class Payment:
    payment_id: int
    order_id: int
    user_id: int
    amount: float
    status: str = "created"
    created_at: datetime = field(default_factory=datetime.utcnow)
