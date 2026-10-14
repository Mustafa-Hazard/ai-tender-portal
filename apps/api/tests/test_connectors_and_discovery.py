import uuid
from decimal import Decimal

import pytest

from app.models.enums import Role, SourceType
from app.services.connectors import SampleFederalEProcurementConnector, SampleProvincialPortalConnector
from app.services.ingestion import IngestionError, extract_requirements_from_text, ingest_document


def test_connector_sync_and_deduplication(session_factory, member):
    db = session_factory()
    try:
        from app.api.deps import Context
        ctx = Context(
            user_id=uuid.UUID(member["X-User-Id"]),
            organization_id=uuid.UUID(member["X-Org-Id"]),
            role=Role.BID_MANAGER,
        )

        connector = SampleFederalEProcurementConnector()
        assert connector.source_type == SourceType.GOV_PORTAL

        # First sync
        stats1 = connector.sync(db, ctx)
        assert stats1["created"] >= 2
        assert stats1["skipped"] == 0

        # Second sync: deduplication must kick in and skip existing items
        stats2 = connector.sync(db, ctx)
        assert stats2["created"] == 0
        assert stats2["skipped"] >= 2
    finally:
        db.close()


def test_provincial_connector_sync(session_factory, member):
    db = session_factory()
    try:
        from app.api.deps import Context
        ctx = Context(
            user_id=uuid.UUID(member["X-User-Id"]),
            organization_id=uuid.UUID(member["X-Org-Id"]),
            role=Role.BID_MANAGER,
        )

        connector = SampleProvincialPortalConnector()
        stats = connector.sync(db, ctx)
        assert stats["created"] >= 2
    finally:
        db.close()


def test_saved_searches_api(client, member):
    # 1. Create saved search
    payload = {
        "name": "Medical Equipment Federal Tenders",
        "filters": {
            "category": "Medical Equipment",
            "region": "Federal Capital",
            "min_value": 100000000,
        },
        "alert_cadence": "daily_digest",
        "is_active": True,
    }
    res = client.post("/api/v1/saved-searches", json=payload, headers=member)
    assert res.status_code == 201, res.text
    data = res.json()
    search_id = data["id"]
    assert data["name"] == payload["name"]
    assert data["alert_cadence"] == "daily_digest"

    # 2. List saved searches
    res = client.get("/api/v1/saved-searches", headers=member)
    assert res.status_code == 200
    list_data = res.json()
    assert list_data["total"] >= 1
    assert any(s["id"] == search_id for s in list_data["items"])

    # 3. Update saved search
    patch_res = client.patch(
        f"/api/v1/saved-searches/{search_id}",
        json={"alert_cadence": "instant", "name": "Updated Alert Query"},
        headers=member,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["alert_cadence"] == "instant"
    assert patch_res.json()["name"] == "Updated Alert Query"

    # 4. Run saved search
    run_res = client.post(f"/api/v1/saved-searches/{search_id}/run", headers=member)
    assert run_res.status_code == 200
    assert "items" in run_res.json()

    # 5. Delete saved search
    del_res = client.delete(f"/api/v1/saved-searches/{search_id}", headers=member)
    assert del_res.status_code == 204

    # 6. Verify deleted
    get_res = client.get(f"/api/v1/saved-searches/{search_id}", headers=member)
    assert get_res.status_code == 404


def test_connectors_api(client, member):
    res = client.get("/api/v1/connectors", headers=member)
    assert res.status_code == 200
    connectors = res.json()
    assert len(connectors) >= 2
    assert any(c["id"] == "federal-epads" for c in connectors)

    # Sync connector
    sync_res = client.post("/api/v1/connectors/federal-epads/sync", headers=member)
    assert sync_res.status_code == 200
    assert sync_res.json()["status"] == "success"


def test_document_ingestion_and_obligation_extraction(tmp_path, monkeypatch):
    from app.core.config import settings
    monkeypatch.setattr(settings, "storage_dir", str(tmp_path))

    tender_id = uuid.uuid4()
    filename = "Tender_Section_III_Eligibility.txt"
    content = (
        "Bidders shall hold valid DRAP registration for all quoted items.\n\n"
        "The Vendor must maintain local service workshop within 50km radius.\n\n"
        "General company description and introduction paragraph without obligation."
    ).encode("utf-8")

    res = ingest_document(tender_id, filename, content)
    assert res["filename"] == filename
    assert len(res["document_hash"]) == 64
    assert len(res["requirements"]) >= 2
    assert any(r["kind"] == "mandatory" for r in res["requirements"])

    # Test invalid extension
    with pytest.raises(IngestionError, match="Unsupported file extension"):
        ingest_document(tender_id, "malicious.exe", b"fake binary")
