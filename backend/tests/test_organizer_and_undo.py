from pathlib import Path
from organizer import preview_organization, execute_organization
from undo import undo_batch


def test_organization_preview_and_execution_and_undo(tmp_path):
    root = tmp_path / "organize_test"
    root.mkdir()

    # Create dummy files
    (root / "doc.pdf").write_bytes(b"pdf data")
    (root / "pic.png").write_bytes(b"png data")
    (root / "track.mp3").write_bytes(b"mp3 data")

    # Preview does not alter files
    preview = preview_organization(root, root)
    assert preview["total_to_move"] == 3
    assert (root / "doc.pdf").exists()
    assert not (root / "Documents" / "doc.pdf").exists()

    # Execute moves files into category subdirectories
    exec_res = execute_organization(root, root)
    assert exec_res["success"] is True
    assert exec_res["moved_count"] == 3
    batch_id = exec_res["batch_id"]

    # Verify files moved
    assert (root / "Documents" / "doc.pdf").exists()
    assert (root / "Images" / "pic.png").exists()
    assert (root / "Audio" / "track.mp3").exists()
    assert not (root / "doc.pdf").exists()

    # Undo execution
    undo_res = undo_batch(batch_id, root)
    assert undo_res["success"] is True
    assert undo_res["restored_count"] == 3

    # Verify restored to original location
    assert (root / "doc.pdf").exists()
    assert (root / "pic.png").exists()
    assert (root / "track.mp3").exists()
    assert not (root / "Documents" / "doc.pdf").exists()
