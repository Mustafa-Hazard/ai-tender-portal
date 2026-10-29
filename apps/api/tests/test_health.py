from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_openapi_schema_generation():
    schema = app.openapi()
    assert schema["info"]["title"] == "AI Tender Portal API"
    assert len(schema["paths"]) >= 20

    # Verify all core tags exist across registered endpoints
    all_tags = set()
    for path, methods in schema["paths"].items():
        for method, details in methods.items():
            if isinstance(details, dict) and "tags" in details:
                all_tags.update(details["tags"])

    for required_tag in ["tenders", "compliance", "vault", "bids", "approvals", "outcomes", "proposals"]:
        assert required_tag in all_tags, f"Tag '{required_tag}' missing from OpenAPI endpoints"
