import os
import json
import tempfile
from pathlib import Path
from typing import Tuple

PROJECT_ROOT = Path(__file__).resolve().parent.parent


def _pick_data_dir() -> Path:
    """
    Writable folder for sample data, config and history.
    Locally: the project folder (unchanged behaviour).
    On serverless hosts such as Vercel the code folder is read-only and
    PROJECT_ROOT resolves to a non-existent path like /var, so use the temp dir.
    """
    if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
        return Path(tempfile.gettempdir()) / "fileforge"
    try:
        probe = PROJECT_ROOT / ".write_test"
        probe.touch()
        probe.unlink()
        return PROJECT_ROOT
    except OSError:
        return Path(tempfile.gettempdir()) / "fileforge"


DATA_DIR = _pick_data_dir()
DATA_DIR.mkdir(parents=True, exist_ok=True)
DEFAULT_ALLOWED_ROOT = (DATA_DIR / "sample_data").resolve()
CONFIG_FILE = DATA_DIR / "config.json"


def ensure_default_root(allowed_root: Path) -> None:
    """Re-creates the demo dataset if the default root is missing/empty
    (serverless /tmp is wiped on cold starts)."""
    if Path(allowed_root).resolve() != DEFAULT_ALLOWED_ROOT:
        return
    if DEFAULT_ALLOWED_ROOT.exists() and any(DEFAULT_ALLOWED_ROOT.iterdir()):
        return
    from sample_generator import seed_sample_data  # local import avoids circular import
    seed_sample_data(DEFAULT_ALLOWED_ROOT)


def get_config() -> dict:
    """Reads configuration or returns defaults."""
    try:
        ensure_default_root(DEFAULT_ALLOWED_ROOT)
    except Exception:
        pass
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return {
                    "allowed_root": data.get("allowed_root", str(DEFAULT_ALLOWED_ROOT)),
                    "current_scan_dir": data.get("current_scan_dir", str(DEFAULT_ALLOWED_ROOT)),
                }
        except Exception:
            pass
    return {
        "allowed_root": str(DEFAULT_ALLOWED_ROOT),
        "current_scan_dir": str(DEFAULT_ALLOWED_ROOT),
    }


def save_config(allowed_root: str, current_scan_dir: str):
    """Persists configuration safely."""
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(
            {
                "allowed_root": allowed_root,
                "current_scan_dir": current_scan_dir,
            },
            f,
            indent=2,
        )


def format_size(size_bytes: int) -> str:
    """Formats bytes into human-readable representation."""
    if size_bytes < 0:
        return "0 B"
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if size_bytes < 1024.0 or unit == "TB":
            if unit == "B":
                return f"{int(size_bytes)} {unit}"
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} TB"


def validate_path(target_path_input: str | Path, allowed_root_input: str | Path, must_exist: bool = False) -> Path:
    """
    Validates that target_path is within allowed_root to prevent path traversal attacks.
    Guarantees no traversal outside allowed boundary.
    """
    allowed_root = Path(allowed_root_input).resolve()
    
    if isinstance(target_path_input, str):
        target_path_str = target_path_input.strip()
        # Disallow empty strings or explicit traversal attempts
        if not target_path_str:
            target_path = allowed_root
        else:
            target_path = Path(target_path_str)
            if not target_path.is_absolute():
                target_path = (allowed_root / target_path).resolve()
            else:
                target_path = target_path.resolve()
    else:
        target_path = target_path_input.resolve()

    # Verify target_path is inside or equal to allowed_root
    try:
        target_path.relative_to(allowed_root)
    except ValueError:
        raise ValueError(
            f"Access denied: Path '{target_path}' is outside the allowed directory '{allowed_root}'."
        )

    # Prevent symlink directory escape
    if target_path.is_symlink():
        real_target = target_path.resolve()
        try:
            real_target.relative_to(allowed_root)
        except ValueError:
            raise ValueError(f"Access denied: Symlink resolves outside allowed directory '{allowed_root}'.")

    if must_exist and not target_path.exists():
        raise FileNotFoundError(f"Path does not exist: '{target_path}'")

    return target_path


def get_safe_destination_path(dest_folder: Path, filename: str) -> Path:
    """
    Returns a collision-free path inside dest_folder.
    If 'file.txt' exists, returns 'file (1).txt', 'file (2).txt', etc.
    Never overwrites existing files.
    """
    dest_path = dest_folder / filename
    if not dest_path.exists():
        return dest_path

    stem = Path(filename).stem
    suffix = Path(filename).suffix
    counter = 1
    while True:
        candidate_name = f"{stem} ({counter}){suffix}"
        candidate_path = dest_folder / candidate_name
        if not candidate_path.exists():
            return candidate_path
        counter += 1
