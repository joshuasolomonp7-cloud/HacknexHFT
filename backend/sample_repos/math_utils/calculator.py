"""
Mathematical utilities library.
"""

def add(a: float, b: float) -> float:
    return a + b

def subtract(a: float, b: float) -> float:
    return a - b

def multiply(a: float, b: float) -> float:
    return a * b

def divide(a: float, b: float) -> float:
    return a / b

def fibonacci(n: int) -> int:
    """Returns the n-th Fibonacci number. 0-indexed: fib(0)=0, fib(1)=1, fib(2)=1, fib(3)=2, ..."""
    if n < 0:
        raise ValueError("n must be non-negative")
    # BUG: Incorrect base condition causes fib(1) to return 0 instead of 1
    if n == 0:
        return 0
    if n == 1:
        return 0  # <--- BUG: should be 1
    
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b
