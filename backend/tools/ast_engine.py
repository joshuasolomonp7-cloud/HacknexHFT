import ast
import os
import re
from typing import Dict, List, Any, Optional

class SymbolVisitor(ast.NodeVisitor):
    def __init__(self, file_path: str, repo_root: str):
        self.file_path = file_path.replace("\\", "/")
        self.repo_root = repo_root
        self.rel_path = os.path.relpath(file_path, repo_root).replace("\\", "/")
        self.symbols = []
        self.calls = []
        self.imports = []
        self.current_class = None

    def visit_Import(self, node):
        for alias in node.names:
            self.imports.append({"name": alias.name, "asname": alias.asname, "line": node.lineno})
        self.generic_visit(node)

    def visit_ImportFrom(self, node):
        module = node.module or ""
        for alias in node.names:
            self.imports.append({"module": module, "name": alias.name, "asname": alias.asname, "line": node.lineno})
        self.generic_visit(node)

    def visit_ClassDef(self, node):
        symbol = {
            "type": "class",
            "name": node.name,
            "file": self.rel_path,
            "line_start": node.lineno,
            "line_end": getattr(node, "end_lineno", node.lineno),
            "docstring": ast.get_docstring(node),
            "parent_class": None
        }
        self.symbols.append(symbol)
        old_class = self.current_class
        self.current_class = node.name
        self.generic_visit(node)
        self.current_class = old_class

    def visit_FunctionDef(self, node):
        self._record_func(node)
        self.generic_visit(node)

    def visit_AsyncFunctionDef(self, node):
        self._record_func(node)
        self.generic_visit(node)

    def _record_func(self, node):
        args = [arg.arg for arg in node.args.args]
        symbol = {
            "type": "method" if self.current_class else "function",
            "name": node.name,
            "full_name": f"{self.current_class}.{node.name}" if self.current_class else node.name,
            "file": self.rel_path,
            "line_start": node.lineno,
            "line_end": getattr(node, "end_lineno", node.lineno),
            "args": args,
            "docstring": ast.get_docstring(node),
            "class": self.current_class
        }
        self.symbols.append(symbol)

    def visit_Call(self, node):
        call_name = None
        if isinstance(node.func, ast.Name):
            call_name = node.func.id
        elif isinstance(node.func, ast.Attribute):
            call_name = node.func.attr
        
        if call_name:
            self.calls.append({
                "name": call_name,
                "file": self.rel_path,
                "line": node.lineno
            })
        self.generic_visit(node)


def build_repo_symbol_index(repo_path: str) -> Dict[str, Any]:
    """Parses AST for all Python files in the repository and indexes symbols and calls."""
    symbols = []
    calls = []
    imports = []
    
    for root, _, files in os.walk(repo_path):
        for f in files:
            if f.endswith(".py"):
                full_path = os.path.join(root, f)
                try:
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as src:
                        tree = ast.parse(src.read(), filename=full_path)
                    visitor = SymbolVisitor(full_path, repo_path)
                    visitor.visit(tree)
                    symbols.extend(visitor.symbols)
                    calls.extend(visitor.calls)
                    imports.extend(visitor.imports)
                except Exception:
                    continue
                    
    return {
        "symbols": symbols,
        "calls": calls,
        "imports": imports,
        "symbol_count": len(symbols),
        "call_count": len(calls)
    }

def find_symbol(repo_path: str, symbol_name: str) -> List[Dict[str, Any]]:
    """Locates symbol definitions in the AST."""
    index = build_repo_symbol_index(repo_path)
    matches = []
    for sym in index["symbols"]:
        if sym["name"] == symbol_name or sym.get("full_name") == symbol_name:
            matches.append(sym)
    return matches

def find_callers(repo_path: str, symbol_name: str) -> List[Dict[str, Any]]:
    """Finds all places where a function or method is invoked in the codebase."""
    index = build_repo_symbol_index(repo_path)
    callers = []
    for call in index["calls"]:
        if call["name"] == symbol_name:
            callers.append(call)
    return callers

def analyze_blast_radius(repo_path: str, symbol_name: str) -> Dict[str, Any]:
    """Calculates the change impact / blast radius of modifying a symbol."""
    definitions = find_symbol(repo_path, symbol_name)
    callers = find_callers(repo_path, symbol_name)
    
    affected_files = list(set([c["file"] for c in callers] + [d["file"] for d in definitions]))
    test_files_affected = [f for f in affected_files if "test" in f.lower()]
    prod_files_affected = [f for f in affected_files if "test" not in f.lower()]
    
    caller_count = len(callers)
    if caller_count > 6 or len(prod_files_affected) > 3:
        risk = "HIGH 🔴"
    elif caller_count > 1 or len(prod_files_affected) > 1:
        risk = "MEDIUM 🟡"
    else:
        risk = "LOW 🟢"
        
    return {
        "target_symbol": symbol_name,
        "definitions": definitions,
        "direct_callers": callers,
        "caller_count": caller_count,
        "affected_files": affected_files,
        "affected_test_files": test_files_affected,
        "risk_level": risk,
        "recommended_scope": f"Verify {len(affected_files)} affected files and {len(test_files_affected)} test suites."
    }
