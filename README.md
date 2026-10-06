# CodeNexus AI: Autonomous Software Engineering & Verification Agent

**HACKNEX 2026 | Internal Qualifier Round**  
**Problem Statement HNX26PSI09**: AI Software Engineering Agent  
**Domain**: Generative AI · Autonomous Systems · Software Engineering  
**Developed by**: Team HacknexHFT  
**Submission Portal**: [Google Form Submission Link](https://forms.gle/KGjkU5u66Va1MDhu5)

---

##  1. Project Overview

### The Real-World Problem:
In real-world software engineering, codebases span thousands of lines across multiple files, directories, and test suites. Standard AI code assistants often fail when asked to fix bugs because they:
1. Try to rewrite entire files, introducing hallucinations and breaking existing functionality (regressions).
2. Cannot run the test suite to verify whether their changes actually solved the problem.
3. Lack the ability to learn from compiler errors or test failures.

### Our Solution & Key Innovations:
We built **CodeNexus AI** around three core engineering pillars:

* **1. Multi-File Symbol Discovery & AST Navigation**: Instead of dumping entire repositories into the model, CodeNexus indexes directory structures and searches symbols, functions, and imports to understand caller-callee relationships.
* **2. Surgical Line-Level Patch Engine**: CodeNexus applies minimal, localized search-and-replace patches (e.g. changing 2 lines rather than rewriting a 500-line file), guaranteeing precision and preserving untouched logic.
* **3. Self-Healing Test-Driven Verification Loop**: CodeNexus automatically executes the test suite in an isolated subprocess sandbox. If tests fail, it intercepts the exact stack trace and error assertions, reasons about *why* it failed, and autonomously refines the code until **100% of unit tests pass with zero regressions**.
* **4. Transparent Re-Act Developer Dashboard**: A full-stack web workbench that streams the agent's step-by-step thoughts, tool invocations, code diffs, and test results in real-time over WebSockets.

---

##  2. System Architecture & Data Pipeline

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CODENEXUS AI ARCHITECTURE                       │
├───────────────────────────────┬────────────────────────────────────────┤
│     FRONTEND WORKBENCH        │        BACKEND AGENT CORE              │
│   (React 18 + Tailwind CSS)   │       (FastAPI + Python Core)          │
├───────────────────────────────┼────────────────────────────────────────┤
│ • Repository File Tree        │ • Symbol & AST Workspace Tools         │
│ • Real-time Re-Act Stream     │ • Multi-turn Reasoning Engine          │
│ • Live Code & Diff Viewer     │ • Multi-Model Failover Orchestration   │
│ • Test Suite Regression Matrix│ • Subprocess Execution Sandbox         │
└───────────────────────────────┴────────────────────────────────────────┘
                                    │
                                    ▼
                      ┌───────────────────────────┐
                      │    LLM REASONING ENGINE   │
                      │   Google Gemini Platform  │
                      └───────────────────────────┘
```

### End-to-End Data Pipeline:
1. **Input Ingestion**: The developer selects a repository and inputs an issue description or feature specification.
2. **Repository Exploration**: CodeNexus scans directory trees and identifies relevant files and test fixtures using `list_files`, `view_file`, and `search_code`.
3. **Hypothesis & Patch Planning**: The agent determines the root cause of the bug and creates a surgical line replacement.
4. **Execution & Verification**: The sandbox runs the test suite (`python -m unittest` or `node --test`).
5. **Self-Correction (If needed)**: If any assertions fail, the traceback is fed back into the reasoning loop for iterative refinement.
6. **Live Telemetry**: Thoughts, tool calls, diffs, and final test passes are streamed over WebSockets to the web dashboard.

---

##  3. Technologies & Stack

- **Large Language Model**: Google Gemini 3.8 Flash / 2.5 Flash via official SDK
- **Backend Framework**: Python 3.11, FastAPI, Uvicorn, WebSockets, Pydantic
- **Execution & Test Sandbox**: Python Subprocess (`unittest`, `pytest`) & Node.js (`node:test`, `Jest`)
- **Frontend Dashboard**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons

---

##  4. Installation & Setup Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- Windows / Linux / macOS

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

Create a `.env` file in the `backend/` directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Step 3: Frontend Setup
```bash
cd ../frontend
npm install
```

---

##  5. How to Run the System

### Option A: 1-Click Launch (Windows)
Double-click **`start_all.bat`** in the root directory. It will automatically launch both the backend API server and frontend UI in dedicated terminals.

### Option B: Manual Terminal Launch
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

## 6. How to Reproduce Demonstrated Results

### Scenario 1: Python Sequence & Arithmetic Repair
1. Open the dashboard at `http://localhost:5173` (or `http://localhost:5174`).
2. Click the preset: **`Python MathUtils (Fibonacci Bug)`**.
3. Click **"Run Tests"** on the right panel to observe the initial test failure:
   ```
   FAIL: test_fibonacci_base_cases (AssertionError: 0 != 1)
   ```
4. Click **"Run SWE Agent"**:
   - CodeNexus inspects `calculator.py` and `tests/test_calculator.py`.
   - Identifies the base condition bug at line 23 (`if n == 1: return 0`).
   - Applies the surgical fix (`if n == 1: return 1`).
   - Re-runs tests and verifies **`ALL TESTS PASSED`** with zero regressions.

### Scenario 2: JavaScript / Node.js String Formatting Bug Fix
1. Click the preset: **`JavaScript StringUtils (Slugify Bug)`**.
2. Click **"Run Tests"** $\rightarrow$ see failing assertion: `AssertionError: 'Hello_World' !== 'hello-world'`.
3. Click **"Run SWE Agent"** $\rightarrow$ CodeNexus modifies `slugify` to lowercase and use hyphens, and validates 100% test success.

---

##  7. Scope Note: Minimum Viable Product vs. Stretch Features

| Capability | Status | Description |
| :--- | :---: | :--- |
| **Autonomous Re-Act Loop** | ✅ Implemented | Multi-turn reasoning, tool execution, and reflection |
| **Multi-Language Testing** | ✅ Implemented | Subprocess execution supporting Python and JavaScript test suites |
| **Self-Healing Verification** | ✅ Implemented | Traceback reflection and iterative self-correction upon test failures |
| **Interactive Developer UI** | ✅ Implemented | Real-time WebSocket streaming, file tree explorer, and test matrix |
| **Multi-Model Failover** | ✅ Implemented | Resilient exponential backoff with automatic fallback across models |
| **Human-in-the-Loop Mode** | 🌟 Stretch Goal | Supervised approval flow for sensitive production modifications |
| **Containerized Sandboxing** | 🌟 Stretch Goal | Ephemeral Docker container isolation for untrusted repositories |

---

##  8. Team Work Distribution

| Member | Focus Area | Key Contributions |
| :--- | :--- | :--- |
| **Team Member 1** | Backend Lead & Agent Core | Re-Act reasoning loop, Gemini SDK integration, multi-model failover |
| **Team Member 2** | Backend Infra & Testing | Workspace tools, AST search, Subprocess test execution sandbox |
| **Team Member 3** | Frontend Lead & State | WebSocket event streaming, App UI architecture, timeline visualizer |
| **Team Member 4** | Frontend Visuals & Benchmarks | Code viewer, file tree explorer, benchmark test suites |
