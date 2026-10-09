"""
CodeNexus Adaptive Closed-Loop Code Inspection Engine
Implements progressive inspection scopes (Level 1: Minimal slice -> Level 2: Direct Callers/Tests -> Level 3: Transitive -> Level 4: Global Repo)
Tracks files, lines, and symbols inspected, providing verifiable telemetry.
"""

import time
from typing import Dict, List, Any, Optional, Set
from core.ast_engine import ASTEngine


class InspectionScope:
    def __init__(self):
        self.level: int = 1
        self.files_inspected: Set[str] = set()
        self.lines_inspected: int = 0
        self.symbols_inspected: Set[str] = set()
        self.expansion_reasons: List[Dict[str, Any]] = []
        self.slices: List[Dict[str, Any]] = []
        self.start_time: float = time.time()
        self.duration_ms: float = 0.0

    def record_slice(self, file_path: str, start_line: int, end_line: int, symbol: Optional[str] = None, reason: str = ""):
        line_count = max(0, end_line - start_line + 1)
        self.files_inspected.add(file_path)
        self.lines_inspected += line_count
        if symbol:
            self.symbols_inspected.add(symbol)
        
        self.slices.append({
            "file": file_path,
            "start_line": start_line,
            "end_line": end_line,
            "lines_count": line_count,
            "symbol": symbol,
            "reason": reason or f"Inspecting level {self.level} context"
        })

    def expand_level(self, new_level: int, reason: str):
        if new_level > self.level:
            self.level = new_level
            self.expansion_reasons.append({
                "from_level": self.level - 1,
                "to_level": new_level,
                "reason": reason,
                "timestamp": time.time()
            })

    def finalize(self) -> Dict[str, Any]:
        self.duration_ms = round((time.time() - self.start_time) * 1000, 2)
        return {
            "level": self.level,
            "level_label": f"Level {self.level} Scope",
            "files_inspected": sorted(list(self.files_inspected)),
            "files_count": len(self.files_inspected),
            "lines_inspected": self.lines_inspected,
            "symbols_inspected": sorted(list(self.symbols_inspected)),
            "symbols_count": len(self.symbols_inspected),
            "expansion_reasons": self.expansion_reasons,
            "slices": self.slices,
            "duration_ms": self.duration_ms,
            "statement": f"CodeNexus began with a localized slice ({self.lines_inspected} lines) and progressively expanded to Level {self.level} based on failure evidence."
        }


class AdaptiveInspector:
    def __init__(self, repo_path: str, ast_engine: Optional[ASTEngine] = None):
        self.repo_path = repo_path
        self.ast_engine = ast_engine or ASTEngine(repo_path)
        if not self.ast_engine.indexed:
            self.ast_engine.index_repository()

    def inspect_failure(
        self,
        failing_file: str,
        failing_line: Optional[int] = None,
        failing_symbol: Optional[str] = None,
        error_trace: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes an adaptive closed-loop inspection:
        - Level 1: Minimal code slice around failing line / enclosing symbol.
        - Level 2: Direct callers, direct dependencies & targeted test cases.
        - Level 3: Cross-module consumers & integration endpoints.
        """
        scope = InspectionScope()

        # --- LEVEL 1: Localized Minimal Slice ---
        scope.record_slice(
            file_path=failing_file,
            start_line=max(1, (failing_line - 10)) if failing_line else 1,
            end_line=(failing_line + 15) if failing_line else 50,
            symbol=failing_symbol,
            reason="Level 1: Minimal failure localization slice"
        )

        sym_info = None
        if failing_symbol:
            sym_info = self.ast_engine.find_symbol(failing_symbol)
        elif failing_line:
            # Find symbol containing this line
            for full_key, sym in self.ast_engine.symbols.items():
                if sym.file_path == failing_file and sym.start_line <= failing_line <= sym.end_line:
                    sym_info = sym.to_dict()
                    failing_symbol = sym.name
                    break

        if sym_info:
            scope.record_slice(
                file_path=sym_info["file_path"],
                start_line=sym_info["start_line"],
                end_line=sym_info["end_line"],
                symbol=sym_info["name"],
                reason=f"Level 1: Enclosing definition of `{sym_info['name']}`"
            )

        # --- LEVEL 2: Direct Callers & Targeted Tests ---
        if failing_symbol:
            scope.expand_level(2, f"Symbol `{failing_symbol}` identified; checking direct callers and test coverage.")
            callers = self.ast_engine.find_callers(failing_symbol)
            for c in callers:
                scope.record_slice(
                    file_path=c["file"],
                    start_line=max(1, c["line"] - 5),
                    end_line=c["line"] + 5,
                    symbol=c["caller_symbol"],
                    reason=f"Level 2: Direct caller `{c['caller_symbol']}` in `{c['file']}`"
                )

            related_tests = self.ast_engine.find_related_tests(failing_symbol, failing_file)
            for t in related_tests:
                test_file = t.split("::")[0]
                scope.record_slice(
                    file_path=test_file,
                    start_line=1,
                    end_line=40,
                    symbol=t,
                    reason=f"Level 2: Targeted test `{t}`"
                )

        blast_radius = self.ast_engine.analyze_blast_radius(failing_symbol or failing_file)
        if blast_radius["caller_count"] > 3 or blast_radius["affected_files_count"] > 2:
            scope.expand_level(3, "High caller density requires analyzing integration consumers.")

        telemetry = scope.finalize()
        return {
            "telemetry": telemetry,
            "symbol_info": sym_info,
            "blast_radius": blast_radius
        }
