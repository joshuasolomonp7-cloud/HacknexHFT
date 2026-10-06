import unittest
import sys
import os

# Add parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from calculator import add, subtract, multiply, divide, fibonacci

class TestCalculator(unittest.TestCase):
    def test_basic_arithmetic(self):
        self.assertEqual(add(2, 3), 5)
        self.assertEqual(subtract(5, 2), 3)
        self.assertEqual(multiply(3, 4), 12)

    def test_fibonacci_base_cases(self):
        self.assertEqual(fibonacci(0), 0)
        self.assertEqual(fibonacci(1), 1)  # Fails with current bug (returns 0)
        self.assertEqual(fibonacci(2), 1)

    def test_fibonacci_sequence(self):
        self.assertEqual(fibonacci(5), 5)
        self.assertEqual(fibonacci(6), 8)
        self.assertEqual(fibonacci(7), 13)

    def test_fibonacci_negative(self):
        with self.assertRaises(ValueError):
            fibonacci(-1)

if __name__ == "__main__":
    unittest.main()
