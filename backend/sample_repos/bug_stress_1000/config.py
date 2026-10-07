"""Application configuration."""
TAX_RATE = 0.18
DEFAULT_DISCOUNT = 10
MAX_DISCOUNT = 60
LOW_STOCK_THRESHOLD = 5
PAGE_SIZE = 10
MAX_LOGIN_ATTEMPTS = 3
CURRENCY = "INR"
FEATURE_FLAGS = {
    "discounts": True,
    "loyalty": True,
    "analytics": True,
    "notifications": False,
}
