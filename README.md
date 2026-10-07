# CodeNexus AI: Autonomous Software Engineering & Verification Agent

**HACKNEX 2026 | Internal Qualifier Round**  
**Problem Statement HNX26PSI09**: AI Software Engineering Agent  
**Domain**: Generative AI · Autonomous Systems · Software Engineering  
**Developed by**: Team HacknexHFT  
**Submission Portal**: [Google Form Submission Link](https://forms.gle/KGjkU5u66Va1MDhu5)

---

## 🔄 1. The Core Innovation: Closed-Loop Verification

Unlike standard AI coding assistants that blindly generate code without validating execution, **CodeNexus AI** operates on an autonomous **Closed-Loop Verification & Repair Cycle**:

```
 ┌──────────────┐     ┌───────────────┐     ┌──────────────┐     ┌───────────────┐
 │ 1. EXPLORE   │ ──► │ 2. UNDERSTAND │ ──► │ 3. PATCH     │ ──► │ 4. TEST       │
 │ AST & Symbols│     │ Context & Bug │     │ Surgical Edit│     │ Run Suite     │
 └──────────────┘     └───────────────┘     └──────────────┘     └───────┬───────┘
        ▲                                                                │
        │                       (If Tests Fail)                          ▼
 ┌──────┴───────┐     ┌───────────────┐     ┌──────────────┐     ┌───────────────┐
 │ 8. RETEST    │ ◄── │ 7. REPAIR     │ ◄── │ 6. DIAGNOSE  │ ◄── │ 5. OBSERVE    │
 │ Ensure Pass  │     │ Refined Diff  │     │ Traceback Log│     │ Stack Trace   │
 └──────────────┘     └───────────────┘     └──────────────┘     └───────────────┘
```

---

## 💡 2. Problem & Architectural Pillars

### The Problem:
In multi-thousand-line repositories, code modifications frequently fail because AI models:
1. Attempt full-file rewrites, causing hallucinations and regressions on untouched features.
2. Cannot run the repository's test suite to verify whether the patch works.
3. Lack the capability to self-correct from compiler or test execution failures.

### Our Solution:
* **AST Symbol Navigation**: Ingests repository structure and maps symbol hierarchies (`list_files`, `view_file`, `search_code`) to ground edits in actual project dependencies without context overflow.
* **Surgical Line-Level Patch Engine**: Replaces only the exact targeted lines (`edit_file_replace`) to preserve unaffected code.
* **Controlled Subprocess Execution Environment**: Automatically executes test suites (`unittest`, `pytest`, `node:test`) and captures standard outputs, error streams, and exit codes.
* **Self-Healing Verification Loop**: If test assertions fail, the execution traceback is fed back into the reasoning loop, allowing the agent to diagnose and repair the issue iteratively until benchmark tests pass with zero regressions.
* **Real-time Developer Dashboard**: A full-stack web interface streaming reasoning summaries, tool invocations, code diffs, and test badges over WebSockets.

---

## 📋 3. Google Form Submission Information

| Submission Field | Information |
| :--- | :--- |
| **Problem Statement** | `HNX26PSI09: AI Software Engineering Agent` |
| **Project Title** | `CodeNexus AI: Autonomous Software Engineering & Verification Agent` |
| **Public Git Repository** | `https://github.com/joshuasolomonp7-cloud/HacknexHFT` |
| **Core Idea & Innovation** | Closed-loop autonomous SWE agent with AST symbol navigation, surgical line patching, and test-driven self-correction. |
| **Technologies & Models** | Google Gemini 2.5 Flash / 1.5 Pro, Python 3.11, FastAPI, WebSockets, React 18, Vite, TypeScript, Tailwind CSS. |

---

## 🏗️ 4. End-to-End System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 CODENEXUS AI ARCHITECTURE                               │
├─────────────────────────────────────────┬───────────────────────────────────────────────┤
│          FRONTEND WORKBENCH             │             BACKEND AGENT ENGINE              │
│        (React 18 + Tailwind CSS)        │            (FastAPI + Python 3.11)            │
├─────────────────────────────────────────┼───────────────────────────────────────────────┤
│ • Repository File Tree Explorer         │ • Re-Act Autonomous Reasoning Controller      │
│ • Live Action & Tool Stream             │ • AST & Symbol Grep Navigation Tools          │
│ • Code Preview & Diff Inspection        │ • Surgical Search-Replace File Patcher        │
│ • Test Suite Regression Dashboard       │ • Controlled Subprocess Test Runner           │
└─────────────────────────────────────────┴───────────────────────────────────────────────┘
                    ▲                                             │
                    │                    WebSocket Stream         │
                    └─────────────────────────────────────────────┤
                                                                  ▼
                                                    ┌───────────────────────────┐
                                                    │    LLM REASONING ENGINE   │
                                                    │   Google Gemini Platform  │
                                                    └───────────────────────────┘
```

---

## 🛠️ 5. Technology Stack & Verified Versions

- **LLM Engine**: Google Gemini 2.5 Flash / Gemini 1.5 Flash / Gemini 1.5 Pro via the official `google-genai` SDK
- **Backend API**: Python 3.11+ (tested on Python 3.11 and 3.13), FastAPI 0.110+, Uvicorn, WebSockets, python-dotenv
- **Testing Sandbox**: Subprocess execution supporting Python (`unittest`, `pytest`) and JavaScript (`node:test`, `Jest`)
- **Frontend Dashboard**: React 18, Vite 5, TypeScript 5, Tailwind CSS 3.4, Lucide Icons (tested on Node.js 18.x and 20.x)
- **CORS & Networking**: Backend CORS is pre-configured for full cross-origin compatibility. Frontend requires no separate `.env` file.

---

## ⚙️ 6. Installation & Setup Guide

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

Create a `.env` file in the `backend/` folder:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Step 3: Frontend Setup
```bash
cd ../frontend
npm install
```

---

## 🚀 7. Running the System

### Option A: 1-Click Launch (Windows)
Double-click **`start_all.bat`** in the project root to start both backend and frontend servers simultaneously.

### Option B: Manual Terminal Commands
1. **Start Backend Server**:
   ```bash
   cd backend
   python main.py
   # Runs on http://localhost:8000
   ```
2. **Start Frontend Dashboard**:
   ```bash
   cd frontend
   npm run dev
   # Runs on http://localhost:5173 (or 5174)
   ```

---

## 🧪 8. How to Reproduce Demonstrated Results

### Scenario 1: Python Mathematical Sequence Bug Fix
1. Open the dashboard at `http://localhost:5173` (or `http://localhost:5174`).
2. Select benchmark preset: **`Python MathUtils (Fibonacci Bug)`**.
3. Click **"Run Tests"** on the right panel to observe the initial test failure:
   ```
   FAIL: test_fibonacci_base_cases (AssertionError: 0 != 1)
   ```
4. Click **"Run SWE Agent"**:
   - CodeNexus inspects `calculator.py` and `tests/test_calculator.py`.
   - Localizes the base condition error (`if n == 1: return 0`).
   - Applies the surgical fix (`if n == 1: return 1`).
   - Re-runs the test suite and verifies **`ALL TESTS PASSED`** with zero regressions.

### Scenario 2: JavaScript String Formatting Bug Fix
1. Select benchmark preset: **`JavaScript StringUtils (Slugify Bug)`**.
2. Click **"Run Tests"** $\rightarrow$ Observe assertion failure: `AssertionError: 'Hello_World' !== 'hello-world'`.
3. Click **"Run SWE Agent"** $\rightarrow$ CodeNexus updates `slugify` to lowercase and use hyphens, validating that all Node test suites pass.

---

## 📊 9. Scope Note: Minimum Viable Product vs. Stretch Features

| Feature | Status | Description |
| :--- | :---: | :--- |
| **Autonomous Re-Act Loop** | ✅ Implemented | Multi-turn reasoning, tool execution, and observation cycle |
| **Multi-Language Test Execution** | ✅ Implemented | Controlled subprocess execution supporting Python and JavaScript test suites |
| **Self-Healing Verification** | ✅ Implemented | Traceback reflection and iterative repair upon test failures |
| **Interactive Developer UI** | ✅ Implemented | Real-time WebSocket streaming, file tree explorer, and test regression status |
| **Multi-Model Failover** | ✅ Implemented | Resilient exponential backoff with multi-model fallback |
| **Human-in-the-Loop Mode** | 🌟 Stretch Goal | Supervised approval flow for sensitive production modifications |
| **Containerized Sandboxing** | 🌟 Stretch Goal | Ephemeral Docker container isolation for untrusted repositories |

---

## 👥 10. Team Work Distribution (4 Members)

| Member | Focus Area | Key Contributions |
| :--- | :--- | :--- |
| **Team Member 1** | Backend Lead & Agent Core | Re-Act reasoning loop, Gemini SDK integration, multi-model failover |
| **Team Member 2** | Backend Infra & Testing | Workspace tools, AST search, Subprocess test execution environment |
| **Team Member 3** | Frontend Lead & State | WebSocket event streaming, App UI architecture, timeline visualizer |
| **Team Member 4** | Frontend Visuals & Benchmarks | Code viewer, file tree explorer, benchmark test suites |
