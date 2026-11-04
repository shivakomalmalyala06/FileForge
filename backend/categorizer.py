from pathlib import Path
from typing import Dict, List

# Standard file extension mappings by category
CATEGORY_EXTENSIONS: Dict[str, List[str]] = {
    "Documents": [
        ".pdf", ".docx", ".doc", ".txt", ".rtf", ".odt",
        ".xlsx", ".xls", ".pptx", ".ppt", ".csv", ".md", ".epub"
    ],
    "Images": [
        ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg",
        ".webp", ".tiff", ".ico", ".psd", ".raw"
    ],
    "Videos": [
        ".mp4", ".mkv", ".avi", ".mov", ".wmv", ".flv",
        ".webm", ".m4v", ".3gp"
    ],
    "Audio": [
        ".mp3", ".wav", ".aac", ".flac", ".ogg", ".m4a",
        ".wma", ".opus"
    ],
    "Archives": [
        ".zip", ".rar", ".7z", ".tar", ".gz", ".bz2",
        ".xz", ".iso", ".tgz"
    ],
    "Code": [
        ".py", ".js", ".jsx", ".ts", ".tsx", ".html", ".css",
        ".json", ".java", ".c", ".cpp", ".h", ".cs", ".php",
        ".rb", ".go", ".rs", ".sql", ".sh", ".yml", ".yaml", ".xml"
    ],
}

CATEGORY_COLORS: Dict[str, str] = {
    "Documents": "#3b82f6",  # Blue
    "Images": "#ec4899",     # Pink
    "Videos": "#8b5cf6",     # Purple
    "Audio": "#f59e0b",      # Amber
    "Archives": "#10b981",   # Emerald
    "Code": "#06b6d4",       # Cyan
    "Others": "#64748b",     # Slate
}

# Reverse lookup dictionary for O(1) extension category matching
_EXT_TO_CATEGORY: Dict[str, str] = {}
for cat, exts in CATEGORY_EXTENSIONS.items():
    for ext in exts:
        _EXT_TO_CATEGORY[ext.lower()] = cat


def get_category(file_or_ext: str) -> str:
    """
    Returns the category for a given filename or extension.
    If no match is found, returns 'Others'.
    Handles dotfiles, full filenames, and bare extensions (.pdf, pdf).
    """
    s = str(file_or_ext).strip()
    if not s:
        return "Others"

    # If it's already an extension like ".pdf"
    if s.startswith(".") and not ("/" in s or "\\" in s) and s.count(".") == 1:
        ext = s.lower()
    else:
        ext = Path(s).suffix.lower()
        if not ext and "." in s:
            ext = f".{s.rsplit('.', 1)[-1].lower()}"
        elif not ext and not s.startswith("."):
            ext = f".{s.lower()}"

    return _EXT_TO_CATEGORY.get(ext, "Others")


def get_category_color(category: str) -> str:
    """Returns the hex color code for a category."""
    return CATEGORY_COLORS.get(category, CATEGORY_COLORS["Others"])


def get_all_categories() -> List[str]:
    """Returns the ordered list of all categories."""
    return ["Documents", "Images", "Videos", "Audio", "Archives", "Code", "Others"]


def get_category_definitions() -> Dict[str, dict]:
    """Returns comprehensive metadata for all categories."""
    return {
        cat: {
            "name": cat,
            "extensions": CATEGORY_EXTENSIONS.get(cat, []),
            "color": CATEGORY_COLORS.get(cat, "#64748b"),
        }
        for cat in get_all_categories()
    }
