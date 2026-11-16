import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.db.seed import seed_database


@pytest.fixture(scope="module", autouse=True)
def setup_seed():
    db = SessionLocal()
    seed_database(db)
    db.close()


def test_end_to_end_integration_trace():
    client = TestClient(app)
    org_id = "11111111-1111-1111-1111-111111111111"
    user_id = "11111111-0000-0000-0000-000000000002"  # Bid Manager
    headers = {"X-Org-Id": org_id, "X-User-Id": user_id}

    # 1. Health check
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

    # 2. Vault credential upload via POST /api/v1/vault
    res = client.post(
        "/api/v1/vault",
        headers=headers,
        json={
            "title": "ISO 9001:2015 Quality Management",
            "doc_type": "ISO 9001 Certification",
            "issuer": "Bureau Veritas",
            "issued_on": "2025-01-01",
            "expires_on": "2027-01-01",
            "jurisdiction": "Pakistan",
            "approval_state": "approved",
        },
    )
    assert res.status_code == 200, res.text
    doc_id = res.json()["id"]

    # 3. Vault query verification via GET /api/v1/vault
    res = client.get("/api/v1/vault", headers=headers)
    assert res.status_code == 200
    docs = res.json()["items"]
    assert any(d["id"] == doc_id for d in docs)

    # 4. Deterministic pricing calculation (Rule 8)
    res = client.post(
        "/api/v1/bids/pricing/calculate?bid_security_rate_percent=2.0",
        headers=headers,
        json=[
            {
                "item_code": "VENT-01",
                "description": "ICU Ventilator Unit",
                "quantity": 5,
                "unit": "Unit",
                "unit_cost": 2000000.0,
                "selling_price": 2500000.0,
                "tax_rate_percent": 18.0,
            }
        ],
    )
    assert res.status_code == 200
    pricing = res.json()
    assert float(pricing["subtotal_net"]) == 12500000.0
    assert float(pricing["total_tax"]) == 2250000.0
    assert float(pricing["grand_total"]) == 14750000.0
    assert float(pricing["bid_security_amount"]) == 295000.0

    # 5. Bid retrieval and decision recording
    res = client.get("/api/v1/bids", headers=headers)
    assert res.status_code == 200
    bids = res.json()
    assert len(bids) > 0
    bid_id = bids[0]["id"]

    res = client.put(
        f"/api/v1/bids/{bid_id}/decision",
        headers=headers,
        json={
            "decision": "bid",
            "decision_rationale": "High margin opportunity aligned with medical device core capabilities.",
        },
    )
    assert res.status_code == 200
    assert res.json()["decision"] == "bid"

    # 6. Saved search creation, listing, and execution
    res = client.post(
        "/api/v1/saved-searches",
        headers=headers,
        json={
            "name": "Live Ventilator Alerts",
            "filters": {"category": "Medical Equipment"},
            "alert_cadence": "instant",
            "is_active": True,
        },
    )
    assert res.status_code == 201
    search_id = res.json()["id"]

    res = client.get("/api/v1/saved-searches", headers=headers)
    assert res.status_code == 200
    assert any(s["id"] == search_id for s in res.json()["items"])

    res = client.post(f"/api/v1/saved-searches/{search_id}/run", headers=headers)
    assert res.status_code == 200

    # 7. Connector sync trigger
    res = client.get("/api/v1/connectors", headers=headers)
    assert res.status_code == 200
    connectors = res.json()
    assert len(connectors) > 0
    conn_id = connectors[0]["id"]

    res = client.post(f"/api/v1/connectors/{conn_id}/sync", headers=headers)
    assert res.status_code == 200

    # Clean up created search & doc
    client.delete(f"/api/v1/saved-searches/{search_id}", headers=headers)
    client.delete(f"/api/v1/vault/{doc_id}", headers=headers)
