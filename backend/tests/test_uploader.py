import io
from pathlib import Path
from starlette.datastructures import UploadFile
from uploader import save_uploaded_files


def test_save_uploaded_files_auto_organize(tmp_path):
    root = tmp_path / "upload_root"
    root.mkdir()

    file_pdf = UploadFile(
        file=io.BytesIO(b"%PDF mock document data"),
        filename="student_resume.pdf",
    )
    file_img = UploadFile(
        file=io.BytesIO(b"JFIF mock image data"),
        filename="profile_pic.jpg",
    )

    res = save_uploaded_files([file_pdf, file_img], root, root, auto_organize=True)

    assert res["success"] is True
    assert res["uploaded_count"] == 2

    # Verify they were saved directly in respective category folders
    assert (root / "Documents" / "student_resume.pdf").exists()
    assert (root / "Images" / "profile_pic.jpg").exists()


def test_upload_collision_protection(tmp_path):
    root = tmp_path / "upload_collision"
    root.mkdir()
    (root / "Documents").mkdir()
    (root / "Documents" / "notes.txt").write_text("existing content")

    file_txt = UploadFile(
        file=io.BytesIO(b"new incoming text content"),
        filename="notes.txt",
    )

    res = save_uploaded_files([file_txt], root, root, auto_organize=True)
    assert res["success"] is True

    # Original is untouched
    assert (root / "Documents" / "notes.txt").read_text() == "existing content"

    # Collision renamed safely to notes (1).txt
    assert (root / "Documents" / "notes (1).txt").exists()
    assert (root / "Documents" / "notes (1).txt").read_text() == "new incoming text content"

