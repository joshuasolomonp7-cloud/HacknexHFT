"""
CodeNexus Universal Multi-Language AST Symbol & Dependency Graph Engine
Provides deep AST & polyglot grammar parsing for Python, TypeScript/JavaScript,
Java, C/C++, Go, Rust, C#, Ruby, PHP, and Shell.
Extracts symbols, caller/callee references, cross-file dependencies, and calculates blast radius.
"""

import ast
import os
import re
from typing import Dict, List, Any, Optional, Set, Tuple


class SymbolInfo:
    def __init__(
        self,
        name: str,
        kind: str,  # 'function', 'class', 'method', 'interface', 'struct', 'variable'
        file_path: str,
        start_line: int,
        end_line: int,
        docstring: Optional[str] = None,
        parameters: Optional[List[str]] = None,
        parent: Optional[str] = None,
        code_slice: str = "",
        language: str = "python"
    ):
        self.name = name
        self.kind = kind
        self.file_path = file_path
        self.start_line = start_line
        self.end_line = end_line
        self.docstring = docstring or ""
        self.parameters = parameters or []
        self.parent = parent
        self.code_slice = code_slice
        self.language = language

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "kind": self.kind,
            "file_path": self.file_path,
            "start_line": self.start_line,
            "end_line": self.end_line,
            "docstring": self.docstring,
            "parameters": self.parameters,
            "parent": self.parent,
            "code_slice": self.code_slice,
            "language": self.language
        }


class ASTEngine:
    SUPPORTED_EXTENSIONS = {
        ".py": "python",
        ".js": "javascript",
        ".jsx": "javascript",
        ".ts": "typescript",
        ".tsx": "typescript",
        ".java": "java",
        ".c": "c",
        ".cpp": "cpp",
        ".cc": "cpp",
        ".cxx": "cpp",
        ".h": "c_header",
        ".hpp": "cpp_header",
        ".go": "go",
        ".rs": "rust",
        ".cs": "csharp",
        ".rb": "ruby",
        ".php": "php"
    }

    def __init__(self, repo_path: str):
        self.repo_path = os.path.abspath(repo_path)
        self.symbols: Dict[str, SymbolInfo] = {}  # full_key -> SymbolInfo
        self.file_symbols: Dict[str, List[str]] = {}  # rel_path -> list of symbol full_keys
        self.call_graph: Dict[str, Set[str]] = {}  # caller_symbol -> set(callee_symbol_names)
        self.reverse_call_graph: Dict[str, Set[Tuple[str, str, int]]] = {}  # callee_name -> set((caller_file, caller_name, line))
        self.imports_map: Dict[str, Dict[str, str]] = {}  # rel_path -> {alias/imported_name: module/path}
        self.file_lines: Dict[str, List[str]] = {}
        self.indexed = False

    def index_repository(self) -> Dict[str, Any]:
        """Indexes all supported source files in the repository across all languages."""
        self.symbols.clear()
        self.file_symbols.clear()
        self.call_graph.clear()
        self.reverse_call_graph.clear()
        self.imports_map.clear()
        self.file_lines.clear()

        source_files = []
        for root, dirs, files in os.walk(self.repo_path):
            dirs[:] = [d for d in dirs if d not in (".git", "__pycache__", "venv", ".venv", "node_modules", "dist", "build", "target", "vendor")]
            for file in files:
                _, ext = os.path.splitext(file)
                if ext.lower() in self.SUPPORTED_EXTENSIONS:
                    full_p = os.path.join(root, file)
                    rel_p = os.path.relpath(full_p, self.repo_path).replace("\\", "/")
                    source_files.append((full_p, rel_p, ext.lower()))

        for full_p, rel_p, ext in source_files:
            try:
                with open(full_p, "r", encoding="utf-8", errors="replace") as f:
                    content = f.read()
                lines = content.splitlines()
                self.file_lines[rel_p] = lines
                
                lang = self.SUPPORTED_EXTENSIONS.get(ext, "unknown")
                if ext == ".py":
                    try:
                        tree = ast.parse(content, filename=rel_p)
                        self._index_ast_tree(rel_p, tree, lines)
                    except Exception:
                        self._index_polyglot_source(rel_p, lines, "python")
                else:
                    self._index_polyglot_source(rel_p, lines, lang)
            except Exception:
                pass

        self.indexed = True
        return {
            "indexed_files": len(source_files),
            "total_symbols": len(self.symbols),
            "call_connections": sum(len(v) for v in self.call_graph.values())
        }

    def _index_ast_tree(self, rel_path: str, tree: ast.AST, lines: List[str]):
        """Specialized AST parser for Python source files."""
        self.file_symbols[rel_path] = []
        self.imports_map[rel_path] = {}

        # 1. Index Imports
        for node in ast.iter_child_nodes(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    name = alias.asname or alias.name
                    self.imports_map[rel_path][name] = alias.name
            elif isinstance(node, ast.ImportFrom):
                mod = node.module or ""
                for alias in node.names:
                    name = alias.asname or alias.name
                    self.imports_map[rel_path][name] = f"{mod}.{alias.name}" if mod else alias.name

        # 2. Index Classes & Functions
        class SymbolVisitor(ast.NodeVisitor):
            def __init__(self, engine, path, code_lines):
                self.engine = engine
                self.path = path
                self.lines = code_lines
                self.current_scope = []

            def visit_ClassDef(self, node: ast.ClassDef):
                full_name = f"{self.path}::{node.name}"
                doc = ast.get_docstring(node)
                start_l = getattr(node, 'lineno', 1)
                end_l = getattr(node, 'end_lineno', start_l)
                code_snippet = "\n".join(self.lines[start_l - 1:end_l])

                sym = SymbolInfo(
                    name=node.name,
                    kind="class",
                    file_path=self.path,
                    start_line=start_l,
                    end_line=end_l,
                    docstring=doc,
                    parameters=[],
                    parent=self.current_scope[-1] if self.current_scope else None,
                    code_slice=code_snippet,
                    language="python"
                )
                self.engine.symbols[full_name] = sym
                self.engine.file_symbols[self.path].append(full_name)

                self.current_scope.append(node.name)
                self.generic_visit(node)
                self.current_scope.pop()

            def visit_FunctionDef(self, node: ast.FunctionDef):
                self._handle_func(node)

            def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef):
                self._handle_func(node)

            def _handle_func(self, node):
                parent_class = self.current_scope[-1] if self.current_scope else None
                kind = "method" if parent_class else "function"
                scoped_name = f"{parent_class}.{node.name}" if parent_class else node.name
                full_name = f"{self.path}::{scoped_name}"

                doc = ast.get_docstring(node)
                start_l = getattr(node, 'lineno', 1)
                end_l = getattr(node, 'end_lineno', start_l)
                code_snippet = "\n".join(self.lines[start_l - 1:end_l])

                params = [arg.arg for arg in node.args.args]

                sym = SymbolInfo(
                    name=scoped_name,
                    kind=kind,
                    file_path=self.path,
                    start_line=start_l,
                    end_line=end_l,
                    docstring=doc,
                    parameters=params,
                    parent=parent_class,
                    code_slice=code_snippet,
                    language="python"
                )
                self.engine.symbols[full_name] = sym
                self.engine.file_symbols[self.path].append(full_name)
                self.engine.call_graph[full_name] = set()

                for child in ast.walk(node):
                    if isinstance(child, ast.Call):
                        callee_name = None
                        if isinstance(child.func, ast.Name):
                            callee_name = child.func.id
                        elif isinstance(child.func, ast.Attribute):
                            callee_name = child.func.attr

                        if callee_name:
                            self.engine.call_graph[full_name].add(callee_name)
                            if callee_name not in self.engine.reverse_call_graph:
                                self.engine.reverse_call_graph[callee_name] = set()
                            call_line = getattr(child, 'lineno', start_l)
                            self.engine.reverse_call_graph[callee_name].add((self.path, scoped_name, call_line))

                self.current_scope.append(node.name)
                self.generic_visit(node)
                self.current_scope.pop()

        visitor = SymbolVisitor(self, rel_path, lines)
        visitor.visit(tree)

    def _index_polyglot_source(self, rel_path: str, lines: List[str], language: str):
        """Universal parser extracting classes, functions, structs, and calls across polyglot files."""
        self.file_symbols[rel_path] = []
        self.imports_map[rel_path] = {}

        # Patterns for various languages
        patterns = {
            # JS/TS: function foo(), const foo = () =>, class Bar, interface Baz
            "javascript": [
                (r'^(?:export\s+)?(?:async\s+)?function\s+(?P<name>[a-zA-Z0-9_$]+)\s*\(', "function"),
                (r'^(?:export\s+)?(?:const|let|var)\s+(?P<name>[a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>', "function"),
                (r'^(?:export\s+)?(?:default\s+)?class\s+(?P<name>[a-zA-Z0-9_$]+)', "class"),
            ],
            "typescript": [
                (r'^(?:export\s+)?(?:async\s+)?function\s+(?P<name>[a-zA-Z0-9_$]+)\s*\(', "function"),
                (r'^(?:export\s+)?(?:const|let|var)\s+(?P<name>[a-zA-Z0-9_$]+)\s*(?::\s*[^=]+)?\s*=\s*(?:async\s*)?\([^)]*\)\s*=>', "function"),
                (r'^(?:export\s+)?(?:default\s+)?class\s+(?P<name>[a-zA-Z0-9_$]+)', "class"),
                (r'^(?:export\s+)?interface\s+(?P<name>[a-zA-Z0-9_$]+)', "interface"),
                (r'^(?:export\s+)?type\s+(?P<name>[a-zA-Z0-9_$]+)', "type"),
            ],
            # Java / C#
            "java": [
                (r'^\s*(?:public|private|protected|static|final|\s)+\s+class\s+(?P<name>[a-zA-Z0-9_]+)', "class"),
                (r'^\s*(?:public|private|protected|static|final|\s)+\s+interface\s+(?P<name>[a-zA-Z0-9_]+)', "interface"),
                (r'^\s*(?:public|private|protected|static|final|\s)+[\w<>\[\]]+\s+(?P<name>[a-zA-Z0-9_]+)\s*\([^)]*\)\s*(?:throws\s+[\w,\s]+)?\s*\{', "method"),
            ],
            "csharp": [
                (r'^\s*(?:public|private|protected|internal|static|\s)+\s+class\s+(?P<name>[a-zA-Z0-9_]+)', "class"),
                (r'^\s*(?:public|private|protected|internal|static|\s)+\s+interface\s+(?P<name>[a-zA-Z0-9_]+)', "interface"),
                (r'^\s*(?:public|private|protected|internal|static|\s)+[\w<>\[\]]+\s+(?P<name>[a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{', "method"),
            ],
            # Go: func FunctionName(), func (r *Receiver) MethodName()
            "go": [
                (r'^func\s+(?:\([^)]+\)\s+)?(?P<name>[a-zA-Z0-9_]+)\s*\(', "function"),
                (r'^type\s+(?P<name>[a-zA-Z0-9_]+)\s+struct\s*\{', "struct"),
                (r'^type\s+(?P<name>[a-zA-Z0-9_]+)\s+interface\s*\{', "interface"),
            ],
            # Rust: fn foo(), struct Bar, enum Baz, impl Foo
            "rust": [
                (r'^\s*(?:pub(?:\(crate\))?\s+)?(?:async\s+)?fn\s+(?P<name>[a-zA-Z0-9_]+)', "function"),
                (r'^\s*(?:pub(?:\(crate\))?\s+)?struct\s+(?P<name>[a-zA-Z0-9_]+)', "struct"),
                (r'^\s*(?:pub(?:\(crate\))?\s+)?enum\s+(?P<name>[a-zA-Z0-9_]+)', "enum"),
            ],
            # C / C++
            "c": [
                (r'^\s*(?:[\w*]+\s+)+(?P<name>[a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{', "function"),
                (r'^\s*struct\s+(?P<name>[a-zA-Z0-9_]+)\s*\{', "struct"),
            ],
            "cpp": [
                (r'^\s*(?:[\w*:<>]+\s+)+(?P<name>[a-zA-Z0-9_]+)\s*\([^)]*\)\s*(?:const)?\s*\{', "function"),
                (r'^\s*class\s+(?P<name>[a-zA-Z0-9_]+)', "class"),
                (r'^\s*struct\s+(?P<name>[a-zA-Z0-9_]+)', "struct"),
            ],
            # Ruby / PHP
            "ruby": [
                (r'^\s*def\s+(?P<name>[a-zA-Z0-9_!?]+)', "function"),
                (r'^\s*class\s+(?P<name>[a-zA-Z0-9_:]+)', "class"),
            ],
            "php": [
                (r'^\s*(?:public|private|protected|static|\s)*function\s+(?P<name>[a-zA-Z0-9_]+)\s*\(', "function"),
                (r'^\s*(?:abstract|final|\s)*class\s+(?P<name>[a-zA-Z0-9_]+)', "class"),
            ]
        }

        lang_rules = patterns.get(language, patterns.get("javascript", []))

        current_symbol = None
        for i, line in enumerate(lines):
            line_no = i + 1
            trimmed = line.strip()

            for regex_str, kind in lang_rules:
                match = re.search(regex_str, trimmed)
                if match:
                    sym_name = match.group("name")
                    full_name = f"{rel_path}::{sym_name}"

                    # Estimate span: next 20 lines or until next symbol
                    end_line = min(len(lines), line_no + 25)
                    code_snippet = "\n".join(lines[line_no - 1:end_line])

                    sym = SymbolInfo(
                        name=sym_name,
                        kind=kind,
                        file_path=rel_path,
                        start_line=line_no,
                        end_line=end_line,
                        docstring="",
                        parameters=[],
                        parent=None,
                        code_slice=code_snippet,
                        language=language
                    )
                    self.symbols[full_name] = sym
                    self.file_symbols[rel_path].append(full_name)
                    self.call_graph[full_name] = set()
                    current_symbol = full_name
                    break

            # Track potential function calls in line: identifier(...)
            call_matches = re.findall(r'\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(', trimmed)
            for callee in call_matches:
                if callee not in ("if", "for", "while", "switch", "catch", "return", "function", "sizeof"):
                    if current_symbol:
                        self.call_graph[current_symbol].add(callee)
                    if callee not in self.reverse_call_graph:
                        self.reverse_call_graph[callee] = set()
                    self.reverse_call_graph[callee].add((rel_path, current_symbol or "<top-level>", line_no))

    def find_symbol(self, symbol_name: str) -> Optional[Dict[str, Any]]:
        """Finds primary symbol matching symbol_name across all languages."""
        matches = self.find_all_symbols(symbol_name)
        return matches[0] if matches else None

    def find_all_symbols(self, symbol_name: str) -> List[Dict[str, Any]]:
        """Finds all symbols matching symbol_name across all languages."""
        if not self.indexed:
            self.index_repository()

        matches = []
        short_query = symbol_name.split("::")[-1].split(".")[-1]

        for full_key, info in self.symbols.items():
            if info.name == symbol_name or info.name.endswith(f".{short_query}") or info.name == short_query:
                matches.append(info.to_dict())

        return matches

    def find_callers(self, symbol_name: str) -> List[Dict[str, Any]]:
        """Finds all cross-file callers of the given function/symbol in any language."""
        if not self.indexed:
            self.index_repository()

        short_name = symbol_name.split("::")[-1].split(".")[-1]
        callers = []

        if short_name in self.reverse_call_graph:
            for caller_file, caller_symbol, line in self.reverse_call_graph[short_name]:
                callers.append({
                    "file": caller_file,
                    "caller_file": caller_file,
                    "caller_symbol": caller_symbol,
                    "line": line
                })

        return callers

    def find_related_tests(self, symbol_name: str, file_path: Optional[str] = None) -> List[str]:
        """Finds test files and test methods that verify the given symbol or file in any language."""
        if not self.indexed:
            self.index_repository()

        related_tests = set()
        short_name = symbol_name.split("::")[-1].split(".")[-1]

        # 1. Direct callers in test files
        callers = self.find_callers(short_name)
        for c in callers:
            c_file = c["caller_file"].lower()
            if "test" in c_file or "spec" in c_file or "__tests__" in c_file:
                related_tests.add(f"{c['caller_file']}::{c['caller_symbol']}")

        # 2. Test files named similarly across frameworks
        if file_path:
            base = os.path.splitext(os.path.basename(file_path))[0]
            for f in self.file_lines.keys():
                f_lower = f.lower()
                if (
                    f"test_{base}" in f_lower or
                    f"{base}_test" in f_lower or
                    f"{base}.test" in f_lower or
                    f"{base}.spec" in f_lower or
                    f"test{base}" in f_lower
                ):
                    related_tests.add(f)

        return sorted(list(related_tests))

    def get_code_slice(
        self,
        file_path: str,
        start_line: Optional[int] = None,
        end_line: Optional[int] = None,
        symbol_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """Extracts precise code slice and enclosing symbol scope in any language."""
        if not self.indexed:
            self.index_repository()

        rel_p = file_path.replace("\\", "/")
        if rel_p not in self.file_lines:
            return {"error": f"File '{file_path}' not indexed in repository."}

        lines = self.file_lines[rel_p]
        total_lines = len(lines)

        if symbol_name:
            matches = [s for s in self.symbols.values() if s.file_path == rel_p and s.name == symbol_name]
            if matches:
                target = matches[0]
                return {
                    "file": rel_p,
                    "symbol": target.name,
                    "kind": target.kind,
                    "start_line": target.start_line,
                    "end_line": target.end_line,
                    "code": target.code_slice,
                    "language": target.language
                }

        s_line = max(1, start_line or 1)
        e_line = min(total_lines, end_line or min(total_lines, s_line + 40))

        slice_text = "\n".join([f"{idx + 1:4d} | {lines[idx]}" for idx in range(s_line - 1, e_line)])

        # Enclosing symbol
        enclosing = None
        for sym_key in self.file_symbols.get(rel_p, []):
            sym = self.symbols[sym_key]
            if sym.start_line <= s_line and sym.end_line >= e_line:
                enclosing = sym.name

        return {
            "file": rel_p,
            "start_line": s_line,
            "end_line": e_line,
            "total_lines": total_lines,
            "enclosing_symbol": enclosing,
            "code_slice": slice_text
        }

    def analyze_blast_radius(self, symbol_name: str) -> Dict[str, Any]:
        """Computes the blast radius and regression risk rating of modifying a symbol across all languages."""
        if not self.indexed:
            self.index_repository()

        sym = self.find_symbol(symbol_name)

        callers = self.find_callers(symbol_name)
        affected_files = set(c["caller_file"] for c in callers)
        if sym:
            affected_files.add(sym["file_path"])

        related_tests = self.find_related_tests(symbol_name, sym["file_path"] if sym else None)

        caller_count = len(callers)
        file_count = len(affected_files)
        test_count = len(related_tests)

        if caller_count > 5 or file_count > 3:
            risk_level = "HIGH"
            risk_color = "#f85149"
        elif caller_count > 1 or file_count > 1:
            risk_level = "MEDIUM"
            risk_color = "#d29922"
        else:
            risk_level = "LOW"
            risk_color = "#3fb950"

        return {
            "symbol": symbol_name,
            "target_file": sym["file_path"] if sym else "unknown",
            "caller_count": caller_count,
            "direct_callers": callers,
            "affected_files_count": file_count,
            "affected_files": sorted(list(affected_files)),
            "related_tests_count": test_count,
            "related_tests": related_tests,
            "risk_rating": risk_level,
            "risk_color": risk_color,
            "recommended_verification": "Targeted tests + Full Regression suite" if risk_level != "LOW" else "Targeted unit tests"
        }
