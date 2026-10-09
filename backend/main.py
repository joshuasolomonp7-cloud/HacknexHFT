import os
import io
import shutil
import zipfile
import json
import asyncio
import subprocess
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse, StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from core.agent import SWEAgent
from core.ast_engine import ASTEngine
from core.benchmark_runner import BenchmarkRunner
from tools import workspace_tools

load_dotenv()

app = FastAPI(title="CodeNexus Autonomous Software Repair Platform", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAMPLE_REPOS_DIR = os.path.abspath(os.path.join(BASE_DIR, "sample_repos"))
WORKSPACES_DIR = os.path.abspath(os.path.join(BASE_DIR, "workspaces"))

os.makedirs(WORKSPACES_DIR, exist_ok=True)


class CloneRequest(BaseModel):
    url: str
    branch: Optional[str] = None
    name: Optional[str] = None


class CreateFileRequest(BaseModel):
    path: str
    file_name: str
    content: Optional[str] = ""


class SaveFileRequest(BaseModel):
    path: str
    file_name: str
    content: str


class DeleteFileRequest(BaseModel):
    path: str
    file_name: str


class ExecCommandRequest(BaseModel):
    path: str
    command: str


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "CodeNexus Autonomous Software Repair Backend",
        "version": "2.0.0",
        "features": [
            "GitHub Clone & Direct Repository Sync",
            "Drag-and-Drop File, Folder & ZIP Workspace Ingestion",
            "Real AST Symbol & Blast Radius Dependency Engine",
            "Adaptive Closed-Loop Inspection & Repair",
            "Dynamic Bug Identity Tracking",
            "Git Transactional Snapshots & Auto-Rollback",
            "Layered Verification Pipeline (Syntax/Targeted/Regression)",
            "ZIP & Unified Git Patch Export",
            "Interactive Shell & Terminal Execution"
        ]
    }


@app.get("/api/workspaces")
@app.get("/api/repos")
def list_workspaces():
    """Lists all available workspaces from both user workspaces and sample templates."""
    workspaces = []
    
    # 1. User Workspaces (Cloned & Uploaded)
    if os.path.exists(WORKSPACES_DIR):
        for item in sorted(os.listdir(WORKSPACES_DIR)):
            item_path = os.path.join(WORKSPACES_DIR, item)
            if os.path.isdir(item_path):
                files = workspace_tools.list_files(item_path)
                workspaces.append({
                    "name": item,
                    "path": item_path,
                    "type": "custom",
                    "files": files,
                    "file_count": len(files)
                })

    # 2. Sample Templates
    if os.path.exists(SAMPLE_REPOS_DIR):
        for item in sorted(os.listdir(SAMPLE_REPOS_DIR)):
            item_path = os.path.join(SAMPLE_REPOS_DIR, item)
            if os.path.isdir(item_path):
                files = workspace_tools.list_files(item_path)
                workspaces.append({
                    "name": f"{item} (Sample)",
                    "raw_name": item,
                    "path": item_path,
                    "type": "sample",
                    "files": files,
                    "file_count": len(files)
                })

    return {"repos": workspaces, "workspaces": workspaces}


@app.post("/api/repo/clone")
def clone_github_repo(req: CloneRequest):
    """Clones a remote GitHub/Git repository directly into a new workspace."""
    if not req.url or not req.url.strip():
        raise HTTPException(status_code=400, detail="Repository URL is required.")

    url = req.url.strip()
    repo_name = req.name.strip() if req.name else ""
    if not repo_name:
        # Infer name from URL
        base_name = url.rstrip("/").split("/")[-1]
        if base_name.endswith(".git"):
            base_name = base_name[:-4]
        repo_name = "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in base_name)
        if not repo_name:
            repo_name = f"cloned_repo_{int(asyncio.get_event_loop().time())}"

    dest_path = os.path.join(WORKSPACES_DIR, repo_name)
    
    # If already exists, generate a unique name
    counter = 1
    orig_name = repo_name
    while os.path.exists(dest_path):
        repo_name = f"{orig_name}_{counter}"
        dest_path = os.path.join(WORKSPACES_DIR, repo_name)
        counter += 1

    cmd = ["git", "clone", "--depth", "1"]
    if req.branch:
        cmd.extend(["-b", req.branch])
    cmd.extend([url, dest_path])

    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=90)
        if res.returncode != 0:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "error": f"Git clone failed: {res.stderr or res.stdout}"
                }
            )

        files = workspace_tools.list_files(dest_path)
        return {
            "success": True,
            "name": repo_name,
            "path": dest_path,
            "files": files,
            "message": f"Successfully cloned '{url}' into workspace '{repo_name}'."
        }
    except subprocess.TimeoutExpired:
        return JSONResponse(
            status_code=408,
            content={"success": False, "error": "Git clone timed out after 90 seconds."}
        )
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(exc)}
        )


@app.post("/api/repo/upload_zip")
async def upload_zip_workspace(file: UploadFile = File(...), workspace_name: Optional[str] = Form(None)):
    """Accepts a ZIP archive, extracts it into a workspace folder, and indexes it."""
    try:
        contents = await file.read()
        zip_buffer = io.BytesIO(contents)
        
        target_name = workspace_name or os.path.splitext(file.filename)[0] or "uploaded_project"
        target_name = "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in target_name)
        
        dest_path = os.path.join(WORKSPACES_DIR, target_name)
        counter = 1
        orig_name = target_name
        while os.path.exists(dest_path):
            target_name = f"{orig_name}_{counter}"
            dest_path = os.path.join(WORKSPACES_DIR, target_name)
            counter += 1

        os.makedirs(dest_path, exist_ok=True)

        with zipfile.ZipFile(zip_buffer, "r") as zip_ref:
            # Check for common top-level directory in ZIP
            namelist = zip_ref.namelist()
            top_dirs = {p.split("/")[0] for p in namelist if "/" in p}
            
            zip_ref.extractall(dest_path)
            
            # If everything was wrapped in a single root folder, move contents up
            subdirs = [d for d in os.listdir(dest_path) if os.path.isdir(os.path.join(dest_path, d))]
            subfiles = [f for f in os.listdir(dest_path) if os.path.isfile(os.path.join(dest_path, f))]
            if len(subdirs) == 1 and len(subfiles) == 0:
                inner_dir = os.path.join(dest_path, subdirs[0])
                for inner_item in os.listdir(inner_dir):
                    shutil.move(os.path.join(inner_dir, inner_item), dest_path)
                os.rmdir(inner_dir)

        files = workspace_tools.list_files(dest_path)
        return {
            "success": True,
            "name": target_name,
            "path": dest_path,
            "files": files,
            "message": f"Successfully extracted ZIP archive into workspace '{target_name}'."
        }
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": f"Failed to process ZIP upload: {str(exc)}"}
        )


@app.post("/api/repo/upload_files")
async def upload_multiple_files(
    files: List[UploadFile] = File(...),
    paths: Optional[str] = Form(None),
    workspace_name: Optional[str] = Form(None)
):
    """Accepts multiple drag-and-dropped files or a directory tree and creates a workspace."""
    try:
        target_name = workspace_name or "drag_drop_workspace"
        target_name = "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in target_name)
        
        dest_path = os.path.join(WORKSPACES_DIR, target_name)
        os.makedirs(dest_path, exist_ok=True)

        rel_paths = []
        if paths:
            try:
                rel_paths = json.loads(paths)
            except Exception:
                rel_paths = [p.strip() for p in paths.split(",")]

        saved_files = []
        for idx, file_obj in enumerate(files):
            rel_path = rel_paths[idx] if idx < len(rel_paths) else file_obj.filename
            rel_path = rel_path.lstrip("/\\")
            
            full_target_file = os.path.join(dest_path, rel_path)
            os.makedirs(os.path.dirname(full_target_file), exist_ok=True)
            
            content = await file_obj.read()
            with open(full_target_file, "wb") as f:
                f.write(content)
            saved_files.append(rel_path)

        indexed_files = workspace_tools.list_files(dest_path)
        return {
            "success": True,
            "name": target_name,
            "path": dest_path,
            "files": indexed_files,
            "message": f"Saved {len(saved_files)} files into workspace '{target_name}'."
        }
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": f"Failed to upload files: {str(exc)}"}
        )


@app.get("/api/repo/files")
def get_repo_files(path: str = Query(...)):
    if not os.path.exists(path):
        return {"error": "Repository path does not exist.", "files": []}
    files = workspace_tools.list_files(path)
    return {"files": files}


@app.get("/api/repo/file_content")
def get_file_content(path: str = Query(...), file: str = Query(...)):
    res = workspace_tools.view_file(path, file)
    # Also provide raw content for code editing
    full_path = os.path.join(path, file)
    if os.path.exists(full_path) and os.path.isfile(full_path):
        try:
            with open(full_path, "r", encoding="utf-8", errors="replace") as f:
                res["raw_content"] = f.read()
        except Exception:
            res["raw_content"] = ""
    return res


@app.post("/api/repo/save_file")
def save_file_content(req: SaveFileRequest):
    """Saves updated code to a file."""
    full_path = os.path.join(req.path, req.file_name)
    try:
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(req.content)
        return {"success": True, "message": f"File '{req.file_name}' saved successfully."}
    except Exception as exc:
        return JSONResponse(status_code=500, content={"success": False, "error": str(exc)})


@app.post("/api/repo/create_file")
def create_new_file(req: CreateFileRequest):
    """Creates a new file or directory in the target workspace."""
    full_path = os.path.join(req.path, req.file_name)
    if os.path.exists(full_path):
        return JSONResponse(status_code=400, content={"success": False, "error": "File already exists."})

    try:
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(req.content or "")
        return {
            "success": True,
            "message": f"Created file '{req.file_name}'.",
            "files": workspace_tools.list_files(req.path)
        }
    except Exception as exc:
        return JSONResponse(status_code=500, content={"success": False, "error": str(exc)})


@app.post("/api/repo/delete_file")
def delete_file(req: DeleteFileRequest):
    """Deletes a file from the target workspace."""
    full_path = os.path.join(req.path, req.file_name)
    if not os.path.exists(full_path):
        return JSONResponse(status_code=404, content={"success": False, "error": "File does not exist."})

    try:
        if os.path.isdir(full_path):
            shutil.rmtree(full_path)
        else:
            os.remove(full_path)
        return {
            "success": True,
            "message": f"Deleted '{req.file_name}'.",
            "files": workspace_tools.list_files(req.path)
        }
    except Exception as exc:
        return JSONResponse(status_code=500, content={"success": False, "error": str(exc)})


@app.post("/api/repo/run_test")
def execute_test(path: str = Query(...), cmd: str = Query("auto")):
    res = workspace_tools.run_tests(path, cmd)
    return res


@app.post("/api/repo/terminal_exec")
def execute_terminal_command(req: ExecCommandRequest):
    """Executes an arbitrary shell or CLI command inside the target workspace."""
    if not os.path.exists(req.path):
        return JSONResponse(status_code=404, content={"error": "Workspace path not found."})

    try:
        res = subprocess.run(
            req.command,
            shell=True,
            cwd=req.path,
            capture_output=True,
            text=True,
            timeout=60
        )
        return {
            "command": req.command,
            "exit_code": res.returncode,
            "stdout": res.stdout,
            "stderr": res.stderr,
            "passed": res.returncode == 0
        }
    except subprocess.TimeoutExpired:
        return {
            "command": req.command,
            "exit_code": -1,
            "stdout": "",
            "stderr": "Command timed out after 60 seconds.",
            "passed": False
        }
    except Exception as exc:
        return {
            "command": req.command,
            "exit_code": -1,
            "stdout": "",
            "stderr": str(exc),
            "passed": False
        }


@app.get("/api/repo/export_zip")
def export_workspace_as_zip(path: str = Query(...)):
    """Archives the entire workspace and downloads it as a ZIP file."""
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Workspace not found.")

    workspace_name = os.path.basename(path)
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for root, dirs, files in os.walk(path):
            dirs[:] = [d for d in dirs if d not in (".git", "__pycache__", "venv", ".venv", "node_modules", ".pytest_cache")]
            for file in files:
                full_file = os.path.join(root, file)
                rel_file = os.path.relpath(full_file, path)
                zip_file.write(full_file, arcname=rel_file)

    zip_buffer.seek(0)
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{workspace_name}_repaired.zip"'}
    )


@app.get("/api/repo/export_patch")
def export_git_patch(path: str = Query(...)):
    """Exports a unified git diff / patch of changes in the repository."""
    if not os.path.exists(path):
        return {"error": "Path does not exist."}

    if os.path.exists(os.path.join(path, ".git")):
        try:
            res = subprocess.run(["git", "diff", "HEAD"], cwd=path, capture_output=True, text=True)
            diff_text = res.stdout
            if not diff_text.strip():
                res_untracked = subprocess.run(["git", "status", "--short"], cwd=path, capture_output=True, text=True)
                diff_text = f"# Git Status:\n{res_untracked.stdout}"
            return {"patch": diff_text}
        except Exception as exc:
            return {"error": str(exc)}
    
    return {"patch": "# Repository is not git-initialized. Export as ZIP to download full source."}


@app.get("/api/repo/ast/symbols")
def get_ast_symbols(path: str = Query(...)):
    if not os.path.exists(path):
        return {"error": "Repository path does not exist."}
    engine = ASTEngine(path)
    telemetry = engine.index_repository()
    return {
        "telemetry": telemetry,
        "symbols": [s.to_dict() for s in engine.symbols.values()]
    }


@app.get("/api/repo/ast/blast_radius")
def get_blast_radius(path: str = Query(...), symbol: str = Query(...)):
    if not os.path.exists(path):
        return {"error": "Repository path does not exist."}
    engine = ASTEngine(path)
    res = engine.analyze_blast_radius(symbol)
    return res


@app.post("/api/repo/reset")
def reset_repository(path: str = Query(...)):
    """Restores sample repo or resets git workspace."""
    if not os.path.exists(path):
        return {"error": "Repository path does not exist."}

    if os.path.exists(os.path.join(path, ".git")):
        try:
            subprocess.run(["git", "checkout", "."], cwd=path, capture_output=True)
            subprocess.run(["git", "clean", "-fd"], cwd=path, capture_output=True)
            return {"success": True, "message": "Git workspace reset to HEAD."}
        except Exception:
            pass

    repo_name = os.path.basename(path)

    if "math_utils" in repo_name:
        calc_path = os.path.join(path, "calculator.py")
        buggy_code = '''"""
Mathematical utilities library.
"""

def add(a: float, b: float) -> float:
    return a + b

def subtract(a: float, b: float) -> float:
    return a - b

def multiply(a: float, b: float) -> float:
    return a * b

def divide(a: float, b: float) -> float:
    return a / b

def fibonacci(n: int) -> int:
    """Returns the n-th Fibonacci number. 0-indexed: fib(0)=0, fib(1)=1, fib(2)=1, fib(3)=2, ..."""
    if n < 0:
        raise ValueError("n must be non-negative")
    # BUG: Incorrect base condition causes fib(1) to return 0 instead of 1
    if n == 0:
        return 0
    if n == 1:
        return 0  # <--- BUG: should be 1
    
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b
'''
        with open(calc_path, "w", encoding="utf-8") as f:
            f.write(buggy_code)
        return {"success": True, "message": "math_utils reset to pristine state."}

    elif "ecommerce" in repo_name:
        pricing_path = os.path.join(path, "pricing_service.py")
        order_ctrl_path = os.path.join(path, "order_controller.py")
        
        buggy_pricing = '''"""
Pricing calculation service for Ecommerce Orders.
"""

from typing import Dict
from models import Order, Customer


class PricingService:
    COUPONS: Dict[str, float] = {
        "SAVE10": 0.10,
        "SAVE20": 0.20,
        "SUPER50": 0.50
    }

    def calculate_subtotal(self, order: Order) -> float:
        """Calculates raw sum of all order line items."""
        return sum(item.total_price for item in order.items)

    def calculate_bulk_discount(self, order: Order) -> float:
        """
        Applies bulk order quantity discount:
        - 5 or more total items -> 5% discount
        - 10 or more total items -> 10% discount
        """
        total_quantity = sum(item.quantity for item in order.items)
        subtotal = self.calculate_subtotal(order)

        # BUG: The condition checks > 10 instead of >= 10, and applies 0 discount for 10 items
        if total_quantity > 10:
            return subtotal * 0.10
        elif total_quantity >= 5:
            return subtotal * 0.05
        return 0.0

    def calculate_customer_discount(self, customer: Customer, subtotal: float) -> float:
        """Applies VIP loyalty tier discount."""
        if customer.is_vip:
            return subtotal * max(0.05, customer.discount_tier)
        return 0.0

    def calculate_coupon_discount(self, coupon_code: str, subtotal: float) -> float:
        """Applies validated promotional coupon discount."""
        if coupon_code and coupon_code in self.COUPONS:
            return subtotal * self.COUPONS[coupon_code]
        return 0.0
'''
        buggy_ctrl = '''"""
Order Controller managing checkout, discount aggregation, and invoice generation.
"""

from typing import Dict, Any
from models import Order
from pricing_service import PricingService


class OrderController:
    def __init__(self, pricing_service: PricingService = None):
        self.pricing_service = pricing_service or PricingService()

    def checkout(self, order: Order) -> Dict[str, Any]:
        """Calculates item totals, discounts, taxes, and final payable amount."""
        subtotal = self.pricing_service.calculate_subtotal(order)
        bulk_discount = self.pricing_service.calculate_bulk_discount(order)
        cust_discount = self.pricing_service.calculate_customer_discount(order.customer, subtotal)
        
        coupon_discount = 0.0
        if order.coupon_code:
            coupon_discount = self.pricing_service.calculate_coupon_discount(order.coupon_code, subtotal)

        total_discounts = bulk_discount + cust_discount + coupon_discount
        discounted_subtotal = max(0.0, subtotal - total_discounts)

        # BUG: Sales tax was calculated on raw subtotal instead of discounted_subtotal
        tax = subtotal * order.tax_rate  # <--- BUG: should be discounted_subtotal * order.tax_rate
        final_total = round(discounted_subtotal + tax, 2)

        return {
            "order_id": order.order_id,
            "subtotal": round(subtotal, 2),
            "bulk_discount": round(bulk_discount, 2),
            "customer_discount": round(cust_discount, 2),
            "coupon_discount": round(coupon_discount, 2),
            "total_discounts": round(total_discounts, 2),
            "discounted_subtotal": round(discounted_subtotal, 2),
            "tax": round(tax, 2),
            "final_total": final_total
        }
'''
        with open(pricing_path, "w", encoding="utf-8") as f:
            f.write(buggy_pricing)
        with open(order_ctrl_path, "w", encoding="utf-8") as f:
            f.write(buggy_ctrl)
        return {"success": True, "message": "ecommerce_order_api reset to initial state."}

    elif "js_string_utils" in repo_name:
        js_path = os.path.join(path, "index.js")
        buggy_js = '''/**
 * JavaScript String Utilities
 */

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function slugify(text) {
  if (!text) return '';
  // BUG: Replaces spaces with underscores instead of hyphens and fails to lowercase
  return text
    .trim()
    .replace(/\\s+/g, '_'); // <--- BUG: Should be .toLowerCase().replace(/\\s+/g, '-')
}

function truncate(str, maxLength) {
  if (!str || str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

module.exports = {
  capitalize,
  slugify,
  truncate
};
'''
        with open(js_path, "w", encoding="utf-8") as f:
            f.write(buggy_js)
        return {"success": True, "message": "js_string_utils reset to initial state."}

    return {"success": True, "message": "Workspace reset complete."}


@app.post("/api/repo/benchmark/run")
def run_all_benchmarks():
    runner = BenchmarkRunner(SAMPLE_REPOS_DIR)
    return runner.evaluate_all_benchmarks()


@app.post("/api/repo/mutation/run")
def run_mutation_test(path: str = Query(...), file: str = Query(...)):
    runner = BenchmarkRunner(SAMPLE_REPOS_DIR)
    return runner.run_mutation_test(path, file)


@app.websocket("/ws/agent")
async def agent_websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        data_text = await websocket.receive_text()
        params = json.loads(data_text)
        
        repo_path = params.get("repo_path")
        task_prompt = params.get("task_prompt") or "Diagnose defects, execute test suite, and apply surgical fixes."
        api_key = params.get("api_key") or os.getenv("GEMINI_API_KEY")
        model_name = params.get("model_name", "gemini-2.5-flash")
        is_supervised = params.get("is_supervised", False)

        if not repo_path or not os.path.exists(repo_path):
            await websocket.send_json({"type": "error", "message": f"Invalid repository path: {repo_path}"})
            await websocket.close()
            return

        agent = SWEAgent(
            repo_path=repo_path,
            model_name=model_name,
            api_key=api_key,
            is_supervised=is_supervised
        )
        demo_mode = params.get("demo_mode", False) or not bool(api_key)
        
        async for event in agent.run(task_prompt=task_prompt, force_demo=demo_mode):
            await websocket.send_json(event)
            await asyncio.sleep(0.03)
            
    except WebSocketDisconnect:
        print("WebSocket client disconnected.")
    except Exception as exc:
        try:
            await websocket.send_json({"type": "error", "message": str(exc)})
        except Exception:
            pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8090, reload=True)
