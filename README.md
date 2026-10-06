# 🤖 AutoSWE: Autonomous AI Software Engineering Agent
**HACKNEX 2026 | Internal Qualifier Round**  
**Problem Statement HNX26PSI09**: AI Software Engineering Agent  
**Domain**: Generative AI · Coding Agents · Software Engineering

---

## 📌 1. Project Overview & Working System
**AutoSWE** is an end-to-end autonomous Software Engineering Agent inspired by the architectural principles of `mini-swe-agent` (Princeton/Stanford) and `Aider`. It ingests real-world multi-file repositories, understands symbol relationships, localizes bugs or feature specifications, applies surgical, minimal diff patches, and validates changes against regression test suites.

### Key Capabilities:
- 🔍 **Repository Exploration**: Explores file hierarchies, parses source code, and performs symbol-level grep search.
- 🎯 **Fault Localization & Minimal Edits**: Uses line-range targeted search/replace instead of rewriting entire files.
- 🧪 **Subprocess Test Runner**: Runs automated test suites (`pytest` / `unittest`) and captures pass/fail status and error traces.
- 🔁 **Self-Healing Reflection Loop**: If unit tests fail after an edit, the agent analyzes the traceback and iteratively self-corrects until 100% of tests pass with zero regressions.
- 🖥️ **Live Interactive Web Dashboard**: Real-time WebSocket streaming of the agent's thoughts, tool calls, and test results alongside an interactive repository explorer and code viewer.

---

## 🛠️ 2. Technologies, Libraries & Models Used
- **Core Model / LLM**: Google Gemini 2.5 Flash / Gemini 2.5 Pro via the official `google-genai` SDK.
- **Backend**: Python 3.11+, FastAPI, Uvicorn, WebSockets, Pydantic, python-dotenv.
- **Verification Engine**: Python Subprocess Test Sandbox (`unittest`, `pytest`).
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons.

---

## ⚙️ 3. Installation & Dependency Setup

### Prerequisites:
- Python 3.10+
- Node.js 18+ and npm
- Gemini API Key ([Google AI Studio](https://aistudio.google.com/))

### A. Backend Setup:
```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the `backend/` folder:
```env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
```

### B. Frontend Setup:
```bash
cd ../frontend
npm install
```

---

## 🚀 4. Running the System End-to-End

### Step 1: Start Backend API
```bash
cd backend
python main.py
# Server runs at http://localhost:8000
```

### Step 2: Start Frontend Web UI
```bash
cd frontend
npm run dev
# Dashboard accessible at http://localhost:5173
```

---

## 🧪 5. How to Reproduce the Demonstrated Results

1. Open `http://localhost:5173` in your browser.
2. Under the top repository selector, select the built-in benchmark repository: `math_utils`.
3. Notice the default bug prompt in the issue box:
   > *"The fibonacci function in calculator.py has a bug where fibonacci(1) returns 0 instead of 1, causing unit tests to fail. Fix the bug, keep all other arithmetic working, and make sure all tests pass."*
4. Click **"Run Tests"** on the right panel to observe the initial test failure (`FAIL: test_fibonacci_base_cases`).
5. Click **"Run SWE Agent"**.
6. Observe the live stream:
   - **Thought**: The agent reasons about the bug and decides to explore `calculator.py` and `tests/test_calculator.py`.
   - **Tool Call**: `view_file` to read the exact implementation.
   - **Tool Call**: `edit_file_replace` to fix the base condition `if n == 1: return 1`.
   - **Tool Call**: `run_tests` to verify the patch.
   - **Verification**: All unit tests pass with zero regressions.

---

## 📋 6. Scope Note: MVP vs. Stretch Goals

| Status | Feature | Details |
| :---: | :--- | :--- |
| ✅ **MVP** | Re-Act Agent Engine | Tool-use loop with Gemini 2.5 Flash. |
| ✅ **MVP** | Repository File Tools | `list_files`, `view_file`, `search_code`, `edit_file_replace`. |
| ✅ **MVP** | Test Execution Sandbox | Real-time subprocess test runner for verification. |
| ✅ **MVP** | WebSocket Live Stream | Real-time thought and action updates to UI. |
| ✅ **MVP** | Interactive Web Dashboard | React + Tailwind developer workbench with file tree & test results. |
| 🌟 **Stretch** | Multi-file Refactoring | Expanding symbol graph across multi-package codebases. |
| 🌟 **Stretch** | Docker Container Isolation | Running untrusted code inside ephemeral Docker containers. |

---

## 👥 Team Work Allocation (4 Members)
* **Dev 1 (Backend Lead)**: Agent Core Re-Act loop, Gemini SDK integration, Tool declaration & parsing.
* **Dev 2 (Backend Infra)**: Workspace tools, AST indexing, Subprocess test runner, FastAPI endpoints.
* **Dev 3 (Frontend Lead)**: WebSocket state machine, App layout, Real-time timeline visualizer.
* **Dev 4 (Frontend Visualizer)**: Repository File Tree, Code viewer, Test report status badges.

---
*Submission for HACKNEX 2026 Internal Qualifier Round.*
