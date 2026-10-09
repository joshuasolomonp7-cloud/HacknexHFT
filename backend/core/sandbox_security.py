"""
CodeNexus Sandbox Security & Supervised Mode Manager
Enforces workspace boundaries, prevents path traversal, scrubs secrets from output,
and provides approval workflows for supervised mode.
"""

import os
import re
from typing import Dict, Any, Optional


SECRET_PATTERNS = [
    re.compile(r"AIza[0-9A-Za-z-_]{35}"),  # Google API Keys
    re.compile(r"sk-[a-zA-Z0-9]{32,}"),   # Generic secret keys
    re.compile(r"ghp_[a-zA-Z0-9]{36}"),   # GitHub Personal Tokens
]


class SecuritySandbox:
    def __init__(self, workspace_root: str):
        self.workspace_root = os.path.abspath(workspace_root)

    def validate_safe_path(self, target_path: str) -> bool:
        """Ensures target path is strictly within the workspace directory."""
        if not target_path:
            return False
        abs_target = os.path.abspath(os.path.join(self.workspace_root, target_path))
        # Must start with workspace_root
        common = os.path.commonpath([self.workspace_root, abs_target])
        return common == self.workspace_root

    def sanitize_output(self, text: str) -> str:
        """Removes or masks secrets, tokens, and API keys from text outputs."""
        if not text:
            return ""
        sanitized = text
        for pattern in SECRET_PATTERNS:
            sanitized = pattern.sub("[REDACTED_SECRET]", sanitized)
        return sanitized


class SupervisedApprovalManager:
    def __init__(self):
        self.pending_approvals: Dict[str, Dict[str, Any]] = {}
        self.approval_decisions: Dict[str, str] = {}  # request_id -> 'APPROVED' | 'REJECTED'

    def create_approval_request(
        self,
        bug_id: str,
        file_path: str,
        proposed_patch: Dict[str, Any],
        blast_radius: Dict[str, Any],
        risk_level: str
    ) -> Dict[str, Any]:
        req_id = f"apr_{bug_id}_{int(os.times().system * 100)}"
        req_data = {
            "request_id": req_id,
            "bug_id": bug_id,
            "file_path": file_path,
            "proposed_patch": proposed_patch,
            "blast_radius": blast_radius,
            "risk_level": risk_level,
            "status": "PENDING"
        }
        self.pending_approvals[req_id] = req_data
        return req_data

    def submit_decision(self, request_id: str, decision: str) -> Dict[str, Any]:
        if request_id not in self.pending_approvals:
            return {"success": False, "error": f"Approval request '{request_id}' not found."}

        clean_dec = decision.upper()
        self.approval_decisions[request_id] = clean_dec
        self.pending_approvals[request_id]["status"] = clean_dec
        return {"success": True, "request_id": request_id, "decision": clean_dec}

    def get_decision(self, request_id: str) -> Optional[str]:
        return self.approval_decisions.get(request_id)
