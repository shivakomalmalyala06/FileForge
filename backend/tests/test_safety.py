import pytest
from pathlib import Path
from helpers import validate_path, get_safe_destination_path, format_size


def test_validate_path_allowed_boundaries(tmp_path):
    root = tmp_path / "allowed_root"
    root.mkdir()
    sub = root / "subfolder"
    sub.mkdir()
    test_file = sub / "test.txt"
    test_file.write_text("safe content")

    # Valid relative and absolute paths
    validated = validate_path(sub, root)
    assert validated == sub.resolve()

    validated_file = validate_path(test_file, root, must_exist=True)
    assert validated_file == test_file.resolve()


def test_validate_path_rejects_traversal(tmp_path):
    root = tmp_path / "allowed_root"
    root.mkdir()
    outside = tmp_path / "outside_dir"
    outside.mkdir()

    # Attempting to escape with ..
    with pytest.raises(ValueError, match="Access denied"):
        validate_path("../outside_dir", root)

    with pytest.raises(ValueError, match="Access denied"):
        validate_path(str(outside), root)


def test_collision_prevention_safe_destination(tmp_path):
    dest = tmp_path / "destination"
    dest.mkdir()

    # First file
    first_path = get_safe_destination_path(dest, "document.pdf")
    assert first_path.name == "document.pdf"
    first_path.write_text("original")

    # Second file with same name
    second_path = get_safe_destination_path(dest, "document.pdf")
    assert second_path.name == "document (1).pdf"
    second_path.write_text("second")

    # Third file
    third_path = get_safe_destination_path(dest, "document.pdf")
    assert third_path.name == "document (2).pdf"


def test_format_size():
    assert format_size(0) == "0 B"
    assert format_size(500) == "500 B"
    assert format_size(1024) == "1.00 KB"
    assert format_size(1024 * 1024 * 5) == "5.00 MB"
