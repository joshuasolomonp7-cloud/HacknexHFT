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
1. Attempt full-file rewrites, causing hallucinations and breaking untouched features.
2. Cannot run the repository's test suite to verify whether the patch works.
3. Lack genuine structural AST understanding and blast radius analysis.

### Our Solution & Upgrades:
* **Real AST Code Intelligence (`ast_engine.py`)**: Uses Python's native `ast` module to index classes, functions, caller graphs, and cross-file references (`find_symbol`, `find_callers`).
* **Blast Radius Impact Analysis**: Computes direct callers, affected files, and risk level (**LOW / MEDIUM / HIGH**) before touching code.
* **Surgical Line-Level Patch Engine**: Replaces only the exact targeted lines (`edit_file_replace`) to preserve unaffected code.
* **Git Transactional Snapshot & Rollback (`git_sandbox.py`)**: Takes pre-patch snapshots and automatically rolls back if regressions are detected.
* **Controlled Subprocess Execution Environment**: Automatically executes test suites (`unittest`, `pytest`, `node:test`) and captures standard outputs, error streams, and exit codes.
* **Dual Interface**: Full interactive Web Dashboard (`http://localhost:5173`) + Headless Terminal CLI (`python codenexus-cli.py`).

---

## 📋 3. Google Form Submission Information

| Submission Field | Information |
| :--- | :--- |
| **Problem Statement** | `HNX26PSI09: AI Software Engineering Agent` |
| **Project Title** | `CodeNexus AI: Autonomous Software Engineering & Verification Agent` |
| **Public Git Repository** | `https://github.com/joshuasolomonp7-cloud/HacknexHFT` |
| **Core Idea & Innovation** | Closed-loop autonomous SWE agent with AST symbol navigation, blast radius analysis, surgical line patching, transactional rollback, and test-driven self-correction. |
| **Technologies & Models** | Google Gemini 2.5 Flash / 1.5 Pro, Python AST Engine, FastAPI, WebSockets, React 18, Vite, TypeScript, Tailwind CSS. |

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
│ • Live Action & Tool Stream             │ • AST Symbol Graph & Caller Indexing          │
│ • AST Symbol & Blast Radius Inspector   │ • Blast Radius Risk Calculator                │
│ • Code Preview & Diff Inspection        │ • Surgical Search-Replace File Patcher        │
│ • Test Suite Regression Dashboard       │ • Controlled Subprocess Test Runner           │
│ • 1-Click Bug Reset Controls            │ • Git Transactional Snapshot & Rollback       │
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

- **LLM Engine**: Google Gemini 2.5 Flash / Gemini 1.5 Flash / Gemini 1.5 Pro via official `google-genai` SDK
- **Code Intelligence**: Python Native `ast` Parser & Dependency Graph Builder
- **Backend API**: Python 3.11+ (tested on Python 3.11 and 3.13), FastAPI 0.110+, Uvicorn, WebSockets, python-dotenv
- **Testing Sandbox**: Subprocess execution supporting Python (`unittest`, `pytest`) and JavaScript (`node:test`, `Jest`)
- **Frontend Dashboard**: React 18, Vite 5, TypeScript 5, Tailwind CSS 3.4, Lucide Icons

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

Create a `.env` file in `backend/`:
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

### Option B: Terminal CLI (Zero UI Needed)
Run directly against any folder on your computer:
```bash
python codenexus-cli.py --demo "Fix failing tests in this repository"
```

### Option C: Manual Web Launch
1. **Start Backend**: `cd backend && python main.py` (Runs on `http://localhost:8000`)
2. **Start Frontend**: `cd frontend && npm run dev` (Runs on `http://localhost:5173`)

---

## 🧪 8. How to Reproduce Demonstrated Results

### Scenario 1: Multi-File Cross-Module Bug (E-Commerce Order & Pricing API)
1. Open dashboard at `http://localhost:5173`.
2. Select benchmark preset: **`E-Commerce Multi-File (Order & Pricing API)`**.
3. Click **"Run Tests"** $\rightarrow$ Observe failure: `AssertionError: 0.0 != 40.0` (VIP customer discount fails).
4. Click **"AST Code Intelligence"** $\rightarrow$ Inspect symbol table and callers of `calculate_discount`.
5. Click **"Run SWE Agent"**:
   - CodeNexus identifies that `order_controller.py` calls `calculate_discount` with `customer_id` instead of `customer_tier`.
   - Modifies `order_controller.py` and verifies against `pricing_service.py`.
   - Tests turn **`ALL TESTS PASSED`** with zero regressions on existing standard customer orders!

### Scenario 2: Python Sequence Logic Bug (MathUtils)
1. Select preset: **`Python MathUtils (Fibonacci Bug)`**.
2. Click **"Run Tests"** $\rightarrow$ `FAIL: test_fibonacci_base_cases (0 != 1)`.
3. Click **"Run SWE Agent"** $\rightarrow$ Localizes line 23 in `calculator.py` and fixes base condition.

### Scenario 3: JavaScript String Formatting Bug
1. Select preset: **`JavaScript StringUtils (Slugify Bug)`**.
2. Click **"Run SWE Agent"** $\rightarrow$ Patches `index.js` to lowercase and hyphenate.

---

## 📊 9. Scope Note: Minimum Viable Product vs. Stretch Features

| Feature | Status | Description |
| :--- | :---: | :--- |
| **Real AST Code Intelligence** | ✅ Implemented | Class/function indexing and cross-file caller graph via Python `ast` |
| **Blast Radius Impact Engine** | ✅ Implemented | Direct callers, affected files, and risk calculation |
| **Git Transactional Rollback** | ✅ Implemented | Pre-patch snapshots and automatic rollback upon regression failures |
| **Multi-File Benchmark Suite** | ✅ Implemented | Cross-module coordination across models, services, and controllers |
| **Multi-Language Testing** | ✅ Implemented | Subprocess execution supporting Python and JavaScript test suites |
| **Interactive Developer UI** | ✅ Implemented | Real-time WebSocket streaming, AST visualizer, and test regression matrix |
| **Terminal CLI Tool** | ✅ Implemented | Headless command-line tool auto-attaching to any directory |
| **Fail-Safe Dual Mode** | ✅ Implemented | Live Gemini AI + Offline Autonomous Benchmark simulation |
| **Containerized Sandboxing** | 🌟 Stretch Goal | Ephemeral Docker container isolation for untrusted repositories |

---

## 👥 10. Team Work Distribution (4 Members)

| Member | Focus Area | Key Contributions |
| :--- | :--- | :--- |
| **Team Member 1** | Backend Lead & Agent Core | Re-Act reasoning loop, Gemini SDK integration, multi-model failover |
| **Team Member 2** | Backend Infra & AST Engine | Real AST symbol parser, blast radius calculator, transactional git sandbox |
| **Team Member 3** | Frontend Lead & State | WebSocket event streaming, App UI architecture, timeline visualizer |
| **Team Member 4** | Frontend Visuals & Benchmarks | AST symbol explorer, code viewer, multi-file e-commerce benchmark suite |
