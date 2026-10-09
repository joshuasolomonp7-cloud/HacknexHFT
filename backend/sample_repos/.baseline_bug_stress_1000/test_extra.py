"""Extra tests exercising edge cases across the demo application."""
import unittest
from extra_rules import rule_01, summarize_01, select_01
from utils import clamp, normalize_email, valid_email, unique, retry_delay
from shipping import shipping_cost, estimate_delivery
from reports import report_summary

class ExtraRuleTests(unittest.TestCase):
    def test_rule_01_basic(self):
        result = rule_01([1, 2, 3], 2)
        self.assertEqual(len(result), 3)

    def test_summary_01_count(self):
        result = summarize_01([{'amount': 10}, {'amount': 20}])
        self.assertEqual(result['count'], 2)

    def test_rule_02_basic(self):
        result = rule_02([1, 2, 3], 2)
        self.assertEqual(len(result), 3)

    def test_summary_02_count(self):
        result = summarize_02([{'amount': 10}, {'amount': 20}])
        self.assertEqual(result['count'], 2)

    def test_rule_03_basic(self):
        result = rule_03([1, 2, 3], 2)
        self.assertEqual(len(result), 3)

    def test_summary_03_count(self):
        result = summarize_03([{'amount': 10}, {'amount': 20}])
        self.assertEqual(result['count'], 2)

    def test_rule_04_basic(self):
        result = rule_04([1, 2, 3], 2)
        self.assertEqual(len(result), 3)

    def test_summary_04_count(self):
        result = summarize_04([{'amount': 10}, {'amount': 20}])
        self.assertEqual(result['count'], 2)

    def test_rule_05_basic(self):
        result = rule_05([1, 2, 3], 2)
        self.assertEqual(len(result), 3)

    def test_summary_05_count(self):
        result = summarize_05([{'amount': 10}, {'amount': 20}])
        self.assertEqual(result['count'], 2)

    def test_rule_06_basic(self):
        result = rule_06([1, 2, 3], 2)
        self.assertEqual(len(result), 3)

    def test_summary_06_count(self):
        result = summarize_06([{'amount': 10}, {'amount': 20}])
        self.assertEqual(result['count'], 2)

    def test_rule_07_basic(self):
        result = rule_07([1, 2, 3], 2)
        self.assertEqual(len(result), 3)

    def test_summary_07_count(self):
        result = summarize_07([{'amount': 10}, {'amount': 20}])
        self.assertEqual(result['count'], 2)

    def test_rule_08_basic(self):
        result = rule_08([1, 2, 3], 2)
        self.assertEqual(len(result), 3)

    def test_summary_08_count(self):
        result = summarize_08([{'amount': 10}, {'amount': 20}])
        self.assertEqual(result['count'], 2)

    def test_rule_09_basic(self):
        result = rule_09([1, 2, 3], 2)
        self.assertEqual(len(result), 3)

    def test_summary_09_count(self):
        result = summarize_09([{'amount': 10}, {'amount': 20}])
        self.assertEqual(result['count'], 2)

    def test_rule_10_basic(self):
        result = rule_10([1, 2, 3], 2)
        self.assertEqual(len(result), 3)

    def test_summary_10_count(self):
        result = summarize_10([{'amount': 10}, {'amount': 20}])
        self.assertEqual(result['count'], 2)

    def test_rule_11_basic(self):
        result = rule_11([1, 2, 3], 2)
        self.assertEqual(len(result), 3)

    def test_summary_11_count(self):
        result = summarize_11([{'amount': 10}, {'amount': 20}])
        self.assertEqual(result['count'], 2)

    def test_rule_12_basic(self):
        result = rule_12([1, 2, 3], 2)
        self.assertEqual(len(result), 3)

    def test_summary_12_count(self):
        result = summarize_12([{'amount': 10}, {'amount': 20}])
        self.assertEqual(result['count'], 2)

    def test_rule_13_basic(self):
        result = rule_13([1, 2, 3], 2)
        self.assertEqual(len(result), 3)

    def test_summary_13_count(self):
        result = summarize_13([{'amount': 10}, {'amount': 20}])
        self.assertEqual(result['count'], 2)

    def test_rule_14_basic(self):
        result = rule_14([1, 2, 3], 2)
        self.assertEqual(len(result), 3)

    def test_summary_14_count(self):
        result = summarize_14([{'amount': 10}, {'amount': 20}])
        self.assertEqual(result['count'], 2)

    def test_rule_15_basic(self):
        result = rule_15([1, 2, 3], 2)
        self.assertEqual(len(result), 3)

    def test_summary_15_count(self):
        result = summarize_15([{'amount': 10}, {'amount': 20}])
        self.assertEqual(result['count'], 2)

    def test_rule_16_basic(self):
        result = rule_16([1, 2, 3], 2)
        self.assertEqual(len(result), 3)

    def test_summary_16_count(self):
        result = summarize_16([{'amount': 10}, {'amount': 20}])
        self.assertEqual(result['count'], 2)

    def test_rule_17_basic(self):
        result = rule_17([1, 2, 3], 2)
        self.assertEqual(len(result), 3)

    def test_summary_17_count(self):
        result = summarize_17([{'amount': 10}, {'amount': 20}])
        self.assertEqual(result['count'], 2)

    def test_rule_18_basic(self):
        result = rule_18([1, 2, 3], 2)
        self.assertEqual(len(result), 3)

    def test_summary_18_count(self):
        result = summarize_18([{'amount': 10}, {'amount': 20}])
        self.assertEqual(result['count'], 2)

    def test_rule_19_basic(self):
        result = rule_19([1, 2, 3], 2)
        self.assertEqual(len(result), 3)

    def test_summary_19_count(self):
        result = summarize_19([{'amount': 10}, {'amount': 20}])
        self.assertEqual(result['count'], 2)

    def test_rule_20_basic(self):
        result = rule_20([1, 2, 3], 2)
        self.assertEqual(len(result), 3)

    def test_summary_20_count(self):
        result = summarize_20([{'amount': 10}, {'amount': 20}])
        self.assertEqual(result['count'], 2)

    def test_clamp_reversed_bounds(self):
        self.assertEqual(clamp(5, 10, 0), 5)

    def test_email_normalization(self):
        self.assertEqual(normalize_email('  A B@Example.com '), 'ab@example.com')

    def test_email_validation(self):
        self.assertTrue(valid_email('hello@example.com'))

    def test_unique_preserves_order(self):
        self.assertEqual(unique([3, 1, 3, 2]), [3, 1, 2])

    def test_retry_delay(self):
        self.assertEqual(retry_delay(0), 1)

    def test_shipping_threshold(self):
        self.assertEqual(shipping_cost(100), 0)

    def test_delivery_estimate(self):
        from datetime import datetime
        start = datetime(2026, 1, 1)
        self.assertEqual(estimate_delivery('standard', start), datetime(2026, 1, 6))

    def test_report_summary_empty(self):
        from database import db
        db.reset()
        self.assertEqual(report_summary()['mean'], 0)

if __name__ == '__main__':
    unittest.main()
