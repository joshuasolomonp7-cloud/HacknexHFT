"""
CodeNexus Patch Engine & Quality Metrics
Generates structured diffs (line additions/deletions), applies surgical edits,
and calculates mathematical patch quality metrics (+lines, -lines, minimality, blast radius risk).
"""

import difflib
import os
from typing import Dict, List, Any, Optional


class PatchEngine:
    def __init__(self, repo_path: str):
        self.repo_path = os.path.abspath(repo_path)

    def generate_diff(
        self,
        file_path: str,
        old_content: str,
        new_content: str
    ) -> Dict[str, Any]:
        """Generates unified diff and structured line-by-line diff with line numbers."""
        old_lines = old_content.splitlines(keepends=True)
        new_lines = new_content.splitlines(keepends=True)

        diff = list(difflib.unified_diff(
            old_lines,
            new_lines,
            fromfile=f"a/{file_path}",
            tofile=f"b/{file_path}"
        ))

        # Structured diff lines for visual UI rendering
        structured_lines = []
        old_lineno = 1
        new_lineno = 1
        lines_added = 0
        lines_removed = 0

        matcher = difflib.SequenceMatcher(None, old_content.splitlines(), new_content.splitlines())
        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == 'equal':
                for k in range(i1, i2):
                    structured_lines.append({
                        "type": "context",
                        "old_line": k + 1,
                        "new_line": j1 + (k - i1) + 1,
                        "content": old_content.splitlines()[k]
                    })
            elif tag == 'replace':
                for k in range(i1, i2):
                    lines_removed += 1
                    structured_lines.append({
                        "type": "deletion",
                        "old_line": k + 1,
                        "new_line": None,
                        "content": old_content.splitlines()[k]
                    })
                for k in range(j1, j2):
                    lines_added += 1
                    structured_lines.append({
                        "type": "addition",
                        "old_line": None,
                        "new_line": k + 1,
                        "content": new_content.splitlines()[k]
                    })
            elif tag == 'delete':
                for k in range(i1, i2):
                    lines_removed += 1
                    structured_lines.append({
                        "type": "deletion",
                        "old_line": k + 1,
                        "new_line": None,
                        "content": old_content.splitlines()[k]
                    })
            elif tag == 'insert':
                for k in range(j1, j2):
                    lines_added += 1
                    structured_lines.append({
                        "type": "addition",
                        "old_line": None,
                        "new_line": k + 1,
                        "content": new_content.splitlines()[k]
                    })

        total_file_lines = len(old_content.splitlines())
        changed_lines = lines_added + lines_removed
        # Minimality score: closer to 1.0 means highly surgical relative to file size
        minimality_score = round(max(0.05, 1.0 - (changed_lines / max(20, total_file_lines))), 2)

        return {
            "file_path": file_path,
            "raw_diff": "".join(diff),
            "structured_lines": structured_lines,
            "lines_added": lines_added,
            "lines_removed": lines_removed,
            "minimality_score": minimality_score
        }

    def apply_patch_safe(
        self,
        file_path: str,
        target_old_snippet: str,
        replacement_snippet: str
    ) -> Dict[str, Any]:
        """Applies a patch surgically and calculates exact quality metrics."""
        full_path = os.path.join(self.repo_path, file_path)
        if not os.path.exists(full_path):
            return {
                "success": False,
                "error": f"Target file '{file_path}' does not exist in workspace."
            }

        with open(full_path, "r", encoding="utf-8") as f:
            original_file_content = f.read()

        norm_original = original_file_content.replace("\r\n", "\n")
        norm_old = target_old_snippet.replace("\r\n", "\n")
        norm_new = replacement_snippet.replace("\r\n", "\n")

        if norm_old not in norm_original:
            return {
                "success": False,
                "error": f"Snippet not found in '{file_path}'. Verify lines and indentation."
            }

        if norm_original.count(norm_old) > 1:
            return {
                "success": False,
                "error": f"Snippet matched multiple locations in '{file_path}'. Provide more context lines."
            }

        updated_file_content = norm_original.replace(norm_old, norm_new, 1)

        diff_info = self.generate_diff(file_path, original_file_content, updated_file_content)

        # Write safely
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(updated_file_content)

        return {
            "success": True,
            "file_path": file_path,
            "diff": diff_info,
            "lines_added": diff_info["lines_added"],
            "lines_removed": diff_info["lines_removed"],
            "minimality_score": diff_info["minimality_score"],
            "message": f"Applied patch to {file_path}: +{diff_info['lines_added']} / -{diff_info['lines_removed']} lines."
        }
