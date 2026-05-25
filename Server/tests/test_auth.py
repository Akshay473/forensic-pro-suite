import os
import sys
import pathlib
import pytest
from fastapi.testclient import TestClient

# ensure repo root (Server/) is on sys.path for imports when running pytest
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))

from main import app


def test_unauthorized_rejected():
    client = TestClient(app)
    files = {"file": ("small.txt", "hello")}
    r = client.post("/api/analyze", files=files)
    assert r.status_code in (401, 403)


def test_investigator_upload_and_audit(tmp_path):
    os.environ["INVESTIGATOR_TOKEN"] = "testtoken123"
    audit_path = os.path.join(os.getcwd(), "server_audit.log")
    if os.path.exists(audit_path):
        os.remove(audit_path)

    client = TestClient(app)
    files = {"file": ("small.txt", "hello world")}
    headers = {"Authorization": "Bearer testtoken123"}
    r = client.post("/api/analyze", files=files, headers=headers)
    assert r.status_code == 200
    data = r.json()
    assert "hash" in data and "hash_md5" in data

    # check audit
    assert os.path.exists(audit_path)
    with open(audit_path, "r") as f:
        content = f.read()
    assert "user=investigator" in content or "user=admin" in content

    # cleanup
    try:
        os.remove(audit_path)
    except Exception:
        pass
    del os.environ["INVESTIGATOR_TOKEN"]
 