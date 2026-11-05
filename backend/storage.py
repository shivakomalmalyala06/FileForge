import json
import mimetypes
import shutil
import os
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Iterator


_BLOB_PREFIX = "fileforge/"


@dataclass(frozen=True)
class StoredFile:
    path: Path
    relative_path: str
    size: int
    modified: datetime


def uses_blob_storage() -> bool:
    return bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))


def _blob():
    try:
        from vercel.blob import sync
    except ImportError as exc:
        raise RuntimeError(
            "Persistent file storage requires the Vercel Blob SDK. "
            "Install the backend requirements and connect a Blob store to this Vercel project."
        ) from exc
    return sync


def _data_dir() -> Path:
    from helpers import DATA_DIR

    return DATA_DIR.resolve()


def _key_for_path(path: str | Path) -> str:
    resolved = Path(path).resolve()
    try:
        relative = resolved.relative_to(_data_dir())
    except ValueError as exc:
        raise ValueError(f"Path is outside the FileForge data directory: '{resolved}'") from exc
    return _BLOB_PREFIX + relative.as_posix()


def iter_files(target_dir: str | Path) -> Iterator[StoredFile]:
    target = Path(target_dir).resolve()
    if not uses_blob_storage():
        for root, _, filenames in os.walk(target, followlinks=False):
            current = Path(root)
            for filename in filenames:
                path = current / filename
                try:
                    stat = path.stat()
                except (PermissionError, FileNotFoundError, OSError):
                    continue
                yield StoredFile(
                    path=path,
                    relative_path=path.relative_to(target).as_posix(),
                    size=stat.st_size,
                    modified=datetime.fromtimestamp(stat.st_mtime),
                )
        return

    prefix = _key_for_path(target).rstrip("/") + "/"
    for item in _blob().query_blobs(prefix=prefix):
        pathname = item.pathname
        if not pathname.startswith(prefix):
            continue
        relative_path = pathname[len(prefix):]
        if not relative_path or any(part in ("", ".", "..") for part in relative_path.split("/")):
            continue
        path = target.joinpath(*relative_path.split("/"))
        uploaded_at = getattr(item, "uploaded_at", None) or datetime.now()
        yield StoredFile(path, relative_path, item.size, uploaded_at)


def read_file(path: str | Path) -> bytes:
    if uses_blob_storage():
        result = _blob().get_blob(_key_for_path(path), access="private")
        return result.body
    return Path(path).read_bytes()


def iter_file_chunks(path: str | Path, chunk_size: int = 65536) -> Iterator[bytes]:
    if uses_blob_storage():
        with _blob().stream_blob(_key_for_path(path), access="private") as download:
            yield from download
        return
    with Path(path).open("rb") as file:
        while chunk := file.read(chunk_size):
            yield chunk


def write_file(path: str | Path, content: bytes, *, overwrite: bool = False) -> None:
    destination = Path(path)
    if uses_blob_storage():
        content_type, _ = mimetypes.guess_type(destination.name)
        _blob().put_blob(
            _key_for_path(destination),
            content,
            access="private",
            content_type=content_type,
            allow_overwrite=overwrite,
        )
        return
    destination.parent.mkdir(parents=True, exist_ok=True)
    if not overwrite and destination.exists():
        raise FileExistsError(f"File already exists: '{destination}'")
    destination.write_bytes(content)


def write_stream(path: str | Path, source, content_length: int, *, overwrite: bool = False) -> None:
    destination = Path(path)
    if uses_blob_storage():
        content_type, _ = mimetypes.guess_type(destination.name)
        _blob().put_blob(
            _key_for_path(destination),
            source,
            content_length=content_length,
            access="private",
            content_type=content_type,
            allow_overwrite=overwrite,
        )
        return
    destination.parent.mkdir(parents=True, exist_ok=True)
    if not overwrite and destination.exists():
        raise FileExistsError(f"File already exists: '{destination}'")
    with destination.open("wb") as target:
        shutil.copyfileobj(source, target)


def make_directory(path: str | Path) -> None:
    if not uses_blob_storage():
        Path(path).mkdir(parents=True, exist_ok=True)


def remove_file(path: str | Path) -> None:
    if uses_blob_storage():
        _blob().delete_blob(_key_for_path(path))
        return
    Path(path).unlink(missing_ok=True)


def move_file(source: str | Path, destination: str | Path) -> None:
    if uses_blob_storage():
        api = _blob()
        api.copy_blob(
            _key_for_path(source),
            _key_for_path(destination),
            access="private",
            allow_overwrite=False,
        )
        api.delete_blob(_key_for_path(source))
        return
    import shutil

    Path(destination).parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(source), str(destination))


def path_exists(path: str | Path) -> bool:
    candidate = Path(path).resolve()
    if not uses_blob_storage():
        return candidate.exists()
    return any(str(item.path) == str(candidate) for item in iter_files(candidate.parent))


def directory_exists(path: str | Path) -> bool:
    candidate = Path(path).resolve()
    if not uses_blob_storage():
        return candidate.is_dir()
    return any(True for _ in iter_files(candidate))


def remove_empty_directory(path: str | Path) -> bool:
    if uses_blob_storage():
        return False
    directory = Path(path)
    if directory.is_dir() and not any(directory.iterdir()):
        directory.rmdir()
        return True
    return False


def read_json(path: str | Path, default: Any) -> Any:
    if uses_blob_storage():
        try:
            result = _blob().get_blob(_key_for_path(path), access="private")
        except FileNotFoundError:
            return default
        return json.loads(result.body)
    local_path = Path(path)
    if not local_path.exists():
        return default
    with local_path.open("r", encoding="utf-8") as file:
        return json.load(file)


def write_json(path: str | Path, value: Any) -> None:
    payload = json.dumps(value, indent=2).encode("utf-8")
    write_file(path, payload, overwrite=True)
