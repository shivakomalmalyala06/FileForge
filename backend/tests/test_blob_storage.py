import io
from dataclasses import dataclass
from datetime import datetime

import pytest

import storage


@dataclass
class FakeBlob:
    pathname: str
    content: bytes
    uploaded_at: datetime

    @property
    def size(self):
        return len(self.content)


class FakeBlobStore:
    def __init__(self):
        self.files = {}

    def query_blobs(self, prefix):
        return [
            FakeBlob(path, content, uploaded_at)
            for path, (content, uploaded_at) in self.files.items()
            if path.startswith(prefix)
        ]

    def put_blob(self, pathname, body, **kwargs):
        if pathname in self.files and not kwargs.get("allow_overwrite", False):
            raise FileExistsError(pathname)
        content = body.read() if hasattr(body, "read") else bytes(body)
        self.files[pathname] = (content, datetime.now())

    def get_blob(self, pathname, access):
        if pathname not in self.files:
            raise FileNotFoundError(pathname)
        return type("GetResult", (), {"body": self.files[pathname][0]})()

    def stream_blob(self, pathname, access):
        if pathname not in self.files:
            raise FileNotFoundError(pathname)
        return io.BytesIO(self.files[pathname][0])

    def delete_blob(self, pathname):
        self.files.pop(pathname, None)

    def copy_blob(self, source, pathname, **kwargs):
        if pathname in self.files and not kwargs.get("allow_overwrite", False):
            raise FileExistsError(pathname)
        self.files[pathname] = self.files[source]


@pytest.fixture
def blob_store(monkeypatch, tmp_path):
    fake = FakeBlobStore()
    monkeypatch.setenv("VERCEL", "1")
    monkeypatch.setattr(storage, "_data_dir", lambda: tmp_path.resolve())
    monkeypatch.setattr(storage, "_blob", lambda: fake)
    return fake, tmp_path / "sample_data"


def test_blob_storage_persists_file_operations(blob_store):
    fake, root = blob_store
    original = root / "Documents" / "report.pdf"
    moved = root / "Archives" / "report.pdf"

    storage.write_file(original, b"durable file")

    stored = list(storage.iter_files(root))
    assert len(stored) == 1
    assert stored[0].relative_path == "Documents/report.pdf"
    assert stored[0].size == len(b"durable file")
    assert storage.read_file(original) == b"durable file"
    assert storage.path_exists(original)

    storage.move_file(original, moved)
    assert not storage.path_exists(original)
    assert storage.read_file(moved) == b"durable file"
    assert list(fake.files) == ["fileforge/sample_data/Archives/report.pdf"]

    config_path = root.parent / "config.json"
    storage.write_json(config_path, {"current_scan_dir": str(root)})
    assert storage.read_json(config_path, {}) == {"current_scan_dir": str(root)}


def test_blob_storage_rejects_paths_outside_data_directory(blob_store):
    _, root = blob_store

    with pytest.raises(ValueError, match="outside the FileForge data directory"):
        storage.write_file(root.parent.parent / "outside.txt", b"no")


def test_blob_backed_sample_data_and_file_workflows(blob_store, monkeypatch):
    _, root = blob_store
    from duplicate_finder import find_duplicates
    from organizer import execute_organization, preview_organization
    from sample_generator import seed_sample_data
    from scanner import scan_directory
    from search import search_files
    from stats import get_system_statistics
    import undo
    from undo import undo_batch

    monkeypatch.setattr(undo, "HISTORY_FILE", root.parent / "history.json")
    seeded = seed_sample_data(root)
    assert seeded["total_files_created"] == 34
    assert scan_directory(root, root)["total_files"] == 34
    assert search_files(root, root, query="Report")["total_matches"] >= 1
    assert find_duplicates(root, root)["total_groups"] >= 1
    assert get_system_statistics(root, root)["total_files"] == 34

    preview = preview_organization(root, root)
    assert preview["total_to_move"] == 34

    organized = execute_organization(root, root)
    assert organized["moved_count"] == 34
    assert scan_directory(root, root)["total_files"] == 34

    undone = undo_batch(organized["batch_id"], root)
    assert undone["success"] is True
    assert undone["restored_count"] == 34
    assert scan_directory(root, root)["total_files"] == 34


def test_blob_storage_accepts_stream_uploads(blob_store):
    _, root = blob_store
    destination = root / "Documents" / "stream.txt"

    storage.write_stream(destination, io.BytesIO(b"streamed content"), 16)

    assert storage.read_file(destination) == b"streamed content"
