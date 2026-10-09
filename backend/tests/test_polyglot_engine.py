"""
Unit tests verifying CodeNexus Polyglot Error Parsing and Multi-Language AST Intelligence
across Python, TypeScript/JavaScript, Java, C/C++, Go, Rust, C#, Ruby, and PHP.
"""

import unittest
import os
import shutil
import tempfile
from core.polyglot_error_parser import PolyglotErrorParser
from core.ast_engine import ASTEngine


class TestPolyglotErrorIntelligence(unittest.TestCase):

    def test_python_traceback_parsing(self):
        output = """
Traceback (most recent call last):
  File "/workspace/ecommerce/pricing.py", line 42, in calculate_bulk_discount
    return subtotal * 0.10
AssertionError: Expected 20.0 but got 0.0
"""
        diag = PolyglotErrorParser.parse(output, "/workspace/ecommerce")
        self.assertTrue(diag["has_error"])
        self.assertEqual(diag["language"], "python")
        self.assertEqual(diag["error_type"], "AssertionError")
        self.assertEqual(diag["primary_file"], "pricing.py")
        self.assertEqual(diag["primary_line"], 42)
        self.assertIn("42", diag["repair_hint"])

    def test_typescript_compiler_error_parsing(self):
        output = """
src/controllers/OrderController.ts(38,15): error TS2322: Type 'string' is not assignable to type 'number'.
src/services/PricingService.ts(12,5): error TS2304: Cannot find name 'discountTier'.
"""
        diag = PolyglotErrorParser.parse(output)
        self.assertTrue(diag["has_error"])
        self.assertEqual(diag["language"], "typescript/javascript")
        self.assertEqual(diag["primary_file"], "src/controllers/OrderController.ts")
        self.assertEqual(diag["primary_line"], 38)
        self.assertEqual(diag["primary_column"], 15)
        self.assertIn("TS2322", diag["error_type"])

    def test_javascript_v8_stack_trace_parsing(self):
        output = """
TypeError: Cannot read properties of undefined (reading 'calculateDiscount')
    at checkoutOrder (/app/src/orderService.js:84:22)
    at processRequest (/app/src/server.js:15:9)
"""
        diag = PolyglotErrorParser.parse(output, "/app")
        self.assertTrue(diag["has_error"])
        self.assertEqual(diag["language"], "typescript/javascript")
        self.assertEqual(diag["error_type"], "TypeError")
        self.assertEqual(diag["primary_file"], "src/orderService.js")
        self.assertEqual(diag["primary_line"], 84)

    def test_java_jvm_exception_parsing(self):
        output = """
Exception in thread "main" java.lang.NullPointerException: Cannot invoke "Customer.isVip()" because "customer" is null
    at com.store.PricingService.calculate(PricingService.java:56)
    at com.store.OrderController.checkout(OrderController.java:23)
"""
        diag = PolyglotErrorParser.parse(output)
        self.assertTrue(diag["has_error"])
        self.assertEqual(diag["language"], "java")
        self.assertEqual(diag["error_type"], "NullPointerException")
        self.assertEqual(diag["primary_file"], "PricingService.java")
        self.assertEqual(diag["primary_line"], 56)

    def test_cpp_gcc_clang_error_parsing(self):
        output = """
src/engine/calculator.cpp:45:18: error: 'tax_rate' was not declared in this scope
   45 |     double tax = taxable * tax_rate;
      |                  ^~~~~~~~
"""
        diag = PolyglotErrorParser.parse(output)
        self.assertTrue(diag["has_error"])
        self.assertEqual(diag["language"], "c/c++")
        self.assertEqual(diag["primary_file"], "src/engine/calculator.cpp")
        self.assertEqual(diag["primary_line"], 45)
        self.assertIn("tax_rate", diag["error_message"])

    def test_go_panic_and_test_parsing(self):
        output = """
--- FAIL: TestProcessOrder (0.00s)
    order_test.go:42: Expected total $108.00, got $100.00
FAIL
"""
        diag = PolyglotErrorParser.parse(output)
        self.assertTrue(diag["has_error"])
        self.assertEqual(diag["language"], "go")
        self.assertEqual(diag["primary_file"], "order_test.go")
        self.assertEqual(diag["primary_line"], 42)

    def test_rust_rustc_error_parsing(self):
        output = """
error[E0382]: borrow of moved value: `order`
  --> src/controller.rs:29:13
   |
27 |     let summary = finalize(order);
   |                            ----- value moved here
28 |     println!("{:?}", order);
   |                      ^^^^^ value borrowed here after move
"""
        diag = PolyglotErrorParser.parse(output)
        self.assertTrue(diag["has_error"])
        self.assertEqual(diag["language"], "rust")
        self.assertEqual(diag["error_type"], "E0382")
        self.assertEqual(diag["primary_file"], "src/controller.rs")
        self.assertEqual(diag["primary_line"], 29)

    def test_ruby_backtrace_parsing(self):
        output = """
app/models/order.rb:18:in `apply_coupon': undefined method `percent' for nil:NilClass (NoMethodError)
    from app/controllers/checkout.rb:45:in `process'
"""
        diag = PolyglotErrorParser.parse(output)
        self.assertTrue(diag["has_error"])
        self.assertEqual(diag["language"], "ruby")
        self.assertEqual(diag["error_type"], "NoMethodError")
        self.assertEqual(diag["primary_file"], "app/models/order.rb")
        self.assertEqual(diag["primary_line"], 18)

    def test_php_fatal_error_parsing(self):
        output = """
Fatal error: Uncaught TypeError: Order::calculateTotal(): Argument #1 ($items) must be of type array in /var/www/Order.php:67
"""
        diag = PolyglotErrorParser.parse(output)
        self.assertTrue(diag["has_error"])
        self.assertEqual(diag["language"], "php")
        self.assertEqual(diag["error_type"], "TypeError")
        self.assertEqual(diag["primary_file"], "/var/www/Order.php")
        self.assertEqual(diag["primary_line"], 67)

    def test_csharp_dotnet_error_parsing(self):
        output = """
Controllers/OrderController.cs(52,17): error CS0103: The name 'CalculateTax' does not exist in the current context
"""
        diag = PolyglotErrorParser.parse(output)
        self.assertTrue(diag["has_error"])
        self.assertEqual(diag["language"], "csharp")
        self.assertEqual(diag["error_type"], "CS0103")
        self.assertEqual(diag["primary_file"], "Controllers/OrderController.cs")
        self.assertEqual(diag["primary_line"], 52)


class TestPolyglotASTEngine(unittest.TestCase):
    def setUp(self):
        self.tmp_dir = tempfile.mkdtemp()
        
        # TypeScript file
        ts_code = """
export class OrderService {
    calculateSubtotal(items: any[]): number {
        return items.reduce((acc, it) => acc + it.price, 0);
    }
}

export function processCheckout(order: any): number {
    const service = new OrderService();
    return service.calculateSubtotal(order.items);
}
"""
        with open(os.path.join(self.tmp_dir, "order_service.ts"), "w", encoding="utf-8") as f:
            f.write(ts_code)

        # Go file
        go_code = """
package main

type PricingEngine struct {}

func (p *PricingEngine) CalculateDiscount(amount float64) float64 {
    return amount * 0.10
}
"""
        with open(os.path.join(self.tmp_dir, "pricing.go"), "w", encoding="utf-8") as f:
            f.write(go_code)

        self.engine = ASTEngine(self.tmp_dir)

    def tearDown(self):
        shutil.rmtree(self.tmp_dir, ignore_errors=True)

    def test_polyglot_indexing(self):
        res = self.engine.index_repository()
        self.assertGreaterEqual(res["indexed_files"], 2)
        self.assertGreaterEqual(res["total_symbols"], 2)

        # Check TS symbol
        ts_symbol = self.engine.find_symbol("OrderService")
        self.assertIsNotNone(ts_symbol)
        self.assertEqual(ts_symbol["language"], "typescript")

        # Check Go symbol
        go_symbol = self.engine.find_symbol("CalculateDiscount")
        self.assertIsNotNone(go_symbol)
        self.assertEqual(go_symbol["language"], "go")


if __name__ == "__main__":
    unittest.main()
