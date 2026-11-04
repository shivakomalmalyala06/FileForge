import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional

from categorizer import get_category
from helpers import format_size, validate_path


def search_files(
    target_dir: str | Path,
    allowed_root: str | Path,
    query: str = "",
    category: Optional[str] = None,
    extension: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Recursively searches files inside target_dir matching query and filters.
    Case-insensitive matching on filename.
    """
    valid_root = Path(allowed_root).resolve()
    valid_target = validate_path(target_dir, valid_root, must_exist=True)

    cleaned_query = str(query).strip().lower() if query else ""
    cleaned_cat = str(category).strip() if (category and isinstance(category, str)) else None
    cleaned_ext = str(extension).strip().lower() if (extension and isinstance(extension, str)) else None
    if cleaned_ext and not cleaned_ext.startswith("."):
        cleaned_ext = f".{cleaned_ext}"

    results: List[Dict[str, Any]] = []
    errors: List[str] = []

    for root, _, files in os.walk(valid_target, followlinks=False):
        current_root = Path(root)
        for filename in files:
            file_path = current_root / filename

            if file_path.is_symlink():
                try:
                    file_path.resolve().relative_to(valid_root)
                except (ValueError, RuntimeError):
                    continue

            # Query match
            if cleaned_query and cleaned_query not in filename.lower():
                continue

            file_ext = file_path.suffix.lower()

            # Extension match
            if cleaned_ext and file_ext != cleaned_ext:
                continue

            file_cat = get_category(file_ext)

            # Category match
            if cleaned_cat and cleaned_cat.lower() != "all" and file_cat.lower() != cleaned_cat.lower():
                continue

            try:
                st = file_path.stat()
                try:
                    rel_path = str(file_path.relative_to(valid_target))
                except ValueError:
                    rel_path = filename

                results.append({
                    "name": filename,
                    "extension": file_ext,
                    "path": str(file_path),
                    "relative_path": rel_path,
                    "parent_folder": file_path.parent.name,
                    "category": file_cat,
                    "size": st.st_size,
                    "size_formatted": format_size(st.st_size),
                    "modified": datetime.fromtimestamp(st.st_mtime).isoformat(),
                })
            except (PermissionError, FileNotFoundError, OSError) as e:
                errors.append(f"Could not read {filename}: {str(e)}")

    # Sort results alphabetically by filename
    results.sort(key=lambda x: x["name"].lower())

    return {
        "target_directory": str(valid_target),
        "query": query,
        "category_filter": category,
        "total_matches": len(results),
        "results": results,
        "errors": errors,
    }
