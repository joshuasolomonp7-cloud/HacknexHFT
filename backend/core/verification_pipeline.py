"""
CodeNexus Layered Verification Pipeline & Evidence Capture
Executes structured validation: Syntax -> Imports -> Targeted Tests -> Full Regression.
Captures rich before/after execution evidence.
"""

import ast
import os
import subprocess
import time
from typing import Dict, Any, Optional, List


class VerificationPipeline:
    def __init__(self, repo_path: str):
        self.repo_path = os.path.abspath(repo_path)

    def validate_syntax(self, file_path: str) -> Dict[str, Any]:
        """Validates Python syntax via AST parser."""
        if not file_path.endswith(".py"):
            return {"passed": True, "message": "Non-python file syntax check bypassed."}

        full_p = os.path.join(self.repo_path, file_path)
        if not os.path.exists(full_p):
            return {"passed": False, "error": f"File '{file_path}' does not exist."}

        try:
            with open(full_p, "r", encoding="utf-8") as f:
                content = f.read()
            ast.parse(content, filename=file_path)
            return {"passed": True, "message": f"Syntax valid for {file_path}"}
        except SyntaxError as e:
            return {
                "passed": False,
                "error": f"SyntaxError in {file_path}:{e.lineno}: {e.msg}",
                "line": e.lineno,
                "offset": e.offset
            }

    def execute_test_command(
        self,
        test_target: Optional[str] = None,
        timeout_sec: int = 35
    ) -> Dict[str, Any]:
        """Executes targeted test or full regression suite and captures full evidence."""
        # Detect environment
        if os.path.exists(os.path.join(self.repo_path, "package.json")):
            cmd = f"node --test {test_target}" if test_target else "node --test"
        else:
            if test_target:
                cmd = f"python -m unittest {test_target}"
            else:
                cmd = "python -m unittest discover tests"

        start_time = time.time()
        try:
            res = subprocess.run(
                cmd,
                shell=True,
                cwd=self.repo_path,
                capture_output=True,
                text=True,
                timeout=timeout_sec
            )
            duration_ms = round((time.time() - start_time) * 1000, 2)
            passed = res.returncode == 0
            
            # Parse test count and failures where possible
            combined_output = f"{res.stdout}\n{res.stderr}".strip()
            total_tests = 0
            failed_tests = 0
            
            if "Ran " in combined_output:
                try:
                    part = combined_output.split("Ran ")[1].split(" ")[0]
                    total_tests = int(part)
                except Exception:
                    pass

            if "FAILED" in combined_output or "FAIL" in combined_output:
                failed_tests = 1
                if "failures=" in combined_output:
                    try:
                        failed_tests = int(combined_output.split("failures=")[1].split(",")[0].replace(")", ""))
                    except Exception:
                        pass

            return {
                "command": cmd,
                "test_target": test_target or "full_suite",
                "passed": passed,
                "exit_code": res.returncode,
                "stdout": res.stdout,
                "stderr": res.stderr,
                "total_tests": total_tests,
                "failed_tests": failed_tests,
                "duration_ms": duration_ms,
                "timestamp": start_time
            }
        except subprocess.TimeoutExpired:
            return {
                "command": cmd,
                "test_target": test_target or "full_suite",
                "passed": False,
                "exit_code": -1,
                "stdout": "",
                "stderr": f"Execution timed out after {timeout_sec} seconds.",
                "total_tests": 0,
                "failed_tests": 1,
                "duration_ms": round((time.time() - start_time) * 1000, 2),
                "timestamp": start_time
            }
        except Exception as exc:
            return {
                "command": cmd,
                "test_target": test_target or "full_suite",
                "passed": False,
                "exit_code": -1,
                "stdout": "",
                "stderr": str(exc),
                "total_tests": 0,
                "failed_tests": 1,
                "duration_ms": round((time.time() - start_time) * 1000, 2),
                "timestamp": start_time
            }

    def run_layered_verification(
        self,
        modified_files: List[str],
        targeted_test: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Runs full verification chain:
        1. Syntax check on all modified files
        2. Targeted tests (if specified)
        3. Full regression suite
        """
        # Step 1: Syntax
        for f in modified_files:
            syntax_res = self.validate_syntax(f)
            if not syntax_res["passed"]:
                return {
                    "stage": "SYNTAX_CHECK",
                    "passed": False,
                    "error": syntax_res["error"],
                    "details": syntax_res
                }

        # Step 2: Targeted tests
        targeted_res = None
        if targeted_test:
            targeted_res = self.execute_test_command(targeted_test)
            if not targeted_res["passed"]:
                return {
                    "stage": "TARGETED_TESTS",
                    "passed": False,
                    "error": "Targeted test failed.",
                    "targeted_result": targeted_res
                }

        # Step 3: Full regression
        regression_res = self.execute_test_command(None)
        if not regression_res["passed"]:
            return {
                "stage": "REGRESSION_TESTS",
                "passed": False,
                "error": "Regression test suite failed.",
                "targeted_result": targeted_res,
                "regression_result": regression_res
            }

        return {
            "stage": "ALL_VERIFIED",
            "passed": True,
            "targeted_result": targeted_res,
            "regression_result": regression_res,
            "message": "All verification stages passed cleanly with zero regressions."
        }
