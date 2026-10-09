"""
Unit tests for CodeNexus Backend Core Engines
"""

import os
import unittest
from core.ast_engine import ASTEngine
from core.inspection_engine import AdaptiveInspector
from core.bug_tracker import BugOrchestrator, BugState
from core.git_sandbox import GitSandbox
from core.patch_engine import PatchEngine
from core.verification_pipeline import VerificationPipeline
from core.sandbox_security import SecuritySandbox, SupervisedApprovalManager


class TestCodeNexusCore(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.sample_math_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "sample_repos", "math_utils"))
        cls.sample_ecom_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "sample_repos", "ecommerce_order_api"))

    def test_ast_engine_indexing_and_symbols(self):
        engine = ASTEngine(self.sample_math_dir)
        telemetry = engine.index_repository()
        self.assertGreater(telemetry["indexed_files"], 0)
        
        sym = engine.find_symbol("fibonacci")
        self.assertIsNotNone(sym)
        self.assertEqual(sym["name"], "fibonacci")
        self.assertEqual(sym["kind"], "function")

    def test_ast_blast_radius_calculation(self):
        engine = ASTEngine(self.sample_ecom_dir)
        engine.index_repository()
        blast = engine.analyze_blast_radius("PricingService.calculate_bulk_discount")
        self.assertIn(blast["risk_rating"], ["LOW", "MEDIUM", "HIGH"])
        self.assertGreaterEqual(blast["caller_count"], 1)

    def test_inspection_scope_levels(self):
        inspector = AdaptiveInspector(self.sample_math_dir)
        res = inspector.inspect_failure(failing_file="calculator.py", failing_line=25, failing_symbol="fibonacci")
        self.assertIn("telemetry", res)
        self.assertGreaterEqual(res["telemetry"]["lines_inspected"], 1)
        self.assertGreaterEqual(res["telemetry"]["level"], 1)

    def test_bug_tracker_identity_and_dependencies(self):
        orchestrator = BugOrchestrator()
        b1 = orchestrator.create_bug(
            title="Prerequisite Bug",
            description="Bug 1 description",
            file_path="pricing_service.py",
            severity="HIGH"
        )
        b2 = orchestrator.create_bug(
            title="Dependent Bug",
            description="Bug 2 description",
            file_path="order_controller.py",
            dependencies=[b1.id]
        )
        
        self.assertTrue(b1.id.startswith("CNX-B"))
        self.assertIsNotNone(b1.to_dict()["dna_fingerprint"])
        
        ordered = orchestrator.get_dependency_ordered_queue()
        ordered_ids = [b.id for b in ordered]
        self.assertLess(ordered_ids.index(b1.id), ordered_ids.index(b2.id))

    def test_git_sandbox_snapshot_and_rollback(self):
        sandbox = GitSandbox(self.sample_math_dir)
        snap = sandbox.create_snapshot("unit_test_snap")
        self.assertIn("snapshot_token", snap)

        # Modify a file
        calc_file = os.path.join(self.sample_math_dir, "calculator.py")
        with open(calc_file, "r", encoding="utf-8") as f:
            orig = f.read()
        
        with open(calc_file, "a", encoding="utf-8") as f:
            f.write("\n# TEMPORARY_MODIFICATION_TEST\n")

        # Rollback
        rollback_res = sandbox.rollback(snap["snapshot_token"])
        self.assertTrue(rollback_res["success"])

        with open(calc_file, "r", encoding="utf-8") as f:
            restored = f.read()
        self.assertEqual(orig, restored)
        sandbox.cleanup_snapshots()

    def test_patch_engine_diff_metrics(self):
        patch_engine = PatchEngine(self.sample_math_dir)
        old_txt = "def foo():\n    return 0\n"
        new_txt = "def foo():\n    return 1\n"
        diff_info = patch_engine.generate_diff("test.py", old_txt, new_txt)
        self.assertEqual(diff_info["lines_added"], 1)
        self.assertEqual(diff_info["lines_removed"], 1)
        self.assertGreater(diff_info["minimality_score"], 0.0)

    def test_security_sandbox(self):
        sec = SecuritySandbox(self.sample_math_dir)
        self.assertTrue(sec.validate_safe_path("calculator.py"))
        self.assertFalse(sec.validate_safe_path("../../outside_file.txt"))


if __name__ == "__main__":
    unittest.main()
