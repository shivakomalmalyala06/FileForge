import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any

from categorizer import get_category
from helpers import format_size, validate_path


def scan_directory(target_dir: str | Path, allowed_root: str | Path) -> Dict[str, Any]:
    """
    Recursively scans target_dir within allowed_root.
    Gathers detailed metadata for all files while safely handling permission errors.
    """
    valid_root = Path(allowed_root).resolve()
    valid_target = validate_path(target_dir, valid_root, must_exist=True)

    if not valid_target.is_dir():
        raise NotADirectoryError(f"Target path is not a directory: '{valid_target}'")

    files_list: List[Dict[str, Any]] = []
    folder_count = 0
    total_size = 0
    errors: List[str] = []

    # Walk directory safely
    for root, dirs, files in os.walk(valid_target, followlinks=False):
        current_root_path = Path(root)

        # Count subdirectories
        folder_count += len(dirs)

        for filename in files:
            file_path = current_root_path / filename

            # Guard against broken or external symlinks
            if file_path.is_symlink():
                try:
                    resolved_sym = file_path.resolve()
                    resolved_sym.relative_to(valid_root)
                except (ValueError, RuntimeError):
                    errors.append(f"Skipped symlink pointing outside allowed root: {filename}")
                    continue

            try:
                stat_result = file_path.stat()
                file_size = stat_result.st_size
                mod_time = datetime.fromtimestamp(stat_result.st_mtime).isoformat()
                ext = file_path.suffix.lower()
                category = get_category(ext)
                total_size += file_size

                try:
                    rel_path = str(file_path.relative_to(valid_target))
                except ValueError:
                    rel_path = file_path.name

                files_list.append({
                    "name": filename,
                    "extension": ext,
                    "path": str(file_path),
                    "relative_path": rel_path,
                    "parent_folder": str(file_path.parent.name),
                    "size": file_size,
                    "size_formatted": format_size(file_size),
                    "modified": mod_time,
                    "category": category,
                })
            except (PermissionError, FileNotFoundError, OSError) as e:
                errors.append(f"Could not read {filename}: {str(e)}")

    # Sort files by modified date descending
    files_list.sort(key=lambda x: x["modified"], reverse=True)

    return {
        "target_directory": str(valid_target),
        "allowed_root": str(valid_root),
        "total_files": len(files_list),
        "total_folders": folder_count,
        "total_size": total_size,
        "total_size_formatted": format_size(total_size),
        "files": files_list,
        "errors": errors,
    }
