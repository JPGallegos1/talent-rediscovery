import pytest
from httpx import AsyncClient, ASGITransport

from app.main import create_app


@pytest.fixture
def app():
    return create_app()


@pytest.mark.anyio
async def test_health_endpoint(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.anyio
async def test_retrieve_memory_with_context(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/memory/retrieve",
            json={
                "context": {
                    "candidate_id": "candidate_1",
                    "records": [
                        {
                            "id": "record_1",
                            "skills": ["React", "TypeScript"],
                            "industries": ["fintech"],
                        }
                    ],
                    "notes": [
                        {"id": "note_1", "content": "Strong communicator"}
                    ],
                    "search_request": "React developer",
                }
            },
        )
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "extracted_fields" in data
    assert len(data["extracted_fields"]) >= 1


@pytest.mark.anyio
async def test_retrieve_memory_empty(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/memory/retrieve",
            json={
                "context": {
                    "candidate_id": "candidate_1",
                }
            },
        )
    assert response.status_code == 200
    data = response.json()
    assert len(data["extracted_fields"]) == 3


@pytest.mark.anyio
async def test_propose_note(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/memory/propose-note",
            json={
                "context": {
                    "candidate_id": "candidate_1",
                    "records": [{"id": "record_1", "skills": ["Python"]}],
                },
                "raw_input": "Prefers remote work and has good availability",
            },
        )
    assert response.status_code == 200
    data = response.json()
    assert "proposed_note" in data
    assert "confidence" in data
    assert data["source_type"] in ("typed", "transcribed")
