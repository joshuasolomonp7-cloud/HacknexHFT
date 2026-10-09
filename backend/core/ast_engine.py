"""
CodeNexus AST Symbol & Dependency Graph Engine
Provides deep Python AST parsing, symbol extraction, caller/callee analysis,
reference tracking, and blast radius calculation.
"""

import ast
import os
from typing import Dict, List, Any, Optional, Set, Tuple


class SymbolInfo:
    def __init__(
        self,
        name: str,
        kind: str,  # 'function', 'class', 'method', 'variable'
        file_path: str,
        start_line: int,
        end_line: int,
        docstring: Optional[str] = None,
        parameters: Optional[List[str]] = None,
        parent: Optional[str] = None,
        code_slice: str = ""
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
            "code_slice": self.code_slice
        }


class ASTEngine:
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
        """Indexes all supported source files in the repository."""
        self.symbols.clear()
        self.file_symbols.clear()
        self.call_graph.clear()
        self.reverse_call_graph.clear()
        self.imports_map.clear()
        self.file_lines.clear()

        py_files = []
        for root, dirs, files in os.walk(self.repo_path):
            dirs[:] = [d for d in dirs if d not in (".git", "__pycache__", "venv", ".venv", "node_modules")]
            for file in files:
                if file.endswith(".py"):
                    full_p = os.path.join(root, file)
                    rel_p = os.path.relpath(full_p, self.repo_path).replace("\\", "/")
                    py_files.append((full_p, rel_p))

        for full_p, rel_p in py_files:
            try:
                with open(full_p, "r", encoding="utf-8", errors="replace") as f:
                    content = f.read()
                lines = content.splitlines()
                self.file_lines[rel_p] = lines
                tree = ast.parse(content, filename=rel_p)
                self._index_ast_tree(rel_p, tree, lines)
            except Exception as e:
                # Store fallback for non-parseable files
                pass

        self.indexed = True
        return {
            "indexed_files": len(py_files),
            "total_symbols": len(self.symbols),
            "call_connections": sum(len(v) for v in self.call_graph.values())
        }

    def _index_ast_tree(self, rel_path: str, tree: ast.AST, lines: List[str]):
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
        current_class = None

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
                    code_slice=code_snippet
                )
                self.engine.symbols[full_name] = sym
                self.engine.file_symbols[self.path].append(full_name)

                self.current_scope.append(node.name)
                self.generic_visit(node)
                self.current_scope.pop()

            def visit_FunctionDef(self, node: ast.FunctionDef):
                self._record_func(node)

            def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef):
                self._record_func(node)

            def _record_func(self, node):
                parent_cls = self.current_scope[-1] if self.current_scope else None
                kind = "method" if parent_cls else "function"
                scoped_name = f"{parent_cls}.{node.name}" if parent_cls else node.name
                full_name = f"{self.path}::{scoped_name}"
                doc = ast.get_docstring(node)
                start_l = getattr(node, 'lineno', 1)
                end_l = getattr(node, 'end_lineno', start_l)
                params = [arg.arg for arg in node.args.args]
                code_snippet = "\n".join(self.lines[start_l - 1:end_l])

                sym = SymbolInfo(
                    name=node.name,
                    kind=kind,
                    file_path=self.path,
                    start_line=start_l,
                    end_line=end_l,
                    docstring=doc,
                    parameters=params,
                    parent=parent_cls,
                    code_slice=code_snippet
                )
                self.engine.symbols[full_name] = sym
                self.engine.file_symbols[self.path].append(full_name)

                # Record calls within this function
                caller_key = full_name
                if caller_key not in self.engine.call_graph:
                    self.engine.call_graph[caller_key] = set()

                for child in ast.walk(node):
                    if isinstance(child, ast.Call):
                        callee_name = None
                        if isinstance(child.func, ast.Name):
                            callee_name = child.func.id
                        elif isinstance(child.func, ast.Attribute):
                            callee_name = child.func.attr

                        if callee_name:
                            self.engine.call_graph[caller_key].add(callee_name)
                            if callee_name not in self.engine.reverse_call_graph:
                                self.engine.reverse_call_graph[callee_name] = set()
                            call_line = getattr(child, 'lineno', start_l)
                            self.engine.reverse_call_graph[callee_name].add((self.path, scoped_name, call_line))

                self.current_scope.append(node.name)
                self.generic_visit(node)
                self.current_scope.pop()

        visitor = SymbolVisitor(self, rel_path, lines)
        visitor.visit(tree)

    def find_symbol(self, name: str) -> Optional[Dict[str, Any]]:
        """Finds symbol by exact or short name."""
        if not self.indexed:
            self.index_repository()

        # Check full key
        if name in self.symbols:
            return self.symbols[name].to_dict()

        # Check short name match
        for key, sym in self.symbols.items():
            if sym.name == name or key.endswith(f"::{name}") or key.endswith(f".{name}"):
                return sym.to_dict()

        return None

    def find_callers(self, name: str) -> List[Dict[str, Any]]:
        """Finds all functions/files calling the specified symbol."""
        if not self.indexed:
            self.index_repository()

        callers = []
        short_name = name.split("::")[-1].split(".")[-1]
        
        if short_name in self.reverse_call_graph:
            for file_path, caller_name, line in self.reverse_call_graph[short_name]:
                callers.append({
                    "file": file_path,
                    "caller_symbol": caller_name,
                    "line": line
                })

        return sorted(callers, key=lambda x: (x["file"], x["line"]))

    def find_callees(self, symbol_key: str) -> List[str]:
        """Finds all symbols called by this symbol."""
        if not self.indexed:
            self.index_repository()

        for key, sym in self.symbols.items():
            if key == symbol_key or sym.name == symbol_key or key.endswith(f"::{symbol_key}"):
                return list(self.call_graph.get(key, set()))
        return []

    def find_references(self, symbol_name: str) -> List[Dict[str, Any]]:
        """Finds all text and AST references of a symbol across repository files."""
        if not self.indexed:
            self.index_repository()

        refs = []
        for file_p, lines in self.file_lines.items():
            for line_no, line in enumerate(lines, 1):
                if symbol_name in line:
                    refs.append({
                        "file": file_p,
                        "line": line_no,
                        "line_content": line.strip()
                    })
        return refs

    def find_related_tests(self, symbol_name: str, file_path: Optional[str] = None) -> List[str]:
        """Finds test files and test methods that verify the given symbol or file."""
        if not self.indexed:
            self.index_repository()

        related_tests = set()
        short_name = symbol_name.split("::")[-1].split(".")[-1]

        # 1. Direct callers in test files
        callers = self.find_callers(short_name)
        for c in callers:
            if "test" in c["file"].lower() or "tests" in c["file"].lower():
                related_tests.add(f"{c['file']}::{c['caller_symbol']}")

        # 2. Test files named similarly
        if file_path:
            base = os.path.splitext(os.path.basename(file_path))[0]
            for f in self.file_lines.keys():
                if f"test_{base}" in f.lower() or f"{base}_test" in f.lower():
                    related_tests.add(f)

        return sorted(list(related_tests))

    def get_code_slice(
        self,
        file_path: str,
        start_line: Optional[int] = None,
        end_line: Optional[int] = None,
        symbol_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """Extracts precise code slice and enclosing symbol scope."""
        if not self.indexed:
            self.index_repository()

        rel_p = file_path.replace("\\", "/")
        if rel_p not in self.file_lines:
            # Try finding matching file
            for p in self.file_lines:
                if p.endswith(rel_p):
                    rel_p = p
                    break

        if rel_p not in self.file_lines:
            return {"error": f"File '{file_path}' not found in index."}

        lines = self.file_lines[rel_p]
        total_lines = len(lines)

        if symbol_name:
            sym = self.find_symbol(symbol_name)
            if sym and sym["file_path"] == rel_p:
                start_line = sym["start_line"]
                end_line = sym["end_line"]

        s = max(1, start_line) if start_line else 1
        e = min(total_lines, end_line) if end_line else total_lines

        numbered = [f"{i:4d} | {lines[i - 1]}" for i in range(s, e + 1)]

        # Determine enclosing symbol
        enclosing_symbol = None
        for key in self.file_symbols.get(rel_p, []):
            sym = self.symbols[key]
            if sym.start_line <= s and sym.end_line >= e:
                enclosing_symbol = sym.name

        return {
            "file_path": rel_p,
            "start_line": s,
            "end_line": e,
            "total_lines": total_lines,
            "enclosing_symbol": enclosing_symbol,
            "code_slice": "\n".join(numbered)
        }

    def analyze_blast_radius(self, symbol_name: str) -> Dict[str, Any]:
        """Calculates affected callers, affected files, test coverage, and risk rating."""
        if not self.indexed:
            self.index_repository()

        sym = self.find_symbol(symbol_name)
        callers = self.find_callers(symbol_name)
        
        affected_files = set()
        if sym:
            affected_files.add(sym["file_path"])
        for c in callers:
            affected_files.add(c["file"])

        related_tests = self.find_related_tests(symbol_name, sym["file_path"] if sym else None)

        # Risk scoring
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
