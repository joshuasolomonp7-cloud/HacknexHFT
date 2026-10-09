"""
CodeNexus Universal Polyglot Error & Stack Trace Intelligence Engine
Parses compilation errors, runtime exceptions, tracebacks, test failures,
and assertion errors across ALL major programming languages:
Python, JavaScript/TypeScript, Java, C/C++, Go, Rust, Ruby, PHP, C# / .NET, Shell, and SQL.
"""

import re
import os
from typing import Dict, List, Any, Optional, Tuple


class PolyglotErrorParser:
    """Universal parser that spots errors, file locations, line numbers, and root causes in any language."""

    @staticmethod
    def detect_language(text: str, repo_files: Optional[List[str]] = None) -> str:
        """Detects the programming language associated with the error output."""
        text_lower = text.lower()
        
        # Explicit signatures
        if "traceback (most recent call last):" in text_lower or "pytest" in text_lower or ".py\", line " in text_lower:
            return "python"
        if "ts(" in text or "error ts" in text_lower or "node_modules" in text or "vitest" in text_lower or "jest" in text_lower or ".ts:" in text or ".tsx:" in text or ".js:" in text:
            return "typescript/javascript"
        if "java.lang." in text or "at com." in text or "at org." in text or "junit" in text_lower or ".java:" in text:
            return "java"
        if "error[e" in text_lower or "cargo test" in text_lower or "--> src/" in text or ".rs:" in text or "panicked at" in text_lower:
            return "rust"
        if "goroutine " in text or "panic:" in text or "go test" in text_lower or ".go:" in text:
            return "go"
        if "error:" in text_lower and (".cpp:" in text or ".c:" in text or ".hpp:" in text or ".h:" in text or "gcc" in text_lower or "clang" in text_lower or "gtest" in text_lower):
            return "c/c++"
        if "fatal error: uncaught" in text_lower or "phpunit" in text_lower or ".php on line" in text_lower or ".php:" in text:
            return "php"
        if "rspec" in text_lower or ".rb:" in text or "nomethoderror" in text_lower:
            return "ruby"
        if "system.nullreferenceexception" in text_lower or "error cs" in text_lower or ".cs:line" in text_lower or "dotnet" in text_lower:
            return "csharp"

        # Fallback to repo files inspection if available
        if repo_files:
            ext_counts = {}
            for f in repo_files:
                _, ext = os.path.splitext(f)
                ext = ext.lower()
                ext_counts[ext] = ext_counts.get(ext, 0) + 1
            sorted_exts = sorted(ext_counts.items(), key=lambda x: x[1], reverse=True)
            if sorted_exts:
                top_ext = sorted_exts[0][0]
                ext_map = {
                    ".py": "python",
                    ".ts": "typescript/javascript",
                    ".tsx": "typescript/javascript",
                    ".js": "typescript/javascript",
                    ".jsx": "typescript/javascript",
                    ".java": "java",
                    ".go": "go",
                    ".rs": "rust",
                    ".cpp": "c/c++",
                    ".c": "c/c++",
                    ".cs": "csharp",
                    ".rb": "ruby",
                    ".php": "php"
                }
                if top_ext in ext_map:
                    return ext_map[top_ext]

        return "generic"

    @classmethod
    def parse(cls, output: str, repo_path: Optional[str] = None) -> Dict[str, Any]:
        """
        Parses error output from any language into a normalized diagnostic report.
        """
        if not output or not output.strip():
            return {
                "has_error": False,
                "language": "unknown",
                "error_type": None,
                "error_message": "",
                "primary_file": None,
                "primary_line": None,
                "primary_column": None,
                "stack_frames": [],
                "diagnostic_summary": "No errors detected.",
                "repair_hint": ""
            }

        language = cls.detect_language(output)
        
        # Dispatch to specialized language parsers
        if language == "python":
            res = cls._parse_python(output)
        elif language == "typescript/javascript":
            res = cls._parse_javascript(output)
        elif language == "java":
            res = cls._parse_java(output)
        elif language == "c/c++":
            res = cls._parse_cpp(output)
        elif language == "go":
            res = cls._parse_go(output)
        elif language == "rust":
            res = cls._parse_rust(output)
        elif language == "ruby":
            res = cls._parse_ruby(output)
        elif language == "php":
            res = cls._parse_php(output)
        elif language == "csharp":
            res = cls._parse_csharp(output)
        else:
            res = cls._parse_generic(output)

        res["language"] = language
        
        # Clean relative paths if repo_path provided
        if repo_path and res.get("primary_file"):
            p_file = res["primary_file"].replace("\\", "/")
            repo_norm = repo_path.replace("\\", "/").rstrip("/")
            if p_file.startswith(repo_norm):
                p_file = p_file[len(repo_norm):].lstrip("/")
            elif os.path.isabs(p_file):
                try:
                    p_file = os.path.relpath(p_file, repo_path).replace("\\", "/")
                except Exception:
                    pass
            res["primary_file"] = p_file
        elif res.get("primary_file"):
            res["primary_file"] = res["primary_file"].replace("\\", "/")

        return res

    # -------------------------------------------------------------
    # 1. PYTHON ERROR PARSER
    # -------------------------------------------------------------
    @classmethod
    def _parse_python(cls, text: str) -> Dict[str, Any]:
        frames = []
        error_type = "RuntimeError"
        error_message = ""
        primary_file = None
        primary_line = None

        # Regex for standard Python traceback frames: File "path/file.py", line 42, in func_name
        py_frame_pattern = re.compile(r'File ["\'](?P<file>[^"\']+)["\'], line (?P<line>\d+)(?:, in (?P<func>\w+))?')
        for match in py_frame_pattern.finditer(text):
            f_path = match.group("file")
            l_num = int(match.group("line"))
            func = match.group("func") or "<module>"
            frames.append({
                "file": f_path,
                "line": l_num,
                "function": func
            })

        # Python exception message at the bottom (e.g. AssertionError: expected 10 got 20, TypeError: ...)
        py_exc_pattern = re.compile(r'^(?P<type>[A-Za-z0-9_]+(?:Error|Exception|Warning|Interrupt))(?::\s*(?P<msg>.*))?$', re.MULTILINE)
        exc_matches = list(py_exc_pattern.finditer(text))
        if exc_matches:
            last_exc = exc_matches[-1]
            error_type = last_exc.group("type")
            error_message = (last_exc.group("msg") or "").strip()
        elif "FAIL:" in text or "FAILED" in text:
            error_type = "AssertionFailure"
            error_message = text.split("FAIL:")[-1].splitlines()[0].strip() if "FAIL:" in text else "Test suite failed"

        # Pytest specific pattern: > 42 | assert x == y
        pytest_err_pattern = re.compile(r'(?P<file>[^\s:]+\.py):(?P<line>\d+): (?P<type>[A-Za-z0-9_]+Error): (?P<msg>.*)')
        pytest_match = pytest_err_pattern.search(text)
        if pytest_match:
            primary_file = pytest_match.group("file")
            primary_line = int(pytest_match.group("line"))
            error_type = pytest_match.group("type")
            error_message = pytest_match.group("msg").strip()

        # Fallback to last frame
        if not primary_file and frames:
            primary_file = frames[-1]["file"]
            primary_line = frames[-1]["line"]

        repair_hint = f"Inspect {primary_file}:{primary_line} and resolve {error_type}: {error_message}" if primary_file else "Analyze the captured stack trace to isolate root cause."

        return {
            "has_error": True,
            "error_type": error_type,
            "error_message": error_message or "Python execution exception",
            "primary_file": primary_file,
            "primary_line": primary_line,
            "primary_column": None,
            "stack_frames": frames,
            "diagnostic_summary": f"[{error_type}] in {primary_file or 'unknown'}:{primary_line or '?'}: {error_message}",
            "repair_hint": repair_hint
        }

    # -------------------------------------------------------------
    # 2. JAVASCRIPT / TYPESCRIPT ERROR PARSER
    # -------------------------------------------------------------
    @classmethod
    def _parse_javascript(cls, text: str) -> Dict[str, Any]:
        frames = []
        error_type = "Error"
        error_message = ""
        primary_file = None
        primary_line = None
        primary_col = None

        # TypeScript compiler errors: src/utils.ts(45,12): error TS2322: Type 'string' is not assignable to type 'number'.
        ts_pattern = re.compile(r'(?P<file>[^\s()]+\.[tj]sx?)\((?P<line>\d+),(?P<col>\d+)\):\s*error\s*(?P<code>TS\d+|\w+)?:\s*(?P<msg>.*)')
        ts_match = ts_pattern.search(text)
        if ts_match:
            primary_file = ts_match.group("file")
            primary_line = int(ts_match.group("line"))
            primary_col = int(ts_match.group("col"))
            error_type = ts_match.group("code") or "TypeScriptCompileError"
            error_message = ts_match.group("msg").strip()

        # V8 Stack Traces: at FunctionName (path/to/file.js:42:15) or at path/to/file.js:42:15
        v8_pattern = re.compile(r'^\s*at (?:(?P<func>[^\s(]+)\s+\()?(?P<file>[^():]+):(?P<line>\d+):(?P<col>\d+)\)?', re.MULTILINE)
        for match in v8_pattern.finditer(text):
            f = match.group("file")
            l = int(match.group("line"))
            c = int(match.group("col"))
            func = match.group("func") or "<anonymous>"
            if "node_modules" not in f and "internal/" not in f:
                frames.append({"file": f, "line": l, "column": c, "function": func})
                if not primary_file:
                    primary_file = f
                    primary_line = l
                    primary_col = c

        # Error header: TypeError: Cannot read properties of undefined (reading 'xyz')
        header_pattern = re.compile(r'^(?P<type>[A-Za-z0-9_$]+Error):\s*(?P<msg>.*)$', re.MULTILINE)
        header_match = header_pattern.search(text)
        if header_match:
            error_type = header_match.group("type")
            error_message = header_match.group("msg").strip()

        # Jest / Vitest assertion: AssertionError: expected 'foo' to equal 'bar'
        if "expect(" in text or "AssertionError" in text or "Received:" in text:
            if not error_type or error_type == "Error":
                error_type = "AssertionError"

        return {
            "has_error": True,
            "error_type": error_type,
            "error_message": error_message or "JavaScript/TypeScript execution failure",
            "primary_file": primary_file,
            "primary_line": primary_line,
            "primary_column": primary_col,
            "stack_frames": frames,
            "diagnostic_summary": f"[{error_type}] at {primary_file or 'unknown'}:{primary_line or '?'}: {error_message}",
            "repair_hint": f"Examine {primary_file}:{primary_line} and resolve {error_type}" if primary_file else "Fix JavaScript runtime/type mismatch"
        }

    # -------------------------------------------------------------
    # 3. JAVA ERROR PARSER
    # -------------------------------------------------------------
    @classmethod
    def _parse_java(cls, text: str) -> Dict[str, Any]:
        frames = []
        error_type = "JavaException"
        error_message = ""
        primary_file = None
        primary_line = None

        # Exception header: Exception in thread "main" java.lang.NullPointerException: message
        exc_pattern = re.compile(r'(?:Exception in thread "[^"]*"\s+)?(?P<type>[a-zA-Z0-9_.]+(?:Exception|Error))(?::\s*(?P<msg>.*))?')
        exc_match = exc_pattern.search(text)
        if exc_match:
            full_type = exc_match.group("type")
            error_type = full_type.split(".")[-1]
            error_message = (exc_match.group("msg") or "").strip()

        # Stack frame: at com.company.OrderService.process(OrderService.java:45)
        frame_pattern = re.compile(r'^\s*at\s+(?P<method>[a-zA-Z0-9_.$]+)\((?P<file>[a-zA-Z0-9_]+\.java):(?P<line>\d+)\)', re.MULTILINE)
        for match in frame_pattern.finditer(text):
            f = match.group("file")
            l = int(match.group("line"))
            m = match.group("method")
            frames.append({"file": f, "line": l, "method": m})
            if not primary_file and not f.startswith("NativeMethod") and "junit" not in m.lower():
                primary_file = f
                primary_line = l

        return {
            "has_error": True,
            "error_type": error_type,
            "error_message": error_message or "Java runtime exception",
            "primary_file": primary_file,
            "primary_line": primary_line,
            "primary_column": None,
            "stack_frames": frames,
            "diagnostic_summary": f"[{error_type}] in {primary_file or 'unknown'}:{primary_line or '?'}: {error_message}",
            "repair_hint": f"Resolve {error_type} in {primary_file} at line {primary_line}" if primary_file else "Fix Java exception"
        }

    # -------------------------------------------------------------
    # 4. C / C++ ERROR PARSER
    # -------------------------------------------------------------
    @classmethod
    def _parse_cpp(cls, text: str) -> Dict[str, Any]:
        primary_file = None
        primary_line = None
        primary_col = None
        error_type = "CompilationError"
        error_message = ""

        # GCC / Clang format: src/main.cpp:24:15: error: 'x' was not declared in this scope
        cpp_pattern = re.compile(r'(?P<file>[^\s:]+\.(?:cpp|cc|cxx|c|hpp|h)):(?P<line>\d+):(?P<col>\d+)?:\s*(?P<severity>error|fatal error|warning):\s*(?P<msg>.*)')
        cpp_match = cpp_pattern.search(text)
        if cpp_match:
            primary_file = cpp_match.group("file")
            primary_line = int(cpp_match.group("line"))
            primary_col = int(cpp_match.group("col")) if cpp_match.group("col") else None
            error_type = "Cpp" + cpp_match.group("severity").capitalize().replace(" ", "")
            error_message = cpp_match.group("msg").strip()
        elif "segmentation fault" in text.lower() or "sigsegv" in text.lower():
            error_type = "SegmentationFault"
            error_message = "Memory access violation (SIGSEGV / null pointer dereference)"

        return {
            "has_error": True,
            "error_type": error_type,
            "error_message": error_message or "C/C++ build or execution error",
            "primary_file": primary_file,
            "primary_line": primary_line,
            "primary_column": primary_col,
            "stack_frames": [],
            "diagnostic_summary": f"[{error_type}] at {primary_file or 'unknown'}:{primary_line or '?'}: {error_message}",
            "repair_hint": f"Correct C/C++ syntax or header definition at {primary_file}:{primary_line}" if primary_file else "Resolve C++ compilation or memory error"
        }

    # -------------------------------------------------------------
    # 5. GO ERROR PARSER
    # -------------------------------------------------------------
    @classmethod
    def _parse_go(cls, text: str) -> Dict[str, Any]:
        primary_file = None
        primary_line = None
        error_type = "GoPanic"
        error_message = ""
        frames = []

        # Panic: panic: runtime error: index out of range [2] with length 2
        panic_match = re.search(r'panic:\s*(?P<msg>.*)', text)
        if panic_match:
            error_message = panic_match.group("msg").strip()

        # Stack trace: /path/to/main.go:45 +0x3f
        go_frame_pattern = re.compile(r'(?P<file>[^\s:]+\.go):(?P<line>\d+)(?:\s+\+0x[0-9a-f]+)?')
        for match in go_frame_pattern.finditer(text):
            f = match.group("file")
            l = int(match.group("line"))
            frames.append({"file": f, "line": l})
            if not primary_file and "testing/" not in f and "runtime/" not in f:
                primary_file = f
                primary_line = l

        # Test failure: --- FAIL: TestCheckout (0.00s)\n    checkout_test.go:28: expected 54, got 50
        test_fail_match = re.search(r'(?P<file>[^\s:]+_test\.go):(?P<line>\d+):\s*(?P<msg>.*)', text)
        if test_fail_match:
            primary_file = test_fail_match.group("file")
            primary_line = int(test_fail_match.group("line"))
            error_type = "TestFailure"
            error_message = test_fail_match.group("msg").strip()

        return {
            "has_error": True,
            "error_type": error_type,
            "error_message": error_message or "Go execution/test error",
            "primary_file": primary_file,
            "primary_line": primary_line,
            "primary_column": None,
            "stack_frames": frames,
            "diagnostic_summary": f"[{error_type}] in {primary_file or 'unknown'}:{primary_line or '?'}: {error_message}",
            "repair_hint": f"Fix Go logic in {primary_file} at line {primary_line}" if primary_file else "Resolve Go panic or test assertion"
        }

    # -------------------------------------------------------------
    # 6. RUST ERROR PARSER
    # -------------------------------------------------------------
    @classmethod
    def _parse_rust(cls, text: str) -> Dict[str, Any]:
        primary_file = None
        primary_line = None
        primary_col = None
        error_type = "RustcError"
        error_message = ""

        # rustc compiler error: error[E0382]: borrow of moved value: `v`\n --> src/main.rs:18:9
        rust_pattern = re.compile(r'error(?:\[(?P<code>E\d+)\])?:\s*(?P<msg>[^\n]+)\s+-->\s+(?P<file>[^\s:]+\.rs):(?P<line>\d+):(?P<col>\d+)')
        rust_match = rust_pattern.search(text)
        if rust_match:
            error_type = rust_match.group("code") or "RustCompileError"
            error_message = rust_match.group("msg").strip()
            primary_file = rust_match.group("file")
            primary_line = int(rust_match.group("line"))
            primary_col = int(rust_match.group("col"))
        elif "panicked at" in text:
            panic_match = re.search(r"panicked at '(?P<msg>[^']+)',\s*(?P<file>[^\s:]+\.rs):(?P<line>\d+)", text)
            if panic_match:
                error_type = "RustPanic"
                error_message = panic_match.group("msg")
                primary_file = panic_match.group("file")
                primary_line = int(panic_match.group("line"))

        return {
            "has_error": True,
            "error_type": error_type,
            "error_message": error_message or "Rust compiler or panic error",
            "primary_file": primary_file,
            "primary_line": primary_line,
            "primary_column": primary_col,
            "stack_frames": [],
            "diagnostic_summary": f"[{error_type}] at {primary_file or 'unknown'}:{primary_line or '?'}: {error_message}",
            "repair_hint": f"Address borrow checker/type constraint in {primary_file}:{primary_line}" if primary_file else "Fix Rust compilation error"
        }

    # -------------------------------------------------------------
    # 7. RUBY ERROR PARSER
    # -------------------------------------------------------------
    @classmethod
    def _parse_ruby(cls, text: str) -> Dict[str, Any]:
        primary_file = None
        primary_line = None
        error_type = "RubyError"
        error_message = ""
        frames = []

        # app/services/pricing.rb:14:in `calculate': undefined method `tier' for nil:NilClass (NoMethodError)
        ruby_pattern = re.compile(r'(?P<file>[^\s:]+\.rb):(?P<line>\d+):in [`\'](?P<func>[^`\']+)\':\s*(?P<msg>.*)')
        for match in ruby_pattern.finditer(text):
            f = match.group("file")
            l = int(match.group("line"))
            raw_msg = match.group("msg").strip()
            frames.append({"file": f, "line": l, "function": match.group("func")})
            if not primary_file:
                primary_file = f
                primary_line = l
                type_match = re.search(r'\(([A-Za-z0-9_:]+(?:Error|Exception))\)$', raw_msg)
                if type_match:
                    error_type = type_match.group(1).split(":")[-1]
                    error_message = raw_msg[:type_match.start()].strip()
                else:
                    error_type = "RubyError"
                    error_message = raw_msg

        return {
            "has_error": True,
            "error_type": error_type,
            "error_message": error_message or "Ruby execution error",
            "primary_file": primary_file,
            "primary_line": primary_line,
            "primary_column": None,
            "stack_frames": frames,
            "diagnostic_summary": f"[{error_type}] in {primary_file or 'unknown'}:{primary_line or '?'}: {error_message}",
            "repair_hint": f"Fix Ruby exception in {primary_file} at line {primary_line}" if primary_file else "Resolve Ruby error"
        }

    # -------------------------------------------------------------
    # 8. PHP ERROR PARSER
    # -------------------------------------------------------------
    @classmethod
    def _parse_php(cls, text: str) -> Dict[str, Any]:
        primary_file = None
        primary_line = None
        error_type = "PHPError"
        error_message = ""

        # Fatal error: Uncaught TypeError: ... in /path/Order.php:52
        php_pattern = re.compile(r'(?:Fatal error|Parse error|Warning):\s*(?:Uncaught\s+)?(?P<type>[A-Za-z0-9_\\]+)?(?::\s*)?(?P<msg>.*?)\s+in\s+(?P<file>[^\s:]+\.php)(?:\s+on line|\:)\s*(?P<line>\d+)', re.IGNORECASE)
        match = php_pattern.search(text)
        if match:
            error_type = (match.group("type") or "FatalError").split("\\")[-1]
            error_message = match.group("msg").strip()
            primary_file = match.group("file")
            primary_line = int(match.group("line"))

        return {
            "has_error": True,
            "error_type": error_type,
            "error_message": error_message or "PHP execution error",
            "primary_file": primary_file,
            "primary_line": primary_line,
            "primary_column": None,
            "stack_frames": [],
            "diagnostic_summary": f"[{error_type}] in {primary_file or 'unknown'}:{primary_line or '?'}: {error_message}",
            "repair_hint": f"Fix PHP syntax/type in {primary_file}:{primary_line}" if primary_file else "Resolve PHP error"
        }

    # -------------------------------------------------------------
    # 9. C# / .NET ERROR PARSER
    # -------------------------------------------------------------
    @classmethod
    def _parse_csharp(cls, text: str) -> Dict[str, Any]:
        primary_file = None
        primary_line = None
        primary_col = None
        error_type = "CSharpError"
        error_message = ""

        # Program.cs(12,9): error CS0103: The name 'foo' does not exist in the current context
        cs_pattern = re.compile(r'(?P<file>[^\s()]+\.cs)\((?P<line>\d+),(?P<col>\d+)\):\s*error\s*(?P<code>CS\d+):\s*(?P<msg>.*)')
        cs_match = cs_pattern.search(text)
        if cs_match:
            primary_file = cs_match.group("file")
            primary_line = int(cs_match.group("line"))
            primary_col = int(cs_match.group("col"))
            error_type = cs_match.group("code")
            error_message = cs_match.group("msg").strip()
        else:
            # Unhandled exception. System.NullReferenceException: ... at Service.Run() in C:\App\Service.cs:line 45
            dotnet_pattern = re.compile(r'Unhandled exception\.\s*(?P<type>[a-zA-Z0-9_.]+(?:Exception|Error))(?::\s*(?P<msg>.*))?')
            d_match = dotnet_pattern.search(text)
            if d_match:
                error_type = d_match.group("type").split(".")[-1]
                error_message = (d_match.group("msg") or "").strip()
            
            line_pattern = re.compile(r'in\s+(?P<file>[^\s:]+\.cs):line\s+(?P<line>\d+)')
            l_match = line_pattern.search(text)
            if l_match:
                primary_file = l_match.group("file")
                primary_line = int(l_match.group("line"))

        return {
            "has_error": True,
            "error_type": error_type,
            "error_message": error_message or "C#/.NET error",
            "primary_file": primary_file,
            "primary_line": primary_line,
            "primary_column": primary_col,
            "stack_frames": [],
            "diagnostic_summary": f"[{error_type}] in {primary_file or 'unknown'}:{primary_line or '?'}: {error_message}",
            "repair_hint": f"Resolve C# issue in {primary_file} at line {primary_line}" if primary_file else "Fix C#/.NET compilation/runtime exception"
        }

    # -------------------------------------------------------------
    # 10. GENERIC FALLBACK PARSER
    # -------------------------------------------------------------
    @classmethod
    def _parse_generic(cls, text: str) -> Dict[str, Any]:
        # Generic file:line search
        file_line_pattern = re.compile(r'(?P<file>[a-zA-Z0-9_./\\-]+\.[a-zA-Z0-9]+):(?P<line>\d+)(?::(?P<col>\d+))?')
        match = file_line_pattern.search(text)
        primary_file = match.group("file") if match else None
        primary_line = int(match.group("line")) if match else None
        primary_col = int(match.group("col")) if match and match.group("col") else None

        return {
            "has_error": True,
            "error_type": "GenericError",
            "error_message": text.strip().splitlines()[-1] if text.strip() else "Error detected",
            "primary_file": primary_file,
            "primary_line": primary_line,
            "primary_column": primary_col,
            "stack_frames": [],
            "diagnostic_summary": f"Error at {primary_file or 'unknown'}:{primary_line or '?'}",
            "repair_hint": f"Inspect {primary_file}:{primary_line} and resolve defect" if primary_file else "Locate and correct the reported failure"
        }
