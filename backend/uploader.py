import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any
from fastapi import UploadFile

from categorizer import get_category
from helpers import format_size, validate_path, get_safe_destination_path
from storage import make_directory, write_stream
from undo import record_operation


def save_uploaded_files(
    files: List[UploadFile],
    target_dir: str | Path,
    allowed_root: str | Path,
    auto_organize: bool = True,
) -> Dict[str, Any]:
    """
    Saves uploaded files directly from client into target directory.
    If auto_organize=True (default), automatically stores each file in its
    respective category folder (Documents/, Images/, etc.).
    Collision-free: never overwrites existing files.
    """
    valid_root = Path(allowed_root).resolve()
    valid_target = validate_path(target_dir, valid_root, must_exist=True)

    uploaded_records: List[Dict[str, Any]] = []
    errors: List[str] = []

    for file in files:
        if not file.filename:
            continue

        # Sanitize filename (take only basename, no path traversal in filename)
        clean_filename = Path(file.filename).name
        ext = Path(clean_filename).suffix.lower()
        category = get_category(ext or clean_filename)

        if auto_organize:
            dest_folder = valid_target / category
        else:
            dest_folder = valid_target

        try:
            make_directory(dest_folder)
            safe_dest_path = get_safe_destination_path(dest_folder, clean_filename)

            file.file.seek(0, 2)
            bytes_written = file.file.tell()
            file.file.seek(0)
            write_stream(safe_dest_path, file.file, bytes_written)

            uploaded_records.append({
                "original_filename": clean_filename,
                "saved_filename": safe_dest_path.name,
                "category": category,
                "destination_folder": category if auto_organize else "",
                "relative_path": str(safe_dest_path.relative_to(valid_target)),
                "full_path": str(safe_dest_path),
                "size": bytes_written,
                "size_formatted": format_size(bytes_written),
                "has_collision": safe_dest_path.name != clean_filename,
            })
        except Exception as e:
            errors.append(f"Failed to save {clean_filename}: {str(e)}")
        finally:
            try:
                file.file.close()
            except Exception:
                pass

    # Record batch in history
    if uploaded_records and auto_organize:
        batch_id = f"upload_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"
        records_for_history = [
            {
                "original_path": str(valid_target / r["saved_filename"]),
                "new_path": r["full_path"],
                "file_name": r["saved_filename"],
                "category": r["category"],
                "size": r["size"],
                "size_formatted": r["size_formatted"],
            }
            for r in uploaded_records
        ]
        summary = {
            "uploaded_count": len(uploaded_records),
            "categories": list({r["category"] for r in uploaded_records}),
            "total_size": sum(r["size"] for r in uploaded_records),
            "action": "direct_upload_organize",
        }
        record_operation(
            batch_id=batch_id,
            target_dir=str(valid_target),
            records=records_for_history,
            summary=summary,
        )

    return {
        "success": True,
        "message": f"Successfully uploaded and organized {len(uploaded_records)} file(s) into their categorized folders.",
        "uploaded_count": len(uploaded_records),
        "uploaded_files": uploaded_records,
        "errors": errors,
    }
