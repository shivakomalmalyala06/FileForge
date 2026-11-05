import hashlib
import hmac
import os
import time


COOKIE_NAME = "fileforge_file_access"
SESSION_MAX_AGE = 3600


def _configured_password() -> str:
    return os.environ.get("FILEFORGE_ACCESS_PASSWORD", "")


def issue_file_access_token(password: str) -> str:
    expires_at = int(time.time()) + SESSION_MAX_AGE
    payload = str(expires_at)
    signature = hmac.new(
        password.encode("utf-8"),
        payload.encode("ascii"),
        hashlib.sha256,
    ).hexdigest()
    return f"{payload}.{signature}"


def verify_file_access_token(token: str | None) -> bool:
    password = _configured_password()
    if not password or not token:
        return False

    try:
        expires_at_text, signature = token.split(".", 1)
        expires_at = int(expires_at_text)
    except (ValueError, TypeError):
        return False

    if expires_at <= int(time.time()) or expires_at > int(time.time()) + SESSION_MAX_AGE:
        return False

    expected_signature = hmac.new(
        password.encode("utf-8"),
        expires_at_text.encode("ascii"),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(signature, expected_signature)


def check_access_password(candidate: str) -> bool:
    expected = _configured_password()
    return bool(expected) and hmac.compare_digest(candidate, expected)
