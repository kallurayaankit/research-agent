import io
import json
import os
import tempfile

os.environ["BRAM_DATA_DIR"] = tempfile.mkdtemp(prefix="bram-tests-")

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from pypdf import PdfWriter
from pypdf.generic import DictionaryObject, NameObject, DecodedStreamObject

import app as backend


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(backend, "DB_PATH", tmp_path / "test.sqlite3")
    backend.initialize()
    backend.index_state.update(running=False, error=None)
    with TestClient(backend.app) as client:
        yield client


def add(client, **overrides):
    data = {"title": "Learning systems", "content": "Spaced repetition improves memory.", "tags": ["Learning", "learning"]}
    data.update(overrides)
    response = client.post("/api/documents", json=data)
    assert response.status_code == 201, response.text
    return response.json()


def test_crud_search_and_tags(client):
    doc = add(client)
    assert doc["tags"] == ["learning"]
    assert client.get("/api/documents", params={"q": "repetition"}).json()[0]["id"] == doc["id"]
    assert client.get("/api/documents", params={"tag": "other"}).json() == []
    assert client.get("/api/documents", params={"kind": "pdf"}).json() == []
    assert client.get("/api/documents", params={"q": '" OR * : ('}).status_code == 200
    updated = client.put(f"/api/documents/{doc['id']}", json={"title": "Gardening", "content": "Compost enriches soil."})
    assert updated.status_code == 200
    assert client.get("/api/documents", params={"q": "repetition"}).json() == []
    assert len(client.get("/api/documents", params={"q": "compost"}).json()) == 1
    assert client.delete(f"/api/documents/{doc['id']}").status_code == 204
    assert client.get(f"/api/documents/{doc['id']}").status_code == 404
    assert client.get("/api/stats").json()["chunks"] == 0
    assert client.get("/api/documents", params={"q": "compost"}).json() == []


def test_persistence(client):
    add(client)
    backend.initialize()
    assert client.get("/api/stats").json()["total"] == 1


def test_review_schedule(client):
    doc = add(client)
    assert len(client.get("/api/review").json()) == 1
    result = client.post(f"/api/documents/{doc['id']}/review", json={"remembered": True}).json()
    assert result["review_count"] == 1
    assert result["review_due"] > result["created_at"]
    assert client.get("/api/review").json() == []
    assert client.get("/api/stats").json()["due"] == 0
    result = client.post(f"/api/documents/{doc['id']}/review", json={"remembered": False}).json()
    assert result["review_count"] == 0


def test_import_text_and_original(client):
    raw = b"# Notes\nMy markdown stays intact."
    result = client.post("/api/import", files={"file": ("notes.md", raw, "text/markdown")})
    assert result.status_code == 201
    doc = result.json()
    assert doc["content"] == raw.decode()
    assert client.get(f"/api/documents/{doc['id']}/attachment").content == raw
    assert client.post("/api/import", files={"file": ("archive.exe", b"MZ")}).status_code == 415
    assert client.post("/api/import", files={"file": ("bad.txt", b"\xff")}).status_code == 422


def sample_pdf():
    writer = PdfWriter()
    page = writer.add_blank_page(width=612, height=792)
    font = DictionaryObject({NameObject("/Type"): NameObject("/Font"), NameObject("/Subtype"): NameObject("/Type1"), NameObject("/BaseFont"): NameObject("/Helvetica")})
    page[NameObject("/Resources")] = DictionaryObject({NameObject("/Font"): DictionaryObject({NameObject("/F1"): writer._add_object(font)})})
    stream = DecodedStreamObject()
    stream.set_data(b"BT /F1 12 Tf 72 720 Td (Retrieval combines search and context.) Tj ET")
    page[NameObject("/Contents")] = writer._add_object(stream)
    buffer = io.BytesIO()
    writer.write(buffer)
    return buffer.getvalue()


def test_pdf_extraction_and_invalid_pdf(client):
    result = client.post("/api/import", files={"file": ("research.pdf", sample_pdf(), "application/pdf")})
    assert result.status_code == 201, result.text
    assert "Retrieval combines" in result.json()["content"]
    assert result.json()["kind"] == "pdf"
    assert client.get("/api/documents", params={"q": "retrieval"}).json()
    assert client.post("/api/import", files={"file": ("bad.pdf", b"not a pdf")}).status_code == 422


def test_backup_restore_idempotent_and_atomic(client):
    first = add(client)
    result = client.post("/api/import", files={"file": ("script.py", b"print('hello')")}).json()
    backup = client.get("/api/backup").json()
    for doc in backup["documents"]:
        assert client.delete(f"/api/documents/{doc['id']}").status_code == 204
    def restore(payload):
        return client.post("/api/restore", files={"file": ("backup.json", json.dumps(payload).encode())})
    restored = restore(backup)
    assert restored.json() == {"imported": 2, "skipped": 0}
    assert restore(backup).json() == {"imported": 0, "skipped": 2}
    assert client.get(f"/api/documents/{result['id']}/attachment").content == b"print('hello')"
    assert client.get(f"/api/documents/{first['id']}").json()["created_at"] == first["created_at"]
    assert client.get("/api/documents", params={"q": "repetition"}).json()
    backup["documents"].append({"id": "broken"})
    assert restore(backup).status_code == 422
    assert client.get("/api/stats").json()["total"] == 2


def test_semantic_and_hybrid_retrieval(client, monkeypatch):
    apple = add(client, title="Orchard", content="Apples grow on trees")
    code = add(client, title="Programming", content="Python code and functions")
    def vectors(texts):
        return [[1., 0.] if any(t in text.lower() for t in ["apple", "orchard", "fruit"]) else [0., 1.] for text in texts]
    monkeypatch.setattr(backend, "embed", vectors)
    assert client.get("/api/documents", params={"q": "fruit", "mode": "semantic"}).status_code == 409
    assert client.post("/api/index").status_code == 202
    assert client.get("/api/stats").json()["indexed"] == 2
    hits = client.get("/api/documents", params={"q": "fruit", "mode": "semantic"}).json()
    assert hits[0]["id"] == apple["id"]
    hits = client.get("/api/documents", params={"q": "Python", "mode": "hybrid"}).json()
    assert hits[0]["id"] == code["id"]
    client.put(f"/api/documents/{apple['id']}", json={"title": "Orchard", "content": "More apples"})
    assert client.get("/api/stats").json()["indexed"] == 1


def test_index_failure_keeps_text_search(client, monkeypatch):
    add(client)
    def unavailable(*args, **kwargs):
        raise HTTPException(503, "Ollama unavailable")
    monkeypatch.setattr(backend, "embed", unavailable)
    client.post("/api/index")
    assert client.get("/api/stats").json()["index"]["error"] == "Ollama unavailable"
    assert client.get("/api/documents", params={"q": "memory"}).json()
    assert not backend.index_state["running"]


def test_chat_sources_and_no_matches(client, monkeypatch):
    doc = add(client)
    calls = []
    def model(path, payload=None):
        calls.append(payload)
        assert doc["content"] in payload["messages"][1]["content"]
        return {"message": {"content": "Spaced repetition improves memory [1]."}}
    monkeypatch.setattr(backend, "ollama", model)
    answer = client.post("/api/chat", json={"question": "How does repetition help?"}).json()
    assert answer["sources"][0]["id"] == doc["id"]
    assert "[1]" in answer["answer"]
    assert len(calls) == 1
    answer = client.post("/api/chat", json={"question": "quantum mechanics"}).json()
    assert not answer["sources"]
    assert len(calls) == 1


def test_validation_and_browser_guards(client):
    assert client.post("/api/documents", json={"title": " "}).status_code == 422
    assert client.post("/api/documents", json={"title": "Bad URL", "url": "javascript:alert(1)"}).status_code == 422
    assert client.post("/api/documents", json={"title": "No"}, headers={"Origin": "https://other.test"}).status_code == 403
    home = client.get("/")
    assert home.status_code == 200
    assert "B-Ram" in home.text
    assert "frame-ancestors 'none'" in home.headers["content-security-policy"]
    assert client.get("/static/app.js").status_code == 200
    assert client.get("/", headers={"Host": "attacker.example"}).status_code == 400


def test_chunking_preserves_long_text():
    text = "a " * 4000
    chunks = backend.chunks_for(text)
    assert len(chunks) > 3
    assert all(0 < len(chunk) <= 1200 for chunk in chunks)
    assert backend.chunks_for("") == []
