import os
import shutil
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional

from categorizer import get_category
from helpers import format_size, validate_path, get_safe_destination_path
from undo import record_operation


def preview_organization(
    target_dir: str | Path,
    allowed_root: str | Path,
    file_paths: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Simulates organization into category subfolders without making any changes to disk.
    Identifies source, destination, collisions, and skips files already in proper folders.
    """
    valid_root = Path(allowed_root).resolve()
    valid_target = validate_path(target_dir, valid_root, must_exist=True)

    if not valid_target.is_dir():
        raise NotADirectoryError(f"Target path is not a directory: '{valid_target}'")

    planned_moves: List[Dict[str, Any]] = []
    already_organized: List[Dict[str, Any]] = []
    category_counts: Dict[str, int] = {}
    total_size = 0

    # Build target file list
    target_files: List[Path] = []
    if file_paths:
        for p in file_paths:
            try:
                fp = validate_path(p, valid_root, must_exist=True)
                if fp.is_file():
                    target_files.append(fp)
            except Exception:
                continue
    else:
        for root, _, files in os.walk(valid_target, followlinks=False):
            current_root = Path(root)
            for f in files:
                fp = current_root / f
                if not fp.is_symlink():
                    target_files.append(fp)

    # Track simulated destination files to handle simulated collisions
    simulated_dest_state: set[str] = set()

    for file_path in target_files:
        try:
            stat = file_path.stat()
            size = stat.st_size
            ext = file_path.suffix.lower()
            category = get_category(ext)
            dest_dir = valid_target / category

            # Check if file is already inside target category folder
            if file_path.parent == dest_dir:
                already_organized.append({
                    "name": file_path.name,
                    "path": str(file_path),
                    "category": category,
                    "size_formatted": format_size(size),
                })
                continue

            # Check collision simulation
            dest_file_path = dest_dir / file_path.name
            sim_key = str(dest_file_path).lower()

            collision = False
            final_name = file_path.name

            if dest_file_path.exists() or sim_key in simulated_dest_state:
                collision = True
                stem = file_path.stem
                suffix = file_path.suffix
                counter = 1
                while True:
                    candidate_name = f"{stem} ({counter}){suffix}"
                    candidate_path = dest_dir / candidate_name
                    cand_key = str(candidate_path).lower()
                    if not candidate_path.exists() and cand_key not in simulated_dest_state:
                        final_name = candidate_name
                        dest_file_path = candidate_path
                        simulated_dest_state.add(cand_key)
                        break
                    counter += 1
            else:
                simulated_dest_state.add(sim_key)

            planned_moves.append({
                "source_path": str(file_path),
                "source_name": file_path.name,
                "destination_dir": str(dest_dir),
                "destination_path": str(dest_file_path),
                "destination_name": final_name,
                "category": category,
                "size": size,
                "size_formatted": format_size(size),
                "has_collision": collision,
                "will_rename": collision,
            })

            category_counts[category] = category_counts.get(category, 0) + 1
            total_size += size

        except Exception:
            continue

    return {
        "target_directory": str(valid_target),
        "total_to_move": len(planned_moves),
        "total_already_organized": len(already_organized),
        "total_size": total_size,
        "total_size_formatted": format_size(total_size),
        "category_counts": category_counts,
        "planned_moves": planned_moves,
        "already_organized": already_organized,
    }


def execute_organization(
    target_dir: str | Path,
    allowed_root: str | Path,
    file_paths: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Executes file organization safely:
    - Never overwrites existing files.
    - Prevents collisions.
    - Moves files into category directories.
    - Records every operation in history for safe undo.
    """
    preview = preview_organization(target_dir, allowed_root, file_paths)
    planned_moves = preview["planned_moves"]

    if not planned_moves:
        return {
            "success": True,
            "batch_id": None,
            "message": "No files needed organization.",
            "moved_count": 0,
            "moved_files": [],
            "errors": [],
        }

    batch_id = f"batch_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"
    moved_records: List[Dict[str, Any]] = []
    errors: List[str] = []

    for item in planned_moves:
        src = Path(item["source_path"])
        dest_dir = Path(item["destination_dir"])

        try:
            # Create category directory if it doesn't exist
            dest_dir.mkdir(parents=True, exist_ok=True)

            # Recalculate safe destination at runtime to eliminate race condition
            safe_dest = get_safe_destination_path(dest_dir, item["source_name"])

            shutil.move(str(src), str(safe_dest))

            moved_records.append({
                "original_path": str(src),
                "new_path": str(safe_dest),
                "file_name": safe_dest.name,
                "category": item["category"],
                "size": item["size"],
                "size_formatted": item["size_formatted"],
            })
        except Exception as e:
            errors.append(f"Failed to move {src.name}: {str(e)}")

    # Record to undo history
    if moved_records:
        summary = {
            "moved_count": len(moved_records),
            "categories": list({r["category"] for r in moved_records}),
            "total_size": sum(r["size"] for r in moved_records),
        }
        record_operation(
            batch_id=batch_id,
            target_dir=str(target_dir),
            records=moved_records,
            summary=summary,
        )

    return {
        "success": True,
        "batch_id": batch_id,
        "message": f"Successfully organized {len(moved_records)} files into categorized folders.",
        "moved_count": len(moved_records),
        "moved_files": moved_records,
        "errors": errors,
    }
