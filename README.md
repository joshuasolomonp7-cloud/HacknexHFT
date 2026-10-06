# CodeNexus AI: Autonomous Software Engineering & Verification Agent

**HACKNEX 2026 | Internal Qualifier Round**  
**Problem Statement HNX26PSI09**: AI Software Engineering Agent  
**Domain**: Generative AI · Autonomous Systems · Software Engineering  
**Developed by**: Team HacknexHFT

---

## 📌 1. Project Overview

CodeNexus AI is an autonomous, full-stack software engineering agent designed to solve real-world software maintenance challenges. In large repositories containing thousands of lines of code, manually localizing bugs, understanding cross-file dependencies, writing surgical patches, and verifying that no existing workflows are broken is slow and error-prone.

We engineered **CodeNexus AI** to autonomously:
1. **Analyze and Navigate Real Codebases**: Ingest multi-file project structures, parse syntax trees, and perform deep symbol searches across modules.
2. **Localize Faults & Requirements**: Reason over issue descriptions, isolate root-cause failure points, and plan minimal edits.
3. **Execute Surgical Code Modifications**: Apply targeted line-level patches without destructive whole-file rewrites.
4. **Self-Healing Verification Loop**: Execute automated unit and regression test suites in real-time. If tests fail, CodeNexus captures execution tracebacks, reflects on the failure reason, and autonomously iterates until 100% of tests pass with zero regressions.
5. **Interactive Developer Workbench**: Provide an intuitive web dashboard with real-time thought streaming, side-by-side code inspection, and instant test verification status.

---

## 🏗️ 2. System Architecture & Data Pipeline

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CODENEXUS AI ARCHITECTURE                       │
├───────────────────────────────┬────────────────────────────────────────┤
│     FRONTEND DASHBOARD        │        BACKEND AGENT ENGINE            │
│   (React 18 + Tailwind CSS)   │       (FastAPI + Python Core)          │
├───────────────────────────────┼────────────────────────────────────────┤
│ • Repository File Tree        │ • Symbol & AST Workspace Tools         │
│ • Real-time Re-Act Stream     │ • Re-Act Autonomous Reasoning Loop    │
│ • Live Code & Diff Viewer     │ • Multi-Model Failover Orchestration   │
│ • Test Suite Regression Matrix│ • Subprocess Execution Sandbox         │
└───────────────────────────────┴────────────────────────────────────────┘
                                    │
                                    ▼
                      ┌───────────────────────────┐
                      │    LLM REASONING ENGINE   │
                      │  Google Gemini Multi-turn │
                      └───────────────────────────┘
```

### Data Pipeline & Execution Lifecycle:
1. **Repository Ingestion**: User selects a target repository. The backend indexes directory structures, source code, and test manifests.
2. **Issue Specification**: The developer submits a bug report or feature request via the UI.
3. **Reasoning & Tool Execution**: CodeNexus analyzes the codebase using targeted tools (`list_files`, `view_file`, `search_code`).
4. **Patch Application**: CodeNexus generates precise line replacements targeting only the necessary logic.
5. **Regression Testing & Reflection**: The subprocess runner executes test suites (`pytest`, `unittest`, or Node.js `node:test`). If a regression occurs, the stack trace is fed back into the reasoning loop for immediate correction.
6. **Live Streaming**: Every thought, tool invocation, file edit, and test output is streamed in real-time to the frontend over WebSockets.

---

## 🛠️ 3. Technologies & Stack

- **Large Language Model**: Google Gemini 3.8 Flash / 2.5 Flash / 1.5 Pro via the official SDK
- **Backend API & Engine**: Python 3.11, FastAPI, Uvicorn, WebSockets, Pydantic
- **Testing & Sandbox**: Subprocess Test Runner supporting Python (`unittest`, `pytest`) and JavaScript (`node:test`, `Jest`)
- **Frontend Dashboard**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons

---

## ⚙️ 4. Installation & Setup Guide

### Prerequisites
- Python 3.10 or higher
- Node.js 18+ and npm
- Windows / Linux / macOS compatible

### Step 1: Clone Repository
```bash
git clone https://github.com/joshuasolomonp7-cloud/HacknexHFT.git
cd HacknexHFT
```

### Step 2: Backend Setup
```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory with your Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Step 3: Frontend Setup
```bash
cd ../frontend
npm install
```

---

## 🚀 5. How to Run the System

### Option A: 1-Click Launch (Windows)
Double-click **`start_all.bat`** in the root directory. It will automatically start both the backend API and frontend UI in dedicated terminal windows.

### Option B: Manual Launch
1. **Start Backend**:
   ```bash
   cd backend
   python main.py
   # Runs on http://localhost:8000
   ```
2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   # Runs on http://localhost:5173 (or 5174)
   ```

---

## 🧪 6. How to Reproduce Demonstrated Results

### Scenario 1: Python Mathematical Sequence Bug Fix
1. Open the dashboard at `http://localhost:5173` (or `http://localhost:5174`).
2. Click the top benchmark preset: **`Python MathUtils (Fibonacci Bug)`**.
3. Click **"Run Tests"** on the right panel to observe the initial failing test case:
   ```
   FAIL: test_fibonacci_base_cases (AssertionError: 0 != 1)
   ```
4. Click **"Run SWE Agent"**.
5. Watch the live execution stream:
   - CodeNexus inspects `calculator.py` and `tests/test_calculator.py`.
   - Localizes the base-case error at line 23.
   - Applies a surgical patch (`if n == 1: return 1`).
   - Re-runs the test suite and verifies **`ALL TESTS PASSED`** with zero regressions.

### Scenario 2: JavaScript String Formatting Bug Fix
1. Click the benchmark preset: **`JavaScript StringUtils (Slugify Bug)`**.
2. Click **"Run Tests"** $\rightarrow$ see the failure: `AssertionError: 'Hello_World' !== 'hello-world'`.
3. Click **"Run SWE Agent"** $\rightarrow$ CodeNexus updates `slugify` to lowercase and use hyphens, validating that all Node test suites pass.

---

## 📊 7. Scope Note: Minimum Viable Product vs. Stretch Features

| Capability | Status | Description |
| :--- | :---: | :--- |
| **Autonomous Re-Act Loop** | ✅ Implemented | Step-by-step reasoning, tool dispatch, and observation handling |
| **Multi-Language Testing** | ✅ Implemented | Subprocess execution supporting Python and JavaScript test suites |
| **Self-Healing Verification** | ✅ Implemented | Traceback reflection and iterative self-correction upon test failures |
| **Interactive Developer UI** | ✅ Implemented | Real-time WebSocket streaming, file tree explorer, and test matrix |
| **Multi-Model Failover** | ✅ Implemented | Resilient exponential backoff with multi-model fallback |
| **Human-in-the-Loop Mode** | 🌟 Stretch Goal | Supervised approval flow for sensitive production modifications |
| **Containerized Sandboxing** | 🌟 Stretch Goal | Ephemeral Docker container isolation for untrusted repositories |

---

## 👥 8. Team Work Distribution

| Member | Focus Area | Contributions |
| :--- | :--- | :--- |
| **Team Member 1** | Backend Lead & Agent Core | Re-Act reasoning loop, Gemini SDK integration, multi-model failover |
| **Team Member 2** | Backend Infra & Testing | Workspace tools, AST search, Subprocess test execution sandbox |
| **Team Member 3** | Frontend Lead & State | WebSocket event streaming, App UI architecture, timeline visualizer |
| **Team Member 4** | Frontend Visuals & Benchmarks | Code viewer, file tree explorer, benchmark test suites |
