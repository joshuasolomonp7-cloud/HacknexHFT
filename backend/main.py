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
def execute_test(path: str = Query(...), cmd: str = Query("pytest")):
    res = workspace_tools.run_tests(path, cmd)
    return res

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
        
        async for event in agent.run(task_prompt=task_prompt):
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
