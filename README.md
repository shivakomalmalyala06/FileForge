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
│   ├── storage.py            # Local filesystem and persistent Vercel Blob storage
│   ├── helpers.py            # Path traversal prevention & safe collision naming
│   ├── sample_generator.py   # Comprehensive multi-category demo dataset generator
│   ├── requirements.txt      # Backend Python dependencies
│   └── tests/                # Pytest automated test suite
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

6. **File Upload & Instant Auto-Organization:**
   - Drag-and-drop or browse files from your local system.
   - Real-time pre-upload category detection and destination indicator (`Documents/`, `Images/`, etc.).
   - Saves uploaded files into their respective category folders.
   - Preserves collision guard (never overwrites existing files).
   - Uses private Vercel Blob storage in serverless deployments so uploads survive function restarts.

7. **Recursive Search:**
   - Live search by filename, category filter, and extension filter.

8. **Audit Trail & One-Click Undo:**
   - Tracks every movement batch with a unique ID and timestamps; history is stored persistently on Vercel.
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
All backend tests pass, including mocked Vercel Blob persistence workflows.

============================= 22 passed in 2.06s ==============================
```

Frontend production build:
```powershell
cd C:\Users\shiva\.gemini\antigravity\scratch\FileForge\frontend
cmd /c npm run build
# Result: 2063 modules transformed, 0 errors, production bundle built in 1.10s.
```

## 7. Persistent storage on Vercel

Vercel functions do not provide a persistent local filesystem. To retain uploads,
organization changes, configuration, and undo history between requests, connect a
Vercel Blob store to the project. The backend uses private Blob access and the
Vercel Blob Python SDK.

In the Vercel project, create or connect a Blob store and make its credentials
available to the backend deployment (`BLOB_READ_WRITE_TOKEN`, or the Vercel
Blob store's `BLOB_STORE_ID` and OIDC credentials). Redeploy after connecting
the store. Do not expose the Blob token in frontend variables.
