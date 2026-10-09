# CodeNexus AI: Adaptive Closed-Loop Autonomous Software Repair & Verification Platform

**HACKNEX 2026 | Internal Qualifier Round**  
**Problem Statement HNX26PSI09**: AI Software Engineering Agent  
**Domain**: Generative AI · Autonomous Systems · Software Engineering & Reliability  
**Developed by**: Team HacknexHFT  
**Submission Portal**: [Google Form Submission Link](https://forms.gle/KGjkU5u66Va1MDhu5)

---

## 🔄 1. The Core Innovation: Adaptive Closed-Loop Verification

Unlike standard AI coding assistants that blindly read entire repositories or perform full-file rewrites without verification, **CodeNexus AI** operates on an **Adaptive Closed-Loop Autonomous Software Repair Architecture**:

```
 ┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌───────────────────┐
 │ 1. DISCOVER     │ ──► │ 2. REPRODUCE     │ ──► │ 3. LOCALIZE &    │ ──► │ 4. ADAPTIVE SCOPE │
 │ Stack / Trace   │     │ Capture Baseline │     │ Assign Bug ID    │     │ Level 1-4 Minimal │
 └─────────────────┘     └──────────────────┘     └──────────────────┘     └─────────┬─────────┘
                                                                                     │
 ┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐               ▼
 │ 8. FINAL REPORT │ ◄── │ 7. REGRESSION    │ ◄── │ 6. TARGETED TEST │ ◄── ┌───────────────────┐
 │ Audit & Proof   │     │ Full Repo Suite  │     │ Run Bound Tests  │     │ 5. SNAPSHOT &     │
 └─────────────────┘     └──────────────────┘     └─────────┬────────┘     │    SURGICAL PATCH │
                                                            │              └───────────────────┘
                                                  (If Regressions Occur)
                                                            ▼
                                                   [ AUTO-ROLLBACK ]
                                                            │
                                                   [ RE-DIAGNOSE ]
```

---

## 💡 2. Ten Advanced Architectural Outcomes Implemented

1. **Adaptive Closed-Loop Code Inspection**: Begins with the smallest relevant code slice (Level 1), expanding to direct callers (Level 2), transitive dependencies (Level 3), and broader modules (Level 4) strictly when failure evidence demands it.
2. **Evidence-Driven Before/After Verification**: Captures explicit baseline failure proof (command, stdout/stderr, exit code, timestamp) and re-verifies post-repair with side-by-side evidence comparison.
3. **Visible Patches & Exact Bug Locations**: Integrated line-by-line diff viewer showing exact line additions (`+`), deletions (`-`), file paths, modified symbols, and mathematical minimality scores.
4. **Multi-Bug Orchestration & Dependency-Aware Scheduling**: Manages multi-defect queues (`CNX-B001`, `CNX-B002`) and schedules repairs topologically respecting prerequisite dependencies.
5. **Unique Bug Identity & DNA Fingerprints**: Every defect receives a persistent identifier, unique visual DNA fingerprint, and lifecycle state tracking (`DETECTED` -> `ANALYZING` -> `ROOT_CAUSE_IDENTIFIED` -> `REPAIR_PLANNED` -> `PATCHING` -> `TESTING` -> `VERIFIED` / `BLOCKED`).
6. **Real AST Symbol Engine & Blast Radius**: Uses Python's native `ast` parser to map symbols, references, callers, and calculates mathematical blast radius risk (`LOW`, `MEDIUM`, `HIGH`).
7. **Transactional Patching, Git Snapshots & Auto-Rollback**: Takes atomic snapshots before applying edits and automatically rolls back to pristine state if regressions occur.
8. **Layered Verification Pipeline**: Enforces a strict verification ladder: Syntax Validation -> Module/Imports Check -> Targeted Unit Tests -> Full Regression Suite.
9. **Hidden Benchmarks & Synthetic Mutation Testing**: Includes real multi-file architecture benchmarks (`ecommerce_order_api`) and mutation testing engine validating test suite sensitivity.
10. **Security Boundaries & Supervised Approval**: Workspace boundary enforcement, path traversal protection, secret sanitization, and supervised mode approval workflow.

---

## 🏗️ 3. Multi-File Benchmark Architecture (`ecommerce_order_api`)

CodeNexus includes a complex 3-file enterprise ecommerce architecture:
* `models.py`: Customer VIP discount tiers, order line items, order structures.
* `pricing_service.py`: Order subtotal calculation, bulk discount threshold logic.
* `order_controller.py`: Order checkout pipeline, sales tax calculation on discounted subtotals.
* `tests/test_orders.py`: Comprehensive test suite testing bulk thresholds, coupon codes, and VIP discounts.

---

## 📋 4. Google Form Submission Information

| Submission Field | Information |
| :--- | :--- |
| **Problem Statement** | `HNX26PSI09: AI Software Engineering Agent` |
| **Project Title** | `CodeNexus AI: Adaptive Closed-Loop Autonomous Software Repair & Verification Platform` |
| **Public Git Repository** | `https://github.com/joshuasolomonp7-cloud/HacknexHFT` |
| **Core Idea & Innovation** | Adaptive AST-driven code slicing, unique bug DNA identity, transactional git snapshots, and evidence-driven layered verification. |
| **Technologies & Models** | Google Gemini 2.5 Flash / 1.5 Pro, Python AST, FastAPI, WebSockets, React 18, Vite, TypeScript, Tailwind CSS. |

---

## 🛠️ 5. Technology Stack & Verified Versions

- **LLM Engine**: Google Gemini 2.5 Flash / Gemini 1.5 Flash / Gemini 2.5 Pro via official `google-genai` SDK
- **Backend API**: Python 3.11+, FastAPI, Uvicorn, WebSockets, python-dotenv
- **Analysis & Testing**: Built-in Python `ast` engine, `unittest`, `pytest`, `node:test`
- **Frontend Workbench**: React 18, Vite 5, TypeScript 5, Tailwind CSS 3.4, Lucide Icons

---

## ⚙️ 6. Installation & Quick Start

### 1-Click Launch (Windows)
Double-click **`start_all.bat`** in the project root to start both backend and frontend servers simultaneously.

### Manual Terminal Commands
1. **Start Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   python main.py
   # Runs on http://localhost:8000
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   # Runs on http://localhost:5173
   ```
