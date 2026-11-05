import time

from fastapi.testclient import TestClient

import file_access
import main


def test_file_access_token_rejects_tampering_and_expiration(monkeypatch):
    monkeypatch.setenv("FILEFORGE_ACCESS_PASSWORD", "long-test-passphrase")
    now = int(time.time())
    monkeypatch.setattr(file_access.time, "time", lambda: now)
    token = file_access.issue_file_access_token("long-test-passphrase")

    assert file_access.verify_file_access_token(token)
    assert not file_access.verify_file_access_token(token + "tampered")

    monkeypatch.setattr(file_access.time, "time", lambda: now + file_access.SESSION_MAX_AGE)
    assert not file_access.verify_file_access_token(token)


def test_file_content_requires_password_and_streams_images(monkeypatch, tmp_path):
    monkeypatch.setenv("FILEFORGE_ACCESS_PASSWORD", "long-test-passphrase")
    image = tmp_path / "passport.jpg"
    image.write_bytes(b"\xff\xd8\xfftest-image")
    monkeypatch.setattr(
        main,
        "get_config",
        lambda: {
            "allowed_root": str(tmp_path),
            "current_scan_dir": str(tmp_path),
        },
    )
    client = TestClient(main.app)

    url = f"/api/files/content?path={image}"
    assert client.get(url).status_code == 401
    assert client.post("/api/auth/file-access", json={"password": "wrong"}).status_code == 401

    login = client.post(
        "/api/auth/file-access",
        json={"password": "long-test-passphrase"},
    )
    assert login.status_code == 200
    assert login.cookies.get(file_access.COOKIE_NAME)

    response = client.get(url)
    assert response.status_code == 200
    assert response.content == b"\xff\xd8\xfftest-image"
    assert response.headers["content-type"] == "image/jpeg"
    assert response.headers["content-disposition"].startswith("inline;")
    assert response.headers["cache-control"] == "private, no-store"


def test_file_content_rejects_paths_outside_allowed_root(monkeypatch, tmp_path):
    monkeypatch.setenv("FILEFORGE_ACCESS_PASSWORD", "long-test-passphrase")
    outside_file = tmp_path.parent / "private.txt"
    outside_file.write_text("not allowed", encoding="utf-8")
    monkeypatch.setattr(
        main,
        "get_config",
        lambda: {
            "allowed_root": str(tmp_path),
            "current_scan_dir": str(tmp_path),
        },
    )
    client = TestClient(main.app)
    client.post(
        "/api/auth/file-access",
        json={"password": "long-test-passphrase"},
    )

    response = client.get(f"/api/files/content?path={outside_file}")

    assert response.status_code == 400
