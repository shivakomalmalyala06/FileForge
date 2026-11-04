from categorizer import get_category, get_all_categories, get_category_color


def test_categorizer_extensions():
    # Documents
    assert get_category("report.pdf") == "Documents"
    assert get_category("notes.docx") == "Documents"
    assert get_category("data.xlsx") == "Documents"
    assert get_category("info.txt") == "Documents"

    # Images
    assert get_category("photo.jpg") == "Images"
    assert get_category("logo.PNG") == "Images"
    assert get_category("art.svg") == "Images"

    # Videos
    assert get_category("movie.mp4") == "Videos"
    assert get_category("clip.mkv") == "Videos"

    # Audio
    assert get_category("song.mp3") == "Audio"
    assert get_category("recording.wav") == "Audio"

    # Archives
    assert get_category("backup.zip") == "Archives"
    assert get_category("data.tar.gz") == "Archives"

    # Code
    assert get_category("main.py") == "Code"
    assert get_category("script.js") == "Code"
    assert get_category("app.tsx") == "Code"

    # Others
    assert get_category("binary.bin") == "Others"
    assert get_category("unknown_file") == "Others"


def test_all_categories():
    cats = get_all_categories()
    assert "Documents" in cats
    assert "Images" in cats
    assert "Videos" in cats
    assert "Audio" in cats
    assert "Archives" in cats
    assert "Code" in cats
    assert "Others" in cats


def test_category_colors():
    assert get_category_color("Documents").startswith("#")
    assert get_category_color("Images").startswith("#")
    assert get_category_color("NonExistent") == "#64748b"
