import json
import os
import shutil
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional

from helpers import validate_path, format_size, get_safe_destination_path, DATA_DIR

HISTORY_FILE = DATA_DIR / "history.json"


def load_history() -> List[Dict[str, Any]]:
    """Loads all operation batches from JSON history file."""
    if not HISTORY_FILE.exists():
        return []
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("batches", [])
    except Exception:
        return []


def save_history(batches: List[Dict[str, Any]]) -> None:
    """Saves operation batches to JSON history file safely."""
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump({"batches": batches}, f, indent=2)


def record_operation(
    batch_id: str,
    target_dir: str,
    records: List[Dict[str, Any]],
    summary: Dict[str, Any],
) -> None:
    """Records a new organization batch into history."""
    batches = load_history()
    batch_entry = {
        "batch_id": batch_id,
        "timestamp": datetime.now().isoformat(),
        "target_dir": target_dir,
        "total_files": len(records),
        "status": "completed",  # 'completed' or 'undone'
        "summary": summary,
        "records": records,
    }
    # Prepend newest batch first
    batches.insert(0, batch_entry)
    save_history(batches)


def get_recent_history(limit: int = 15) -> List[Dict[str, Any]]:
    """Returns the most recent operation batches."""
    batches = load_history()
    return batches[:limit]


def undo_batch(batch_id: Optional[str], allowed_root: str | Path) -> Dict[str, Any]:
    """
    Reverses an organization batch safely.
    If batch_id is None, undos the latest reversible batch.
    Never overwrites existing files.
    """
    valid_root = Path(allowed_root).resolve()
    batches = load_history()

    target_batch: Optional[Dict[str, Any]] = None
    batch_index = -1

    for idx, batch in enumerate(batches):
        if batch_id:
            if batch["batch_id"] == batch_id:
                target_batch = batch
                batch_index = idx
                break
        else:
            if batch.get("status") == "completed":
                target_batch = batch
                batch_index = idx
                break

    if not target_batch:
        return {
            "success": False,
            "message": "No reversible organization history found.",
            "restored_count": 0,
            "errors": [],
        }

    if target_batch.get("status") == "undone":
        return {
            "success": False,
            "message": f"Batch {target_batch['batch_id']} has already been undone.",
            "restored_count": 0,
            "errors": [],
        }

    records = target_batch.get("records", [])
    restored: List[Dict[str, Any]] = []
    skipped_or_failed: List[Dict[str, Any]] = []
    folders_to_check: set[Path] = set()

    for item in records:
        try:
            curr_path = validate_path(item["new_path"], valid_root, must_exist=False)
            orig_path = validate_path(item["original_path"], valid_root, must_exist=False)

            if not curr_path.exists():
                skipped_or_failed.append({
                    "file_name": item["file_name"],
                    "reason": f"File no longer exists at '{curr_path}'. It may have been moved or removed manually.",
                })
                continue

            # Ensure parent of original_path exists
            orig_path.parent.mkdir(parents=True, exist_ok=True)

            # Never overwrite! If original_path is occupied by a different file, use safe naming
            if orig_path.exists():
                safe_orig = get_safe_destination_path(orig_path.parent, orig_path.name)
            else:
                safe_orig = orig_path

            shutil.move(str(curr_path), str(safe_orig))
            folders_to_check.add(curr_path.parent)

            restored.append({
                "file_name": item["file_name"],
                "from_path": str(curr_path),
                "to_path": str(safe_orig),
                "size_formatted": item.get("size_formatted", ""),
            })
        except Exception as e:
            skipped_or_failed.append({
                "file_name": item.get("file_name", "unknown"),
                "reason": str(e),
            })

    # Clean up empty category subdirectories if they become empty
    cleaned_folders: List[str] = []
    for folder in folders_to_check:
        try:
            if folder.exists() and folder.is_dir() and not any(folder.iterdir()):
                folder.rmdir()
                cleaned_folders.append(folder.name)
        except Exception:
            pass

    # Update batch status in history
    batches[batch_index]["status"] = "undone"
    batches[batch_index]["undone_at"] = datetime.now().isoformat()
    batches[batch_index]["restored_count"] = len(restored)
    save_history(batches)

    return {
        "success": True,
        "batch_id": target_batch["batch_id"],
        "message": f"Successfully restored {len(restored)} files to their original locations.",
        "restored_count": len(restored),
        "restored_files": restored,
        "skipped_or_failed": skipped_or_failed,
        "cleaned_folders": cleaned_folders,
    }
