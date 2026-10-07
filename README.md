# 🤖 CodeNexus AI — Autonomous Software Engineering & Verification Agent

<p align="center">
  <img src="https://img.shields.io/badge/HACKNEX_2026-Internal_Qualifier-blueviolet?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Problem_Statement-HNX26PSI09-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Domain-Generative_AI_%7C_Autonomous_Systems-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Tests-28%2F28_PASS_(100%25)-brightgreen?style=for-the-badge" />
</p>

<p align="center">
  <b>An AI agent that reads, understands, surgically patches, and verifies real codebases — autonomously.</b><br/>
  <sub>Built by <strong>Team HacknexHFT</strong> • Google Gemini Platform • Python AST Engine • React 18 Dashboard</sub>
</p>

---

## 📌 Table of Contents

| # | Section |
|---|---------|
| 1 | [Core Innovation](#-1-core-innovation-closed-loop-verification) |
| 2 | [Key Features](#-2-key-features) |
| 3 | [System Architecture](#-3-system-architecture) |
| 4 | [AST Code Intelligence Engine](#-4-ast-code-intelligence-engine) |
| 5 | [Blast Radius Impact Analysis](#-5-blast-radius-impact-analysis) |
| 6 | [Technology Stack](#-6-technology-stack) |
| 7 | [Installation & Setup](#-7-installation--setup) |
| 8 | [Running the System](#-8-running-the-system) |
| 9 | [Benchmark Results](#-9-benchmark-results) |
| 10 | [Feature Status Matrix](#-10-feature-status-matrix) |
| 11 | [Submission Info](#-11-submission-information) |
| 12 | [Team Contributions](#-12-team-contributions) |

---

## 🔄 1. Core Innovation: Closed-Loop Verification

Unlike standard AI coding assistants that blindly generate code, **CodeNexus AI** operates on an autonomous **Closed-Loop Verification & Self-Repair Cycle** — it never declares success until the test suite passes with zero regressions.

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

##  2. Key Features

###  AST Code Intelligence (Not Text Search)
- Uses Python's native `ast.NodeVisitor` to parse source code into **Abstract Syntax Trees**
- Indexes every class, function, method, argument, docstring, and import across the entire repository
- Provides `find_symbol`, `find_callers`, and `analyze_blast_radius` tools to the agent
- **Zero hallucination** — the agent navigates real code structure, not guessed line numbers

###  Blast Radius Impact Analysis
- Before modifying any function, computes the **change impact** across the entire codebase
- Identifies all direct callers, affected production files, and test suites
- Assigns a risk score: **LOW (Safe)** / **MEDIUM (Moderate)** / **HIGH (Critical)**
- Enables the agent to know what could break *before* touching code

###  Surgical Line-Level Patching
- Replaces **only** the exact targeted lines using `edit_file_replace`
- Preserves all surrounding code, comments, and formatting untouched
- No full-file rewrites — minimizes diff size and regression risk

###  Git Transactional Snapshot & Rollback
- Takes a git snapshot **before** every patch attempt
- If tests fail after patching → **automatic rollback** to the clean state
- Every run generates patch quality metrics: precision grade, minimality score, lines changed

###  Multi-Language Test Execution
- Auto-detects and runs test suites: Python (`unittest`, `pytest`), JavaScript (`node:test`, `Jest`)
- Captures stdout, stderr, and exit codes in a controlled subprocess sandbox
- Enforces 45-second execution timeout to prevent infinite loops

###  Dual Interface: Web Dashboard + Terminal CLI
- **Interactive Dashboard** (`http://localhost:8000`): Real-time WebSocket streaming of agent thoughts, tool invocations, and test results
- **Headless CLI** (`python codenexus-cli.py`): Run against any project folder from the terminal

###  Fail-Safe Dual Engine Mode
- **Live Mode**: Real-time Gemini API reasoning with multi-model auto-failover (`gemini-2.5-flash` → `gemini-3.1-pro-preview` → `gemini-1.5-flash` → `gemini-1.5-pro`)
- **Autonomous Mode**: Offline AST-driven benchmark engine — works with zero API keys, never crashes during live demos

###  1000-Line Bug Stress Benchmark
- Official HACKNEX stress benchmark: **20 files**, **1,000+ lines**, **28 unit tests**
- Agent repairs **25 defects across 8 interconnected modules** autonomously
- Achieves **28/28 tests passing (100% success rate)** with zero regressions

---

##  3. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 CODENEXUS AI ARCHITECTURE                               │
├─────────────────────────────────────┬───────────────────────────────────────────────────┤
│       FRONTEND WORKBENCH            │             BACKEND AGENT ENGINE                  │
│     (React 18 + TypeScript)         │           (FastAPI + Python 3.11+)                │
├─────────────────────────────────────┼───────────────────────────────────────────────────┤
│ • Repository File Tree Explorer     │ • Re-Act Autonomous Reasoning Controller          │
│ • Live Agent Thought Timeline       │ • AST Symbol Graph & Caller Indexing              │
│ • AST Symbol & Blast Radius Panel   │ • Blast Radius Risk Calculator                    │
│ • Syntax-Highlighted Code Viewer    │ • Surgical Search-Replace File Patcher            │
│ • Test Suite Regression Dashboard   │ • Controlled Subprocess Test Runner               │
│ • 1-Click Reset & Preset Controls   │ • Git Transactional Snapshot & Rollback           │
│ • API Key Management & Model Select │ • Multi-Model Failover & Autonomous Fallback      │
└─────────────────────────────────────┴───────────────────────────────────────────────────┘
                    ▲                                             │
                    │              WebSocket Stream               │
                    └─────────────────────────────────────────────┤
                                                                  ▼
                                                    ┌───────────────────────────┐
                                                    │    LLM REASONING ENGINE   │
                                                    │   Google Gemini Platform  │
                                                    │   (Multi-Model Failover)  │
                                                    └───────────────────────────┘
```

**Unified Single-Port Deployment**: The compiled React frontend is served directly by FastAPI on `http://localhost:8000` — no separate frontend server needed for production demos.

---

##  4. AST Code Intelligence Engine

The AST Engine (`backend/tools/ast_engine.py`) replaces naive text search with genuine structural code understanding:

| Function | Purpose |
|----------|---------|
| `build_repo_symbol_index()` | Walks all `.py` files, parses each into an AST via `ast.parse()`, and indexes every class, function, method, argument, import, and call site |
| `find_symbol(name)` | Locates exact definitions — returns file path, line start/end, arguments, docstring |
| `find_callers(name)` | Finds every invocation of a function across the entire codebase using `ast.Call` nodes |
| `analyze_blast_radius(name)` | Computes change impact: affected files, test files, caller count, and risk level |

**Example — Agent locating `valid_email` in the stress benchmark:**
```
find_symbol("valid_email")
  → utils.py : line 61-62 : function(email) : "Validates email format"

find_callers("valid_email")
  → users.py : line 7 (called inside register())

analyze_blast_radius("valid_email")
  → Affected files: 2 | Test files: 1 | Callers: 1
  → Risk: MEDIUM [MODERATE]
  → "Verify 2 affected files and 1 test suites."
```

---

##  5. Blast Radius Impact Analysis

Before editing any code, the agent calculates **what could break**:

```
CHANGE IMPACT ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Target Symbol    : valid_email (utils.py)
Direct Callers   : register() in users.py
Affected Files   : utils.py, users.py
Test Files       : test_stress.py
Caller Count     : 1
Risk Level       : MEDIUM [MODERATE]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

| Risk Level | Trigger Condition | Agent Behavior |
|------------|-------------------|----------------|
| **LOW [SAFE]** | ≤1 caller, 1 file | Patch and run targeted tests |
| **MEDIUM [MODERATE]** | 2+ callers or 2+ files | Patch, run targeted tests, then full regression |
| **HIGH [CRITICAL]** | 6+ callers or 3+ production files | Extra caution, full regression suite mandatory |

---

##  6. Technology Stack

| Layer | Technology |
|-------|-----------|
| **LLM Engine** | Google Gemini 2.5 Flash / 3.1 Pro Preview / 1.5 Flash / 1.5 Pro via `google-genai` SDK |
| **Code Intelligence** | Python `ast` module — `ast.NodeVisitor`, `ast.parse()`, `ast.Call` |
| **Backend API** | Python 3.11+, FastAPI, Uvicorn, WebSockets, python-dotenv |
| **Test Sandbox** | `subprocess.run()` with capture, timeout (45s), and exit code analysis |
| **Git Engine** | `subprocess` git commands — snapshot, diff, rollback |
| **Frontend** | React 18, Vite 5, TypeScript 5, Tailwind CSS, Lucide Icons |
| **Deployment** | Unified single-port (`localhost:8000`) — FastAPI mounts compiled React `dist/` |

---

##  7. Installation & Setup

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

Create a `.env` file in `backend/` (optional — the system works without it in demo mode):
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Step 3: Frontend Setup
```bash
cd ../frontend
npm install
npm run build
```

---

##  8. Running the System

### Option A: Single Command (Recommended)
```bash
cd backend
python main.py
```
Open **http://localhost:8000** — both the API and React dashboard are served on one port.

### Option B: Terminal CLI (No Browser Needed)
```bash
# Run against the 1000-line stress benchmark
python codenexus-cli.py -p backend/sample_repos/bug_stress_1000 --demo

# Run against any project folder
python codenexus-cli.py -p /path/to/your/project "Fix the failing tests"
```

### Option C: Development Mode (Hot Reload)
```bash
# Terminal 1 — Backend
cd backend && python main.py

# Terminal 2 — Frontend (with hot module replacement)
cd frontend && npm run dev
```

---

##  9. Benchmark Results

### Benchmark 1: Bug Stress 1000 (Official HACKNEX Stress Test)

| Metric | Value |
|--------|-------|
| **Repository Scale** | 20 files, 1,000+ lines of Python |
| **Test Suite** | 28 unit tests (`test_stress.py`) |
| **Defects Found & Fixed** | 25 bugs across 8 modules |
| **Modules Repaired** | `utils.py`, `users.py`, `inventory.py`, `orders.py`, `payments.py`, `coupons.py`, `notifications.py`, `analytics.py` |
| **Tests Before Agent** | 3/28 passing (12 failures, 13 errors) |
| **Tests After Agent** | **28/28 passing (100%)** ✅ |
| **Regression Failures** | **0** |

**Defect categories resolved:**
- 🔧 Regex validation bugs (double-escaped backslash in email regex)
- 🔧 Inverted arithmetic operators (`+=` vs `-=` in deposit/withdraw)
- 🔧 Wrong comparison operators (`>` vs `<=` in stock threshold)
- 🔧 Inverted filter logic (`!=` vs `==` in category filters, user orders, payment history)
- 🔧 Missing authorization guards (order ownership check in payments)
- 🔧 Formula errors (discount percentages, growth rate, conversion rate)
- 🔧 Queue counter bugs (checking `sent` list instead of `queue`)
- 🔧 Off-by-one errors (pagination slicing, moving average windows)

### Benchmark 2: Multi-File E-Commerce API

| Metric | Value |
|--------|-------|
| **Files Involved** | 4 (`models.py`, `pricing_service.py`, `order_controller.py`, `test_orders.py`) |
| **Root Cause** | Cross-file argument mismatch: `customer_id` passed instead of `customer_tier` |
| **Resolution** | AST caller analysis → surgical 1-line fix in `order_controller.py` |
| **Result** | All tests passing ✅ |

### Benchmark 3: Python MathUtils (Fibonacci)

| Metric | Value |
|--------|-------|
| **Root Cause** | Base condition `return 0` instead of `return 1` at `n == 1` |
| **Resolution** | AST symbol lookup → single line edit |
| **Result** | All tests passing ✅ |

### Benchmark 4: JavaScript StringUtils (Slugify)

| Metric | Value |
|--------|-------|
| **Root Cause** | Missing `.toLowerCase()` and using `_` instead of `-` |
| **Resolution** | Patch `index.js` → lowercase + hyphenate |
| **Result** | All tests passing ✅ |

---

##  10. Feature Status Matrix

| Feature | Status | Description |
|---------|:------:|-------------|
| Real AST Code Intelligence | ✅ | Class/function indexing via Python `ast.NodeVisitor` |
| Blast Radius Impact Engine | ✅ | Caller graph, affected files, risk scoring |
| Git Transactional Rollback | ✅ | Pre-patch snapshots, automatic rollback on failure |
| Surgical Line-Level Patching | ✅ | Targeted `edit_file_replace` — no full-file rewrites |
| Multi-File Cross-Module Repair | ✅ | Agent traces bugs across 4+ interconnected files |
| 1000-Line Stress Benchmark | ✅ | 25 defects across 8 modules — 28/28 tests pass |
| Multi-Language Test Runner | ✅ | Python (`unittest`/`pytest`) + JavaScript (`node:test`) |
| Interactive Web Dashboard | ✅ | Real-time WebSocket streaming, AST panel, test viewer |
| Headless Terminal CLI | ✅ | `codenexus-cli.py` — auto-attach to any directory |
| Fail-Safe Dual Engine | ✅ | Live Gemini API + Offline Autonomous AST simulation |
| Multi-Model Auto-Failover | ✅ | Cascading fallback across 4 Gemini model variants |
| Unified Single-Port Deploy | ✅ | React `dist/` mounted in FastAPI on `localhost:8000` |
| Patch Quality Metrics | ✅ | Precision grade, minimality score, lines changed |
| 1-Click Repo Reset | ✅ | Restore benchmarks to initial failing state |
| Containerized Sandboxing | 🌟 | Stretch goal — ephemeral Docker isolation |

---

##  11. Submission Information

| Field | Value |
|-------|-------|
| **Problem Statement** | `HNX26PSI09: AI Software Engineering Agent` |
| **Project Title** | `CodeNexus AI: Autonomous Software Engineering & Verification Agent` |
| **Public Repository** | [github.com/joshuasolomonp7-cloud/HacknexHFT](https://github.com/joshuasolomonp7-cloud/HacknexHFT) |
| **Core Innovation** | Closed-loop autonomous SWE agent with real AST code intelligence, blast radius analysis, surgical patching, transactional rollback, and test-driven self-correction |
| **Technologies** | Google Gemini (2.5 Flash / 3.1 Pro Preview), Python AST Engine, FastAPI, WebSockets, React 18, Vite, TypeScript, Tailwind CSS |
| **Submission Form** | [Google Form](https://forms.gle/KGjkU5u66Va1MDhu5) |

---

##  12. Team Contributions

| Member | Focus Area | Key Contributions |
|--------|-----------|-------------------|
| **Member 1** | Backend Lead & Agent Core | Re-Act reasoning loop, Gemini SDK integration, multi-model failover, autonomous fallback engine |
| **Member 2** | Backend Infra & AST Engine | Real AST symbol parser, blast radius calculator, transactional git sandbox, stress benchmark integration |
| **Member 3** | Frontend Lead & State | WebSocket event streaming, dashboard architecture, timeline visualizer, model selector |
| **Member 4** | Frontend Visuals & Benchmarks | AST symbol explorer, code viewer, multi-file benchmark suite, 1-click reset controls |

---

<p align="center">
  <b>CodeNexus AI</b> — <i>Not just an AI that writes code. An AI that verifies it works.</i>
</p>
