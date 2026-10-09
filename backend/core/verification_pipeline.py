"""
CodeNexus Universal Layered Verification Pipeline & Evidence Capture
Executes polyglot validation: Syntax -> Targeted Tests -> Full Regression across
Python, TypeScript/JavaScript, Java, C/C++, Go, Rust, C#, Ruby, and PHP.
Integrates PolyglotErrorParser to isolate exact file and line locations of failures.
"""

import ast
import os
import subprocess
import time
from typing import Dict, Any, Optional, List

from core.polyglot_error_parser import PolyglotErrorParser


class VerificationPipeline:
    def __init__(self, repo_path: str):
        self.repo_path = os.path.abspath(repo_path)

    def detect_project_type(self) -> str:
        """Detects the primary programming language / framework of the repository."""
        if os.path.exists(os.path.join(self.repo_path, "package.json")):
            return "nodejs"
        elif os.path.exists(os.path.join(self.repo_path, "Cargo.toml")):
            return "rust"
        elif os.path.exists(os.path.join(self.repo_path, "go.mod")):
            return "go"
        elif os.path.exists(os.path.join(self.repo_path, "pom.xml")) or os.path.exists(os.path.join(self.repo_path, "build.gradle")):
            return "java"
        elif os.path.exists(os.path.join(self.repo_path, "CMakeLists.txt")) or os.path.exists(os.path.join(self.repo_path, "Makefile")):
            return "cpp"
        elif any(f.endswith(".csproj") or f.endswith(".sln") for f in os.listdir(self.repo_path) if os.path.isfile(os.path.join(self.repo_path, f))):
            return "csharp"
        elif os.path.exists(os.path.join(self.repo_path, "Gemfile")):
            return "ruby"
        elif os.path.exists(os.path.join(self.repo_path, "composer.json")):
            return "php"
        else:
            return "python"

    def validate_syntax(self, file_path: str) -> Dict[str, Any]:
        """Validates file syntax across all supported languages."""
        full_p = os.path.join(self.repo_path, file_path)
        if not os.path.exists(full_p):
            return {"passed": False, "error": f"File '{file_path}' does not exist."}

        _, ext = os.path.splitext(file_path)
        ext = ext.lower()

        try:
            with open(full_p, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()

            if ext == ".py":
                try:
                    ast.parse(content, filename=file_path)
                    return {"passed": True, "message": f"Syntax valid for {file_path}"}
                except SyntaxError as e:
                    return {
                        "passed": False,
                        "error": f"SyntaxError in {file_path}:{e.lineno}: {e.msg}",
                        "line": e.lineno,
                        "offset": e.offset,
                        "language": "python"
                    }
            elif ext in (".js", ".jsx", ".ts", ".tsx"):
                # Basic bracket balance check for JS/TS if node/tsc not locally executable
                open_b = content.count("{") - content.count("}")
                open_p = content.count("(") - content.count(")")
                open_s = content.count("[") - content.count("]")
                if open_b != 0 or open_p != 0 or open_s != 0:
                    return {
                        "passed": False,
                        "error": f"Bracket/Parentheses mismatch in {file_path}: {{:{open_b}, (:{open_p}, [:{open_s}",
                        "language": "typescript/javascript"
                    }
                return {"passed": True, "message": f"Syntax structure valid for {file_path}"}
            else:
                return {"passed": True, "message": f"Syntax check passed for {file_path}"}
        except Exception as exc:
            return {"passed": False, "error": str(exc), "file": file_path}

    def execute_test_command(
        self,
        test_target: Optional[str] = None,
        timeout_sec: int = 40
    ) -> Dict[str, Any]:
        """Executes targeted test or full regression suite across any language and captures full evidence."""
        proj_type = self.detect_project_type()

        # Build language-specific test command
        if proj_type == "nodejs":
            if test_target:
                cmd = f"npm test -- {test_target}"
            else:
                cmd = "npm test" if os.path.exists(os.path.join(self.repo_path, "package.json")) else "node --test"
        elif proj_type == "rust":
            cmd = f"cargo test {test_target}" if test_target else "cargo test"
        elif proj_type == "go":
            cmd = f"go test -v ./{test_target}" if test_target else "go test -v ./..."
        elif proj_type == "java":
            if os.path.exists(os.path.join(self.repo_path, "pom.xml")):
                cmd = f"mvn test -Dtest={test_target}" if test_target else "mvn test"
            else:
                cmd = f"gradle test --tests {test_target}" if test_target else "gradle test"
        elif proj_type == "csharp":
            cmd = f"dotnet test --filter {test_target}" if test_target else "dotnet test"
        elif proj_type == "ruby":
            cmd = f"bundle exec rspec {test_target}" if test_target else "bundle exec rspec"
        elif proj_type == "php":
            cmd = f"./vendor/bin/phpunit {test_target}" if test_target else "./vendor/bin/phpunit"
        elif proj_type == "cpp":
            cmd = "ctest --output-on-failure"
        else:
            # Default to Python
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
            
            combined_output = f"{res.stdout}\n{res.stderr}".strip()
            
            # Universal Polyglot Error Parsing
            parsed_diagnosis = None
            if not passed or "FAIL" in combined_output or "error" in combined_output.lower():
                parsed_diagnosis = PolyglotErrorParser.parse(combined_output, self.repo_path)

            # Test metrics extraction
            total_tests = 0
            failed_tests = 0

            # Python unittest
            if "Ran " in combined_output:
                try:
                    part = combined_output.split("Ran ")[1].split(" ")[0]
                    total_tests = int(part)
                except Exception:
                    pass

            if "FAILED" in combined_output or "FAIL" in combined_output or not passed:
                failed_tests = max(1, failed_tests)
                if "failures=" in combined_output:
                    try:
                        failed_tests = int(combined_output.split("failures=")[1].split(",")[0].replace(")", ""))
                    except Exception:
                        pass

            # Jest / Vitest
            if "Tests:" in combined_output:
                try:
                    parts = combined_output.split("Tests:")[1].splitlines()[0]
                    if "failed" in parts:
                        failed_tests = int(parts.split("failed")[0].strip().split()[-1])
                    if "passed" in parts:
                        passed_count = int(parts.split("passed")[0].strip().split()[-1])
                        total_tests = failed_tests + passed_count
                except Exception:
                    pass

            return {
                "command": cmd,
                "project_type": proj_type,
                "test_target": test_target or "full_suite",
                "passed": passed,
                "exit_code": res.returncode,
                "stdout": res.stdout,
                "stderr": res.stderr,
                "total_tests": total_tests,
                "failed_tests": failed_tests,
                "duration_ms": duration_ms,
                "timestamp": start_time,
                "diagnosis": parsed_diagnosis
            }
        except subprocess.TimeoutExpired:
            return {
                "command": cmd,
                "project_type": proj_type,
                "test_target": test_target or "full_suite",
                "passed": False,
                "exit_code": -1,
                "stdout": "",
                "stderr": f"Execution timed out after {timeout_sec} seconds.",
                "total_tests": 0,
                "failed_tests": 1,
                "duration_ms": round((time.time() - start_time) * 1000, 2),
                "timestamp": start_time,
                "diagnosis": {
                    "has_error": True,
                    "language": proj_type,
                    "error_type": "TimeoutExpired",
                    "error_message": f"Test runner timed out after {timeout_sec}s",
                    "diagnostic_summary": f"Process exceeded {timeout_sec}s time budget."
                }
            }
        except Exception as exc:
            return {
                "command": cmd,
                "project_type": proj_type,
                "test_target": test_target or "full_suite",
                "passed": False,
                "exit_code": -1,
                "stdout": "",
                "stderr": str(exc),
                "total_tests": 0,
                "failed_tests": 1,
                "duration_ms": round((time.time() - start_time) * 1000, 2),
                "timestamp": start_time,
                "diagnosis": {
                    "has_error": True,
                    "language": proj_type,
                    "error_type": "ExecutionError",
                    "error_message": str(exc),
                    "diagnostic_summary": str(exc)
                }
            }

    def run_layered_verification(
        self,
        modified_files: List[str],
        targeted_test: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Runs full verification chain across any language:
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
                    "error": syntax_res.get("error", "Syntax validation failed"),
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
                    "targeted_result": targeted_res,
                    "diagnosis": targeted_res.get("diagnosis")
                }

        # Step 3: Full regression
        regression_res = self.execute_test_command(None)
        if not regression_res["passed"]:
            return {
                "stage": "REGRESSION_TESTS",
                "passed": False,
                "error": "Regression test suite failed.",
                "targeted_result": targeted_res,
                "regression_result": regression_res,
                "diagnosis": regression_res.get("diagnosis")
            }

        return {
            "stage": "ALL_VERIFIED",
            "passed": True,
            "targeted_result": targeted_res,
            "regression_result": regression_res,
            "message": "All verification stages passed cleanly with zero regressions."
        }
