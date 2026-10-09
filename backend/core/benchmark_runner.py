"""
CodeNexus Benchmark & Mutation Testing Framework
Runs real benchmarks across multi-file and multi-bug suites, performs mutation testing,
and computes verification reliability metrics.
"""

import os
import time
from typing import Dict, List, Any, Optional
from core.verification_pipeline import VerificationPipeline
from core.patch_engine import PatchEngine
from core.git_sandbox import GitSandbox


class BenchmarkRunner:
    def __init__(self, sample_repos_dir: str):
        self.sample_repos_dir = os.path.abspath(sample_repos_dir)

    def run_mutation_test(self, repo_path: str, target_file: str) -> Dict[str, Any]:
        """
        Injects a synthetic mutation (e.g., swapping operators or return values)
        to verify that the verification pipeline correctly catches it.
        """
        sandbox = GitSandbox(repo_path)
        patch_engine = PatchEngine(repo_path)
        verifier = VerificationPipeline(repo_path)

        snap = sandbox.create_snapshot("mutation_test")
        full_p = os.path.join(repo_path, target_file)

        if not os.path.exists(full_p):
            return {"success": False, "error": f"File '{target_file}' not found."}

        with open(full_p, "r", encoding="utf-8") as f:
            code = f.read()

        # Try a safe mutation: replace + with - or == with !=
        mutation_applied = False
        mutated_code = code
        mutation_desc = ""

        if "return a + b" in code:
            mutated_code = code.replace("return a + b", "return a - b", 1)
            mutation_desc = "Replaced + with -"
            mutation_applied = True
        elif "==" in code:
            mutated_code = code.replace("==", "!=", 1)
            mutation_desc = "Replaced == with !="
            mutation_applied = True

        if not mutation_applied:
            sandbox.rollback(snap["snapshot_token"])
            return {"success": False, "error": "No suitable mutation site found."}

        with open(full_p, "w", encoding="utf-8") as f:
            f.write(mutated_code)

        # Run test suite to see if the mutation was detected (test should fail)
        test_res = verifier.execute_test_command()
        caught = not test_res["passed"]

        # Restore original state immediately
        sandbox.rollback(snap["snapshot_token"])
        sandbox.cleanup_snapshots()

        return {
            "mutation_applied": mutation_desc,
            "mutation_caught_by_tests": caught,
            "test_output": test_res["stderr"] or test_res["stdout"],
            "score": 100 if caught else 0,
            "message": "Mutation caught successfully by test suite." if caught else "Warning: Mutation went undetected by tests."
        }

    def evaluate_all_benchmarks(self) -> Dict[str, Any]:
        """Runs test verification across all available sample repositories."""
        results = []
        total = 0
        passed = 0

        for repo_name in os.listdir(self.sample_repos_dir):
            repo_path = os.path.join(self.sample_repos_dir, repo_name)
            if not os.path.isdir(repo_path):
                continue

            total += 1
            verifier = VerificationPipeline(repo_path)
            res = verifier.execute_test_command()
            is_pass = res["passed"]
            if is_pass:
                passed += 1

            results.append({
                "repo_name": repo_name,
                "passed": is_pass,
                "duration_ms": res["duration_ms"],
                "total_tests": res.get("total_tests", 0),
                "failed_tests": res.get("failed_tests", 0)
            })

        return {
            "total_benchmarks": total,
            "passing_benchmarks": passed,
            "failing_benchmarks": total - passed,
            "benchmark_results": results
        }
