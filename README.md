# FileForge – Dynamic File Organizer

> **Tagline:** Smarter Files. Simpler Work.  
> **Type:** Full-Stack Web Application (Python FastAPI + React + Vite)  
> **Environment:** Windows / Cross-Platform  

---

## 1. Project Overview

**FileForge** is an enterprise-grade file management and organization platform designed to solve directory sprawl, storage bloat, and disorganized workspace trees. Originally designed as a Python terminal utility, FileForge has been engineered into a modern, responsive web application backed by a high-performance **FastAPI** backend and an **interactive React + Vite** dashboard.

---

## 2. Architecture & Tech Stack

```
FileForge/
├── backend/                  # Python FastAPI Backend
│   ├── main.py               # REST API endpoints & CORS middleware
│   ├── scanner.py            # Recursive directory walker & stat engine
│   ├── categorizer.py        # Extension-to-category dynamic classifier
│   ├── organizer.py          # Collision-free move engine with dry-run
│   ├── duplicate_finder.py   # Cryptographic SHA-256 chunked hasher
│   ├── search.py             # Recursive filename & metadata search
│   ├── stats.py              # Real-time storage telemetry & metrics
│   ├── undo.py               # JSON audit log & rollback engine
│   ├── helpers.py            # Path traversal prevention & safe collision naming
│   ├── sample_generator.py   # Comprehensive multi-category demo dataset generator
│   ├── requirements.txt      # Backend Python dependencies
│   └── tests/                # 16 Pytest automated test suites
├── frontend/                 # React 19 + Vite Dashboard
│   ├── src/
│   │   ├── components/       # Reusable UI (Sidebar, Header, Badges, Modals)
│   │   ├── pages/            # 8 Navigation views (Overview, Explorer, Organize, etc.)
│   │   ├── services/api.js   # Typed API bridge client
│   │   ├── App.jsx           # Root layout & state manager
│   │   └── index.css         # Dark navy/slate design system
│   ├── package.json
│   └── vite.config.js        # API proxy configuration
├── sample_data/              # Realistic demo files (34 files across 7 categories)
└── README.md
```

---

## 3. Core Features

1. **Dashboard & Telemetry:**
   - Real-time calculations: Total Files, Total Subdirectories, Storage Size, Organization Percentage, Duplicate Count & Wasted Storage.
   - Interactive SVG Ring/Donut and Bar Charts showing category-wise disk distribution.
   - Live activity timeline.

2. **File Scanner:**
   - Recursively traverses directories without freezing or crashing on permission-locked items.
   - Collects filename, extension, formatted size, relative location, parent directory, and ISO modified date.

3. **7 Dynamic Categories:**
   - **Documents:** `.pdf`, `.docx`, `.xlsx`, `.pptx`, `.txt`, `.csv`, `.md`, `.epub`
   - **Images:** `.jpg`, `.jpeg`, `.png`, `.gif`, `.svg`, `.webp`, `.bmp`, `.tiff`, `.ico`
   - **Videos:** `.mp4`, `.mkv`, `.avi`, `.mov`, `.webm`, `.flv`
   - **Audio:** `.mp3`, `.wav`, `.aac`, `.flac`, `.ogg`, `.m4a`
   - **Archives:** `.zip`, `.tar.gz`, `.7z`, `.rar`, `.xz`, `.iso`
   - **Code:** `.py`, `.js`, `.jsx`, `.ts`, `.tsx`, `.html`, `.css`, `.json`, `.sql`, `.java`, `.cpp`
   - **Others:** Unclassified or non-extension binaries.

4. **Safe File Organizer:**
   - **Dry-Run Preview:** Simulates all source and destination movements before disk write.
   - **Collision Prevention:** Existing files are never overwritten; duplicate names are safely indexed (e.g. `report (1).pdf`).
   - **Confirmation Gate:** Explicit user confirmation required.

5. **Cryptographic Duplicate Detection:**
   - Uses two-phase optimization: groups by byte length first, then executes chunked **SHA-256** hashing.
   - Zero false-positives; groups identical files and displays wasted storage.
   - **Safety guarantee:** Duplicates are never automatically deleted.

6. **Local File Upload & Instant Auto-Organization:**
   - Drag-and-drop or browse files from your local system.
   - Real-time pre-upload category detection and destination indicator (`Documents/`, `Images/`, etc.).
   - Directly moves and saves uploaded files into their respective category folders.
   - Preserves collision guard (never overwrites existing local files).

7. **Recursive Search:**
   - Live search by filename, category filter, and extension filter.

8. **Audit Trail & One-Click Undo:**
   - Persistent `history.json` tracks every movement batch with a unique ID and timestamps.
   - One-click safe rollback restores all files to their exact original locations.
   - Automatically cleans empty category directories after reversal.

---

## 4. Safety Guarantees

- **Path Traversal Defense:** Every input path is validated using `validate_path()` to ensure it strictly resides within the configured `allowed_root`. Any attempt to escape via `..` or external symlinks throws an immediate access denial error.
- **Zero Deletion Guarantee:** FileForge performs copy/move operations exclusively; it never deletes user files.
- **Collision Protection:** Automatically detects existing files and appends index tags rather than overwriting.

---

## 5. Quick Startup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### A. Run Backend (FastAPI)
```powershell
# Open terminal 1:
cd C:\Users\shiva\.gemini\antigravity\scratch\FileForge\backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
- API Docs: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/api/health`

### B. Run Frontend (React + Vite)
```powershell
# Open terminal 2:
cd C:\Users\shiva\.gemini\antigravity\scratch\FileForge\frontend
cmd /c npm run dev
```
- Open browser at: `http://localhost:5173`

---

## 6. Automated Test Suite (Pytest)

Run backend tests:
```powershell
cd C:\Users\shiva\.gemini\antigravity\scratch\FileForge\backend
python -m pytest -v
```

### Verified Test Results:
```
tests/test_api_endpoints.py::test_api_health_endpoint PASSED             [  6%]
tests/test_api_endpoints.py::test_api_categories_endpoint PASSED         [ 12%]
tests/test_api_endpoints.py::test_api_config_and_seed_endpoint PASSED    [ 18%]
tests/test_api_endpoints.py::test_api_scan_and_statistics_endpoints PASSED [ 25%]
tests/test_api_endpoints.py::test_api_duplicates_and_search_endpoints PASSED [ 31%]
tests/test_api_endpoints.py::test_api_organize_preview_and_execute_flow PASSED [ 37%]
tests/test_categorizer.py::test_categorizer_extensions PASSED            [ 43%]
tests/test_categorizer.py::test_all_categories PASSED                    [ 50%]
tests/test_categorizer.py::test_category_colors PASSED                   [ 56%]
tests/test_organizer_and_undo.py::test_organization_preview_and_execution_and_undo PASSED [ 62%]
tests/test_safety.py::test_validate_path_allowed_boundaries PASSED       [ 68%]
tests/test_safety.py::test_validate_path_rejects_traversal PASSED        [ 75%]
tests/test_safety.py::test_collision_prevention_safe_destination PASSED  [ 81%]
tests/test_safety.py::test_format_size PASSED                            [ 87%]
tests/test_scanner_and_duplicates.py::test_scanner_and_search PASSED     [ 93%]
tests/test_scanner_and_duplicates.py::test_duplicate_finder_sha256 PASSED [100%]

============================= 16 passed in 0.78s ==============================
```

Frontend production build:
```powershell
cd C:\Users\shiva\.gemini\antigravity\scratch\FileForge\frontend
cmd /c npm run build
# Result: 2063 modules transformed, 0 errors, production bundle built in 1.10s.
```
