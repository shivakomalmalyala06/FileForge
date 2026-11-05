import hashlib
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Any

from categorizer import get_category
from helpers import format_size, validate_path
from storage import iter_file_chunks, iter_files, uses_blob_storage


def calculate_sha256(file_path: Path, chunk_size: int = 65536) -> str:
    """Calculates SHA-256 hash of a file reading in chunks."""
    hasher = hashlib.sha256()
    for chunk in iter_file_chunks(file_path, chunk_size):
        hasher.update(chunk)
    return hasher.hexdigest()


def find_duplicates(target_dir: str | Path, allowed_root: str | Path) -> Dict[str, Any]:
    """
    Finds duplicate files within target_dir using size-first optimization and SHA-256 hashing.
    Never deletes or alters any files.
    """
    valid_root = Path(allowed_root).resolve()
    valid_target = validate_path(target_dir, valid_root, must_exist=True)

    # Step 1: Collect files and group by size
    size_map: Dict[int, List[Path]] = defaultdict(list)
    errors: List[str] = []

    file_metadata = {}
    for stored_file in iter_files(valid_target):
        file_path = stored_file.path

        if not uses_blob_storage() and file_path.is_symlink():
            try:
                file_path.resolve().relative_to(valid_root)
            except (ValueError, RuntimeError):
                continue

        if stored_file.size > 0:
            size_map[stored_file.size].append(file_path)
            file_metadata[str(file_path)] = stored_file

    # Step 2: Only hash files that share the exact same size
    hash_map: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    candidates_count = 0

    for size, paths in size_map.items():
        if len(paths) > 1:
            candidates_count += len(paths)
            for path in paths:
                try:
                    file_hash = calculate_sha256(path)
                    stored_file = file_metadata[str(path)]
                    rel_path = stored_file.relative_path

                    hash_map[file_hash].append({
                        "name": path.name,
                        "path": str(path),
                        "relative_path": rel_path,
                        "size": stored_file.size,
                        "size_formatted": format_size(size),
                        "category": get_category(path.suffix),
                        "modified": stored_file.modified.isoformat(),
                    })
                except (PermissionError, FileNotFoundError, OSError) as e:
                    errors.append(f"Cannot hash {path.name}: {str(e)}")

    # Step 3: Filter groups with 2 or more files
    duplicate_groups: List[Dict[str, Any]] = []
    total_wasted_bytes = 0
    total_duplicate_files = 0

    for sha256_hash, file_list in hash_map.items():
        if len(file_list) > 1:
            file_size = file_list[0]["size"]
            wasted = (len(file_list) - 1) * file_size
            total_wasted_bytes += wasted
            total_duplicate_files += len(file_list)

            duplicate_groups.append({
                "hash": sha256_hash,
                "file_count": len(file_list),
                "file_size": file_size,
                "file_size_formatted": format_size(file_size),
                "wasted_size": wasted,
                "wasted_size_formatted": format_size(wasted),
                "category": file_list[0]["category"],
                "files": file_list,
            })

    # Sort groups by wasted size descending
    duplicate_groups.sort(key=lambda g: g["wasted_size"], reverse=True)

    return {
        "target_directory": str(valid_target),
        "total_groups": len(duplicate_groups),
        "total_duplicate_files": total_duplicate_files,
        "total_wasted_bytes": total_wasted_bytes,
        "total_wasted_formatted": format_size(total_wasted_bytes),
        "groups": duplicate_groups,
        "errors": errors,
    }


def datetime_from_path(path: Path) -> str:
    """Helper to safely fetch ISO modified time."""
    from datetime import datetime
    try:
        return datetime.fromtimestamp(path.stat().st_mtime).isoformat()
    except Exception:
        return ""
