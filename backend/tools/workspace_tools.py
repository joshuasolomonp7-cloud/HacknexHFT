import os
import subprocess
import fnmatch
from typing import List, Dict, Any, Optional

IGNORE_PATTERNS = [
    "*.pyc", "__pycache__", ".git", ".pytest_cache", "venv", ".venv",
    "node_modules", "dist", "build", ".DS_Store"
]

def should_ignore(path: str) -> bool:
    parts = path.replace("\\", "/").split("/")
    for part in parts:
        for pattern in IGNORE_PATTERNS:
            if fnmatch.fnmatch(part, pattern):
                return True
    return False

def list_files(repo_path: str) -> List[str]:
    """Lists all relevant files in the repository."""
    file_list = []
    for root, dirs, files in os.walk(repo_path):
        # Filter directories in-place to avoid descending into ignored folders
        dirs[:] = [d for d in dirs if not should_ignore(d)]
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, repo_path).replace("\\", "/")
            if not should_ignore(rel_path):
                file_list.append(rel_path)
    return sorted(file_list)

def view_file(repo_path: str, file_path: str, start_line: Optional[int] = None, end_line: Optional[int] = None) -> Dict[str, Any]:
    """Reads a file with line numbers, optionally within a line range."""
    full_path = os.path.join(repo_path, file_path)
    if not os.path.exists(full_path):
        return {"error": f"File '{file_path}' not found."}
    
    try:
        with open(full_path, "r", encoding="utf-8", errors="replace") as f:
            lines = f.readlines()
        
        total_lines = len(lines)
        s = max(1, start_line) if start_line else 1
        e = min(total_lines, end_line) if end_line else total_lines
        
        numbered_lines = []
        for idx in range(s - 1, e):
            numbered_lines.append(f"{idx + 1:4d} | {lines[idx].rstrip()}")
            
        return {
            "file_path": file_path,
            "total_lines": total_lines,
            "start_line": s,
            "end_line": e,
            "content": "\n".join(numbered_lines)
        }
    except Exception as exc:
        return {"error": str(exc)}

def search_code(repo_path: str, query: str) -> List[Dict[str, Any]]:
    """Performs recursive search for a query across all files in the repository."""
    matches = []
    files = list_files(repo_path)
    for rel_path in files:
        full_path = os.path.join(repo_path, rel_path)
        try:
            with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                for line_no, line in enumerate(f, 1):
                    if query.lower() in line.lower():
                        matches.append({
                            "file": rel_path,
                            "line": line_no,
                            "content": line.strip()
                        })
        except Exception:
            continue
    return matches[:50]  # Limit to top 50 matches

def edit_file_replace(repo_path: str, file_path: str, old_content: str, new_content: str) -> Dict[str, Any]:
    """Replaces an exact snippet of code in a target file with new code."""
    full_path = os.path.join(repo_path, file_path)
    if not os.path.exists(full_path):
        return {"success": False, "error": f"File '{file_path}' does not exist."}
    
    try:
        with open(full_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Normalize line endings
        content_norm = content.replace("\r\n", "\n")
        old_norm = old_content.replace("\r\n", "\n")
        new_norm = new_content.replace("\r\n", "\n")
        
        if old_norm not in content_norm:
            return {
                "success": False, 
                "error": "Target content to replace was not found in the file. Ensure whitespace and line breaks match exactly."
            }
        
        if content_norm.count(old_norm) > 1:
            return {
                "success": False, 
                "error": "Target content occurs multiple times in the file. Provide a larger unique snippet including surrounding lines."
            }
            
        updated_content = content_norm.replace(old_norm, new_norm, 1)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(updated_content)
            
        return {"success": True, "message": f"Successfully updated {file_path}"}
    except Exception as exc:
        return {"success": False, "error": str(exc)}

def run_tests(repo_path: str, test_cmd: Optional[str] = None) -> Dict[str, Any]:
    """Runs the test suite inside the target repository and captures output."""
    if not test_cmd or test_cmd == "pytest" or test_cmd == "auto":
        # Auto-detect test runner
        if os.path.exists(os.path.join(repo_path, "package.json")):
            test_cmd = "node --test"
        else:
            test_cmd = "python -m unittest discover tests"

    try:
        res = subprocess.run(
            test_cmd,
            shell=True,
            cwd=repo_path,
            capture_output=True,
            text=True,
            timeout=45
        )
        return {
            "exit_code": res.returncode,
            "passed": res.returncode == 0,
            "stdout": res.stdout,
            "stderr": res.stderr
        }
    except subprocess.TimeoutExpired:
        return {
            "exit_code": -1,
            "passed": False,
            "stdout": "",
            "stderr": "Test execution timed out after 45 seconds."
        }
    except Exception as exc:
        return {
            "exit_code": -1,
            "passed": False,
            "stdout": "",
            "stderr": str(exc)
        }
