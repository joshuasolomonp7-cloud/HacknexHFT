"""
CodeNexus Git Transactional Snapshot & Auto-Rollback Engine
Provides reliable state preservation, atomic rollback on regression/failures,
and pristine sample repository restoration.
"""

import os
import shutil
import subprocess
import time
import tempfile
from typing import Dict, Any, Optional, List


class GitSandbox:
    def __init__(self, repo_path: str):
        self.repo_path = os.path.abspath(repo_path)
        self.snapshots: Dict[str, str] = {}  # snapshot_token -> backup_dir_path
        self.snapshot_counter = 0

    def _has_git(self) -> bool:
        return os.path.exists(os.path.join(self.repo_path, ".git"))

    def create_snapshot(self, run_id: Optional[str] = None) -> Dict[str, Any]:
        """Takes an atomic snapshot of the repository files."""
        self.snapshot_counter += 1
        token = run_id or f"snap_{int(time.time())}_{self.snapshot_counter}"
        backup_dir = tempfile.mkdtemp(prefix=f"codenexus_{token}_")

        # Copy all repository files except ignored caches
        ignore_dirs = {".git", "__pycache__", ".pytest_cache", "node_modules", "venv", ".venv"}
        
        for item in os.listdir(self.repo_path):
            if item in ignore_dirs:
                continue
            src = os.path.join(self.repo_path, item)
            dst = os.path.join(backup_dir, item)
            if os.path.isdir(src):
                shutil.copytree(src, dst)
            else:
                shutil.copy2(src, dst)

        self.snapshots[token] = backup_dir

        return {
            "snapshot_token": token,
            "timestamp": time.time(),
            "status": "SNAPSHOT_CREATED",
            "message": f"Transactional snapshot '{token}' created successfully."
        }

    def rollback(self, snapshot_token: str) -> Dict[str, Any]:
        """Rolls back the repository files to the pristine snapshot state."""
        if snapshot_token not in self.snapshots:
            return {
                "success": False,
                "error": f"Snapshot token '{snapshot_token}' not found."
            }

        backup_dir = self.snapshots[snapshot_token]
        if not os.path.exists(backup_dir):
            return {
                "success": False,
                "error": f"Snapshot backup path '{backup_dir}' missing."
            }

        try:
            # Clean current repo files (preserving .git if present)
            for item in os.listdir(self.repo_path):
                if item == ".git":
                    continue
                p = os.path.join(self.repo_path, item)
                if os.path.isdir(p):
                    shutil.rmtree(p)
                else:
                    os.remove(p)

            # Restore from backup
            for item in os.listdir(backup_dir):
                src = os.path.join(backup_dir, item)
                dst = os.path.join(self.repo_path, item)
                if os.path.isdir(src):
                    shutil.copytree(src, dst)
                else:
                    shutil.copy2(src, dst)

            return {
                "success": True,
                "status": "ROLLBACK_COMPLETED",
                "snapshot_token": snapshot_token,
                "message": f"Repository successfully restored to snapshot '{snapshot_token}'."
            }
        except Exception as exc:
            return {
                "success": False,
                "error": f"Rollback failed: {str(exc)}"
            }

    def cleanup_snapshots(self):
        """Cleans up temporary snapshot directories."""
        for token, backup_dir in list(self.snapshots.items()):
            try:
                if os.path.exists(backup_dir):
                    shutil.rmtree(backup_dir, ignore_errors=True)
            except Exception:
                pass
        self.snapshots.clear()
