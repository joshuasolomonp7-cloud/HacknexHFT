import os
import json
import asyncio
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from core.agent import SWEAgent
from tools import workspace_tools

load_dotenv()

app = FastAPI(title="AutoSWE Agent API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SAMPLE_REPOS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "sample_repos"))

class RunRequest(BaseModel):
    repo_path: str
    task_prompt: str
    model_name: Optional[str] = "gemini-3.8-flash"
    api_key: Optional[str] = None

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "AutoSWE Agent Backend"}

@app.get("/api/repos")
def list_sample_repos():
    repos = []
    if os.path.exists(SAMPLE_REPOS_DIR):
        for item in os.listdir(SAMPLE_REPOS_DIR):
            item_path = os.path.join(SAMPLE_REPOS_DIR, item)
            if os.path.isdir(item_path):
                repos.append({
                    "name": item,
                    "path": item_path,
                    "files": workspace_tools.list_files(item_path)
                })
    return {"repos": repos}

@app.get("/api/repo/files")
def get_repo_files(path: str = Query(...)):
    if not os.path.exists(path):
        return {"error": "Repository path does not exist."}
    files = workspace_tools.list_files(path)
    return {"files": files}

@app.get("/api/repo/file_content")
def get_file_content(path: str = Query(...), file: str = Query(...)):
    res = workspace_tools.view_file(path, file)
    return res

@app.post("/api/repo/run_test")
def execute_test(path: str = Query(...), cmd: Optional[str] = None):
    res = workspace_tools.run_tests(path, cmd)
    return res

@app.get("/api/repo/ast_symbols")
def get_ast_symbols(path: str = Query(...)):
    from tools import ast_engine
    return ast_engine.build_repo_symbol_index(path)

@app.get("/api/repo/blast_radius")
def get_blast_radius(path: str = Query(...), symbol: str = Query(...)):
    from tools import ast_engine
    return ast_engine.analyze_blast_radius(path, symbol)

@app.post("/api/repo/reset")
def reset_benchmark_repo(path: str = Query(...)):
    """Restores baseline bug in target benchmark repo so it can be re-tested live."""
    repo_name = os.path.basename(path)
    if "stress" in repo_name:
        baseline_dir = os.path.join(os.path.dirname(__file__), "sample_repos", ".baseline_bug_stress_1000")
        if os.path.exists(baseline_dir):
            import shutil
            for item in os.listdir(baseline_dir):
                shutil.copy2(os.path.join(baseline_dir, item), os.path.join(path, item))
    elif "ecommerce" in repo_name:
        ctrl_path = os.path.join(path, "order_controller.py")
        if os.path.exists(ctrl_path):
            with open(ctrl_path, "r", encoding="utf-8") as f:
                content = f.read()
            # Restore bug (passing customer_id instead of customer_tier)
            buggy = content.replace("order.customer_tier", "order.customer_id")
            with open(ctrl_path, "w", encoding="utf-8") as f:
                f.write(buggy)
    elif "js" in repo_name:
        idx_path = os.path.join(path, "index.js")
        if os.path.exists(idx_path):
            with open(idx_path, "r", encoding="utf-8") as f:
                content = f.read()
            buggy = content.replace("text.trim().toLowerCase().replace(/\\s+/g, '-')", "text.trim().replace(/\\s+/g, '_')")
            with open(idx_path, "w", encoding="utf-8") as f:
                f.write(buggy)
    else:
        calc_path = os.path.join(path, "calculator.py")
        if os.path.exists(calc_path):
            with open(calc_path, "r", encoding="utf-8") as f:
                content = f.read()
            buggy = content.replace("if n == 1:\n        return 1", "if n == 1:\n        return 0  # <--- BUG: should be 1")
            with open(calc_path, "w", encoding="utf-8") as f:
                f.write(buggy)

    return {"status": "success", "message": f"Reset {repo_name} to baseline failing state"}

@app.websocket("/ws/agent")
async def agent_websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        data_text = await websocket.receive_text()
        params = json.loads(data_text)
        
        repo_path = params.get("repo_path")
        task_prompt = params.get("task_prompt")
        api_key = params.get("api_key") or os.getenv("GEMINI_API_KEY")
        model_name = params.get("model_name", "gemini-2.5-flash")

        if not repo_path or not os.path.exists(repo_path):
            await websocket.send_json({"type": "error", "message": f"Invalid repository path: {repo_path}"})
            await websocket.close()
            return

        agent = SWEAgent(repo_path=repo_path, model_name=model_name, api_key=api_key)
        demo_mode = params.get("demo_mode", False) or not bool(api_key)
        
        async for event in agent.run(task_prompt=task_prompt, force_demo=demo_mode):
            await websocket.send_json(event)
            await asyncio.sleep(0.05)
            
    except WebSocketDisconnect:
        print("WebSocket client disconnected.")
    except Exception as exc:
        try:
            await websocket.send_json({"type": "error", "message": str(exc)})
        except Exception:
            pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
