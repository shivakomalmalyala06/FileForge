import os
from pathlib import Path
from typing import Dict, List, Any

from categorizer import get_category
from helpers import format_size, validate_path
from storage import iter_files, uses_blob_storage


def scan_directory(target_dir: str | Path, allowed_root: str | Path) -> Dict[str, Any]:
    """
    Recursively scans target_dir within allowed_root.
    Gathers detailed metadata for all files while safely handling permission errors.
    """
    valid_root = Path(allowed_root).resolve()
    valid_target = validate_path(target_dir, valid_root, must_exist=True)

    if not uses_blob_storage() and not valid_target.is_dir():
        raise NotADirectoryError(f"Target path is not a directory: '{valid_target}'")

    files_list: List[Dict[str, Any]] = []
    folder_count = 0
    total_size = 0
    errors: List[str] = []

    folders: set[str] = set()
    for stored_file in iter_files(valid_target):
        file_path = stored_file.path
        filename = file_path.name

        if not uses_blob_storage() and file_path.is_symlink():
            try:
                file_path.resolve().relative_to(valid_root)
            except (ValueError, RuntimeError):
                errors.append(f"Skipped symlink pointing outside allowed root: {filename}")
                continue

        try:
            file_size = stored_file.size
            mod_time = stored_file.modified.isoformat()
            ext = file_path.suffix.lower()
            category = get_category(ext)
            total_size += file_size
            folders.update(
                str(Path(stored_file.relative_path).parents[i])
                for i in range(len(Path(stored_file.relative_path).parts) - 1)
            )
            files_list.append({
                "name": filename,
                "extension": ext,
                "path": str(file_path),
                "relative_path": stored_file.relative_path,
                "parent_folder": str(file_path.parent.name),
                "size": file_size,
                "size_formatted": format_size(file_size),
                "modified": mod_time,
                "category": category,
            })
        except (PermissionError, FileNotFoundError, OSError) as e:
            errors.append(f"Could not read {filename}: {str(e)}")

    if uses_blob_storage():
        folder_count = len(folders)
    else:
        folder_count = sum(len(dirs) for _, dirs, _ in os.walk(valid_target, followlinks=False))

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
