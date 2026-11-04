import os
import shutil
from pathlib import Path
from typing import Dict, Any

from helpers import DEFAULT_ALLOWED_ROOT


def seed_sample_data(target_dir: Path | None = None) -> Dict[str, Any]:
    """
    Populates target_dir (default: sample_data) with a comprehensive, realistic set
    of files across all 7 categories, including identical duplicate files for SHA-256 testing.
    """
    dest = target_dir if target_dir else DEFAULT_ALLOWED_ROOT
    dest = Path(dest).resolve()
    dest.mkdir(parents=True, exist_ok=True)

    # Clean existing items inside sample_data safely to allow clean re-runs
    for item in dest.iterdir():
        if item.is_dir():
            shutil.rmtree(item, ignore_errors=True)
        else:
            try:
                item.unlink(missing_ok=True)
            except Exception:
                pass

    created_files = []

    # 1. Documents
    docs = [
        ("College_Project_Report.pdf", b"%PDF-1.5 Mock PDF content for FileForge college project report.\n" * 40),
        ("Resume_Software_Engineer.docx", b"PK\x03\x04 Mock DOCX content - Senior Fullstack Resume Shiva.\n" * 25),
        ("Research_Paper_AI.txt", b"Abstract: Fast and dynamic file organization with safety guarantees.\n" * 30),
        ("Financial_Sheet_2026.xlsx", b"PK\x03\x04 Mock XLSX content - Quarterly Budget Breakdown.\n" * 35),
        ("Project_Presentation.pptx", b"PK\x03\x04 Mock PPTX content - FileForge Slide Deck.\n" * 50),
        ("Project_Notes.md", b"# FileForge Notes\n- Dynamic Categorization\n- SHA-256 Deduplication\n- One-click Undo\n" * 15),
    ]

    # 2. Images
    images = [
        ("Campus_Photo.jpg", b"\xFF\xD8\xFF\xE0\x00\x10JFIF Mock JPEG Camera Snapshot.\n" * 60),
        ("System_Architecture.png", b"\x89PNG\r\n\x1a\n Mock PNG Diagram of FastAPI and React architecture.\n" * 80),
        ("Logo_FileForge.svg", b"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='#3b82f6'/></svg>\n"),
        ("Banner_Design.webp", b"RIFF\x00\x00\x00\x00WEBPVP8 Mock WebP Banner Image.\n" * 45),
    ]

    # 3. Videos
    videos = [
        ("Project_Demo_Walkthrough.mp4", b"\x00\x00\x00 ftypisom Mock MP4 Video Demo Stream.\n" * 120),
        ("Lecture_Recording.mkv", b"\x1A\x45\xDF\xA3 Mock Matroska MKV Video Lecture.\n" * 100),
        ("Quick_Tutorial.webm", b"\x1A\x45\xDF\xA3 Mock WebM Tutorial Video.\n" * 70),
    ]

    # 4. Audio
    audio = [
        ("Podcast_Episode_12.mp3", b"ID3\x03\x00\x00 Mock MP3 Podcast Audio Stream FileForge.\n" * 90),
        ("Meeting_Recording.wav", b"RIFF\x00\x00\x00\x00WAVEfmt Mock WAV Audio Recording.\n" * 110),
        ("Soundtrack_Theme.flac", b"fLaC Mock Free Lossless Audio Codec Track.\n" * 80),
    ]

    # 5. Archives
    archives = [
        ("Project_Backup_v1.zip", b"PK\x03\x04 Mock ZIP Archive compressed package.\n" * 75),
        ("Dataset_Archive.tar.gz", b"\x1F\x8B\x08 Mock GZIP Compressed Tarball Dataset.\n" * 65),
        ("Source_Archive.7z", b"7z\xBC\xAF\x27\x1C Mock 7-Zip Compressed Files.\n" * 55),
    ]

    # 6. Code
    code = [
        ("server_api.py", b"from fastapi import FastAPI\napp = FastAPI(title='FileForge API')\n\n@app.get('/')\ndef root():\n    return {'status': 'active'}\n"),
        ("app_component.jsx", b"import React from 'react';\nexport default function App() {\n    return <div>FileForge Dashboard</div>;\n}\n"),
        ("styles_theme.css", b":root { --brand-primary: #3b82f6; --bg-main: #0f172a; }\nbody { margin: 0; font-family: Inter, sans-serif; }\n"),
        ("schema_models.ts", b"export interface FileItem {\n    name: string;\n    size: number;\n    category: string;\n}\n"),
        ("database_dump.sql", b"CREATE TABLE users (id SERIAL PRIMARY KEY, username VARCHAR(50));\nINSERT INTO users VALUES (1, 'admin');\n"),
        ("config_env.json", b"{\n  \"env\": \"production\",\n  \"port\": 8000,\n  \"name\": \"FileForge\"\n}\n"),
    ]

    # 7. Others
    others = [
        ("data_export.bin", b"\x00\x01\x02\x03\x04\x05\x06\x07 Binary Payload Data Export.\n" * 30),
        ("cache_payload.dat", b"CACHE_DUMP_001 Raw Unstructured Data Block.\n" * 20),
    ]

    all_initial = docs + images + videos + audio + archives + code + others

    # Write files
    for filename, content in all_initial:
        file_path = dest / filename
        with open(file_path, "wb") as f:
            f.write(content)
        created_files.append(filename)

    # Now create deliberate duplicates (identical byte content for SHA-256 detection)
    duplicates = [
        ("College_Project_Report_copy.pdf", docs[0][1]),
        ("Campus_Photo_backup.jpg", images[0][1]),
        ("Dataset_Archive_mirror.tar.gz", archives[1][1]),
    ]

    for filename, content in duplicates:
        file_path = dest / filename
        with open(file_path, "wb") as f:
            f.write(content)
        created_files.append(filename)

    # Also create a nested subfolder with raw unsorted files to demonstrate deep recursive scanning
    subfolder = dest / "Unsorted_Downloads"
    subfolder.mkdir(parents=True, exist_ok=True)

    nested_files = [
        ("Invoice_May_2026.pdf", b"%PDF-1.4 Mock Invoice Content\n" * 20),
        ("Camera_RAW_002.png", b"\x89PNG\r\n Mock Nested Image\n" * 25),
        ("script_automation.py", b"# Python automation script\nprint('Running FileForge scan')\n"),
        ("Invoice_May_2026_duplicate.pdf", b"%PDF-1.4 Mock Invoice Content\n" * 20),  # Another duplicate
    ]

    for filename, content in nested_files:
        file_path = subfolder / filename
        with open(file_path, "wb") as f:
            f.write(content)
        created_files.append(f"Unsorted_Downloads/{filename}")

    return {
        "success": True,
        "message": f"Successfully seeded {len(created_files)} sample files across all categories.",
        "target_directory": str(dest),
        "total_files_created": len(created_files),
        "created_files": created_files,
    }
