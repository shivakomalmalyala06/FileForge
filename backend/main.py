import os
from pathlib import Path
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Query, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from categorizer import get_category_definitions, get_all_categories
from duplicate_finder import find_duplicates
from helpers import (
    get_config,
    save_config,
    validate_path,
    DEFAULT_ALLOWED_ROOT,
    PROJECT_ROOT,
)
from organizer import preview_organization, execute_organization
from sample_generator import seed_sample_data
from scanner import scan_directory
from search import search_files
from stats import get_system_statistics
from storage import directory_exists, uses_blob_storage
from undo import get_recent_history, undo_batch
from uploader import save_uploaded_files

app = FastAPI(
    title="FileForge – Dynamic File Organizer API",
    description="Smarter Files. Simpler Work. Full-featured safe file organization API.",
    version="1.0.0",
)

# Enable CORS for local Vite development & production previews
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------- Pydantic Request Models ----------------
class ConfigUpdateRequest(BaseModel):
    allowed_root: Optional[str] = None
    current_scan_dir: Optional[str] = None


class OrganizeExecuteRequest(BaseModel):
    target_dir: Optional[str] = None
    file_paths: Optional[List[str]] = None
    confirmed: bool = False


class UndoRequest(BaseModel):
    batch_id: Optional[str] = None


# ---------------- API Endpoints ----------------

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "app": "FileForge – Dynamic File Organizer",
        "tagline": "Smarter Files. Simpler Work.",
        "version": "1.0.0",
    }


@app.get("/api/config")
def get_current_configuration():
    config = get_config()
    allowed_root = Path(config["allowed_root"]).resolve()
    current_scan = Path(config["current_scan_dir"]).resolve()

    return {
        "allowed_root": str(allowed_root),
        "current_scan_dir": str(current_scan),
        "default_sample_dir": str(DEFAULT_ALLOWED_ROOT),
        "project_root": str(PROJECT_ROOT),
    }


@app.post("/api/config")
def update_configuration(req: ConfigUpdateRequest):
    current_cfg = get_config()
    allowed_root = Path(req.allowed_root if req.allowed_root else current_cfg["allowed_root"]).resolve()

    root_exists = (
        directory_exists(allowed_root)
        if uses_blob_storage()
        else allowed_root.exists()
    )
    if not root_exists:
        raise HTTPException(status_code=400, detail=f"Allowed root path does not exist: {allowed_root}")

    scan_dir = Path(req.current_scan_dir if req.current_scan_dir else current_cfg["current_scan_dir"]).resolve()

    # Validate scan directory inside allowed root
    try:
        validated_scan = validate_path(scan_dir, allowed_root, must_exist=True)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    save_config(str(allowed_root), str(validated_scan))
    return {
        "success": True,
        "allowed_root": str(allowed_root),
        "current_scan_dir": str(validated_scan),
    }


@app.get("/api/categories")
def get_categories():
    return {
        "categories": get_category_definitions(),
        "category_names": get_all_categories(),
    }


@app.get("/api/scan")
def scan_files(directory: Optional[str] = None):
    cfg = get_config()
    allowed_root = Path(cfg["allowed_root"]).resolve()
    target_dir = Path(directory).resolve() if directory else Path(cfg["current_scan_dir"]).resolve()

    try:
        results = scan_directory(target_dir, allowed_root)
        return results
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/statistics")
def get_statistics(directory: Optional[str] = None):
    cfg = get_config()
    allowed_root = Path(cfg["allowed_root"]).resolve()
    target_dir = Path(directory).resolve() if directory else Path(cfg["current_scan_dir"]).resolve()

    try:
        return get_system_statistics(target_dir, allowed_root)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/organize/preview")
def organize_preview(directory: Optional[str] = None):
    cfg = get_config()
    allowed_root = Path(cfg["allowed_root"]).resolve()
    target_dir = Path(directory).resolve() if directory else Path(cfg["current_scan_dir"]).resolve()

    try:
        return preview_organization(target_dir, allowed_root)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/organize/execute")
def organize_execute(req: OrganizeExecuteRequest):
    if not req.confirmed:
        raise HTTPException(
            status_code=400,
            detail="Confirmation required before moving files. Pass 'confirmed: true'.",
        )

    cfg = get_config()
    allowed_root = Path(cfg["allowed_root"]).resolve()
    target_dir = Path(req.target_dir).resolve() if req.target_dir else Path(cfg["current_scan_dir"]).resolve()

    try:
        return execute_organization(target_dir, allowed_root, req.file_paths)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/duplicates")
def get_duplicates(directory: Optional[str] = None):
    cfg = get_config()
    allowed_root = Path(cfg["allowed_root"]).resolve()
    target_dir = Path(directory).resolve() if directory else Path(cfg["current_scan_dir"]).resolve()

    try:
        return find_duplicates(target_dir, allowed_root)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/search")
def search(
    q: str = "",
    category: Optional[str] = None,
    extension: Optional[str] = None,
    directory: Optional[str] = None,
):
    cfg = get_config()
    allowed_root = Path(cfg["allowed_root"]).resolve()
    target_dir = Path(directory).resolve() if directory else Path(cfg["current_scan_dir"]).resolve()

    try:
        return search_files(
            target_dir=target_dir,
            allowed_root=allowed_root,
            query=q,
            category=category,
            extension=extension,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/history")
def get_history(limit: int = 20):
    return {
        "batches": get_recent_history(limit=limit),
    }


@app.post("/api/history/undo")
def undo_operation(req: UndoRequest):
    cfg = get_config()
    allowed_root = Path(cfg["allowed_root"]).resolve()

    try:
        result = undo_batch(req.batch_id, allowed_root)
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/upload")
def upload_files(
    files: List[UploadFile] = File(...),
    auto_organize: bool = True,
    directory: Optional[str] = None,
):
    cfg = get_config()
    allowed_root = Path(cfg["allowed_root"]).resolve()
    target_dir = Path(directory).resolve() if directory else Path(cfg["current_scan_dir"]).resolve()

    try:
        result = save_uploaded_files(
            files=files,
            target_dir=target_dir,
            allowed_root=allowed_root,
            auto_organize=auto_organize,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/sample-data/seed")
def seed_sample():
    cfg = get_config()
    target = Path(cfg["current_scan_dir"]).resolve()
    try:
        result = seed_sample_data(target)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
