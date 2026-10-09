"""
CodeNexus Bug Identity & Multi-Bug Orchestrator
Manages unique bug identities (CNX-B001, CNX-B002), lifecycle state machines,
Bug DNA/fingerprints, dependency-aware repair queues, and history tracking.
"""

import time
import hashlib
from typing import Dict, List, Any, Optional, Set
from enum import Enum


class BugState(str, Enum):
    DETECTED = "DETECTED"
    ANALYZING = "ANALYZING"
    ROOT_CAUSE_IDENTIFIED = "ROOT_CAUSE_IDENTIFIED"
    REPAIR_PLANNED = "REPAIR_PLANNED"
    PATCHING = "PATCHING"
    TESTING = "TESTING"
    REPAIR_FAILED = "REPAIR_FAILED"
    RETRYING = "RETRYING"
    VERIFIED = "VERIFIED"
    BLOCKED = "BLOCKED"
    ROLLED_BACK = "ROLLED_BACK"


class BugRecord:
    def __init__(
        self,
        bug_id: str,
        title: str,
        description: str,
        file_path: str,
        line_number: Optional[int] = None,
        symbol_name: Optional[str] = None,
        severity: str = "MEDIUM",  # LOW, MEDIUM, HIGH, CRITICAL
        priority: int = 1,
        dependencies: Optional[List[str]] = None
    ):
        self.id = bug_id
        self.title = title
        self.description = description
        self.file_path = file_path
        self.line_number = line_number
        self.symbol_name = symbol_name
        self.severity = severity
        self.priority = priority
        self.dependencies = dependencies or []
        self.state = BugState.DETECTED
        self.created_at = time.time()
        self.updated_at = time.time()

        self.root_cause: Optional[str] = None
        self.proposed_patch: Optional[Dict[str, Any]] = None
        self.patch_history: List[Dict[str, Any]] = []
        self.repair_attempts: int = 0
        self.max_attempts: int = 3
        
        # Evidence objects
        self.before_evidence: Optional[Dict[str, Any]] = None
        self.after_evidence: Optional[Dict[str, Any]] = None
        self.history_events: List[Dict[str, Any]] = []

        self._record_transition(BugState.DETECTED, "Defect detected in repository analysis/test suite.")

    def _generate_fingerprint(self) -> str:
        """Generates a unique DNA fingerprint for visual traceability."""
        raw = f"{self.id}:{self.file_path}:{self.line_number}:{self.symbol_name}:{self.severity}"
        return hashlib.sha256(raw.encode()).hexdigest()[:12].upper()

    def _record_transition(self, new_state: BugState, reason: str = ""):
        self.state = new_state
        self.updated_at = time.time()
        self.history_events.append({
            "state": new_state.value,
            "reason": reason,
            "timestamp": self.updated_at
        })

    def transition_to(self, new_state: BugState, reason: str = ""):
        self._record_transition(new_state, reason)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "dna_fingerprint": self._generate_fingerprint(),
            "title": self.title,
            "description": self.description,
            "file_path": self.file_path,
            "line_number": self.line_number,
            "symbol_name": self.symbol_name,
            "severity": self.severity,
            "priority": self.priority,
            "dependencies": self.dependencies,
            "state": self.state.value,
            "root_cause": self.root_cause,
            "repair_attempts": self.repair_attempts,
            "max_attempts": self.max_attempts,
            "proposed_patch": self.proposed_patch,
            "patch_history_count": len(self.patch_history),
            "before_evidence": self.before_evidence,
            "after_evidence": self.after_evidence,
            "history_events": self.history_events,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }


class BugOrchestrator:
    def __init__(self):
        self.bugs: Dict[str, BugRecord] = {}
        self.next_index: int = 1

    def create_bug(
        self,
        title: str,
        description: str,
        file_path: str,
        line_number: Optional[int] = None,
        symbol_name: Optional[str] = None,
        severity: str = "MEDIUM",
        priority: int = 1,
        dependencies: Optional[List[str]] = None,
        custom_id: Optional[str] = None
    ) -> BugRecord:
        bug_id = custom_id or f"CNX-B{self.next_index:03d}"
        self.next_index += 1

        record = BugRecord(
            bug_id=bug_id,
            title=title,
            description=description,
            file_path=file_path,
            line_number=line_number,
            symbol_name=symbol_name,
            severity=severity,
            priority=priority,
            dependencies=dependencies
        )
        self.bugs[bug_id] = record
        return record

    def get_bug(self, bug_id: str) -> Optional[BugRecord]:
        return self.bugs.get(bug_id)

    def get_all_bugs(self) -> List[Dict[str, Any]]:
        return [b.to_dict() for b in self.bugs.values()]

    def get_dependency_ordered_queue(self) -> List[BugRecord]:
        """
        Returns bugs topologically sorted by their dependency graph.
        Independent bugs or prerequisite bugs are scheduled first.
        """
        visited: Set[str] = set()
        order: List[BugRecord] = []

        def dfs(bug_id: str, ancestors: Set[str]):
            if bug_id in ancestors:
                # Circular dependency fallback
                return
            if bug_id in visited or bug_id not in self.bugs:
                return

            ancestors.add(bug_id)
            bug = self.bugs[bug_id]
            for dep in bug.dependencies:
                if dep in self.bugs:
                    dfs(dep, ancestors)

            ancestors.remove(bug_id)
            visited.add(bug_id)
            order.append(bug)

        for b_id in self.bugs:
            if b_id not in visited:
                dfs(b_id, set())

        return order

    def clear(self):
        self.bugs.clear()
        self.next_index = 1
