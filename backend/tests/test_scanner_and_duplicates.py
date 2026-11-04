from pathlib import Path
from scanner import scan_directory
from duplicate_finder import find_duplicates, calculate_sha256
from search import search_files


def test_scanner_and_search(tmp_path):
    root = tmp_path / "scan_test"
    root.mkdir()

    # Create dummy files
    (root / "doc1.pdf").write_bytes(b"PDF document 1")
    (root / "photo.png").write_bytes(b"PNG image bytes")
    sub = root / "nested"
    sub.mkdir()
    (sub / "code.py").write_text("print('hello')")

    # Run scan
    results = scan_directory(root, root)
    assert results["total_files"] == 3
    assert results["total_folders"] >= 1
    assert len(results["files"]) == 3

    # Run search
    search_res = search_files(root, root, query="code")
    assert search_res["total_matches"] == 1
    assert search_res["results"][0]["name"] == "code.py"

    # Category search
    doc_search = search_files(root, root, category="Documents")
    assert doc_search["total_matches"] == 1
    assert doc_search["results"][0]["name"] == "doc1.pdf"


def test_duplicate_finder_sha256(tmp_path):
    root = tmp_path / "dup_test"
    root.mkdir()

    # Create identical files
    content1 = b"Identical SHA-256 payload content"
    (root / "fileA.txt").write_bytes(content1)
    (root / "fileB.txt").write_bytes(content1)

    # Create distinct file
    (root / "unique.txt").write_bytes(b"Completely different content")

    dup_res = find_duplicates(root, root)
    assert dup_res["total_groups"] == 1
    assert dup_res["total_duplicate_files"] == 2
    assert dup_res["total_wasted_bytes"] == len(content1)
    assert len(dup_res["groups"][0]["files"]) == 2
