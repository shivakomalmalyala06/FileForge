from collections import defaultdict
from pathlib import Path
from typing import Dict, Any, List

from categorizer import get_category, get_category_color, get_all_categories
from helpers import format_size, validate_path
from duplicate_finder import find_duplicates
from storage import iter_files, uses_blob_storage
from undo import get_recent_history


def get_system_statistics(target_dir: str | Path, allowed_root: str | Path) -> Dict[str, Any]:
    """
    Computes real-time dynamic statistics across the target directory.
    Uses real filesystem data, no hardcoded figures.
    """
    valid_root = Path(allowed_root).resolve()
    valid_target = validate_path(target_dir, valid_root, must_exist=True)

    all_categories = get_all_categories()
    category_counts = {cat: 0 for cat in all_categories}
    category_sizes = {cat: 0 for cat in all_categories}
    ext_counts = defaultdict(int)

    total_files = 0
    total_folders = 0
    total_size = 0
    organized_files_count = 0
    unorganized_files_count = 0

    known_category_dirs = set(all_categories)

    folders: set[str] = set()
    for stored_file in iter_files(valid_target):
        file_path = stored_file.path
        current_path = file_path.parent
        is_inside_cat_dir = current_path.name in known_category_dirs

        if not uses_blob_storage() and file_path.is_symlink():
            try:
                file_path.resolve().relative_to(valid_root)
            except (ValueError, RuntimeError):
                continue

        f_size = stored_file.size
        f_ext = file_path.suffix.lower()
        cat = get_category(f_ext)

        total_files += 1
        total_size += f_size
        category_counts[cat] = category_counts.get(cat, 0) + 1
        category_sizes[cat] = category_sizes.get(cat, 0) + f_size
        ext_counts[f_ext or "[no ext]"] += 1
        folders.update(
            str(Path(stored_file.relative_path).parents[i])
            for i in range(len(Path(stored_file.relative_path).parts) - 1)
        )

        if is_inside_cat_dir and current_path.name == cat:
            organized_files_count += 1
        else:
            unorganized_files_count += 1

    if uses_blob_storage():
        total_folders = len(folders)
    else:
        import os

        total_folders = sum(len(dirs) for _, dirs, _ in os.walk(valid_target, followlinks=False))

    # Prepare category breakdown list for charts and metrics
    category_breakdown: List[Dict[str, Any]] = []
    for cat in all_categories:
        count = category_counts[cat]
        size_b = category_sizes[cat]
        pct_files = round((count / total_files * 100), 1) if total_files > 0 else 0
        pct_size = round((size_b / total_size * 100), 1) if total_size > 0 else 0

        category_breakdown.append({
            "category": cat,
            "count": count,
            "size": size_b,
            "size_formatted": format_size(size_b),
            "percentage_files": pct_files,
            "percentage_size": pct_size,
            "color": get_category_color(cat),
        })

    # Top file extensions
    top_extensions = sorted(
        [{"extension": ext, "count": count} for ext, count in ext_counts.items()],
        key=lambda x: x["count"],
        reverse=True,
    )[:8]

    # Quick duplicate summary
    dup_data = find_duplicates(valid_target, valid_root)

    # Recent activity history
    recent_history = get_recent_history(limit=5)

    return {
        "target_directory": str(valid_target),
        "total_files": total_files,
        "total_folders": total_folders,
        "total_size": total_size,
        "total_size_formatted": format_size(total_size),
        "organized_files": organized_files_count,
        "unorganized_files": unorganized_files_count,
        "duplicate_groups": dup_data["total_groups"],
        "duplicate_files": dup_data["total_duplicate_files"],
        "wasted_size": dup_data["total_wasted_bytes"],
        "wasted_size_formatted": dup_data["total_wasted_formatted"],
        "categories": category_breakdown,
        "top_extensions": top_extensions,
        "recent_activities": recent_history,
    }
