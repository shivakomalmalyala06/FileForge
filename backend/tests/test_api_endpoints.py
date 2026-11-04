import pytest
from pathlib import Path
from main import (
    health,
    get_categories,
    get_current_configuration,
    scan_files,
    get_statistics,
    get_duplicates,
    search,
    organize_preview,
    organize_execute,
    undo_operation,
    seed_sample,
    OrganizeExecuteRequest,
    UndoRequest,
)


def test_api_health_endpoint():
    res = health()
    assert res["status"] == "healthy"
    assert "FileForge" in res["app"]


def test_api_categories_endpoint():
    res = get_categories()
    assert "Documents" in res["category_names"]
    assert "Images" in res["category_names"]
    assert "Documents" in res["categories"]


def test_api_config_and_seed_endpoint():
    seed_res = seed_sample()
    assert seed_res["success"] is True
    assert seed_res["total_files_created"] > 0

    cfg_res = get_current_configuration()
    assert "allowed_root" in cfg_res
    assert Path(cfg_res["allowed_root"]).exists()


def test_api_scan_and_statistics_endpoints():
    scan_res = scan_files()
    assert scan_res["total_files"] > 0
    assert len(scan_res["files"]) > 0

    stats_res = get_statistics()
    assert stats_res["total_files"] > 0
    assert len(stats_res["categories"]) == 7


def test_api_duplicates_and_search_endpoints():
    dup_res = get_duplicates()
    assert "groups" in dup_res
    assert dup_res["total_groups"] >= 1

    search_res = search(q="Report")
    assert search_res["total_matches"] >= 1
    assert any("Report" in f["name"] for f in search_res["results"])


def test_api_organize_preview_and_execute_flow():
    preview_res = organize_preview()
    assert "planned_moves" in preview_res
    assert preview_res["total_to_move"] >= 0

    # Test requirement for confirmation flag
    with pytest.raises(Exception):
        organize_execute(OrganizeExecuteRequest(confirmed=False))

    exec_res = organize_execute(OrganizeExecuteRequest(confirmed=True))
    assert exec_res["success"] is True

    # Test undo
    if exec_res["batch_id"]:
        undo_res = undo_operation(UndoRequest(batch_id=exec_res["batch_id"]))
        assert undo_res["success"] is True
