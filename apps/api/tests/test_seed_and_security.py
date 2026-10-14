import uuid
import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient

from app.db.base import Base
from app.db.seed import seed_database
from app.db.session import get_db
from app.main import app
from app.models import AuditEvent, Bid, Evidence, Membership, Organization, Tender, User
from app.models.enums import ApprovalState, BidStage, ComplianceStatus, Role, TenderLifecycle


@pytest.fixture()
def seeded_db():
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        seed_database(session)
        yield session


def test_seed_creates_all_three_scenarios(seeded_db):
    org_a = seeded_db.scalar(select(Organization).where(Organization.id == uuid.UUID("11111111-1111-1111-1111-111111111111")))
    org_b = seeded_db.scalar(select(Organization).where(Organization.id == uuid.UUID("22222222-2222-2222-2222-222222222222")))
    assert org_a is not None
    assert org_b is not None
    assert "Apex Healthcare" in org_a.name
    assert "Delta Engineering" in org_b.name

    # Scenario A: Valid evidence
    ev_a = seeded_db.scalars(select(Evidence).where(Evidence.organization_id == org_a.id)).all()
    assert len(ev_a) == 3
    assert all(e.approval_state == ApprovalState.APPROVED for e in ev_a)

    # Scenario B: Expired evidence
    ev_b = seeded_db.scalars(select(Evidence).where(Evidence.organization_id == org_b.id)).all()
    assert len(ev_b) == 1
    assert ev_b[0].approval_state == ApprovalState.REJECTED

    # Scenario C: Amended tender
    tender_c = seeded_db.scalar(select(Tender).where(Tender.id == uuid.UUID("cccccccc-cccc-cccc-cccc-cccccccccccc")))
    assert tender_c is not None
    assert tender_c.lifecycle_status == TenderLifecycle.AMENDED
    assert len(tender_c.deadline_history) == 2


def test_tenant_isolation_org_a_cannot_see_org_b(client, make_member):
    org_a_headers = make_member("Hospital Supplies Org A")
    org_b_headers = make_member("IT Solutions Org B")

    # Org A creates private tender
    payload = {
        "title": "Private Security Services RFP",
        "buyer_name": "Private Commercial Bank",
        "reference_number": "SEC-2026-PRIV",
    }
    r = client.post("/api/v1/tenders", json=payload, headers=org_a_headers)
    assert r.status_code == 201
    tender_id = r.json()["id"]

    # Org A sees it
    assert client.get(f"/api/v1/tenders/{tender_id}", headers=org_a_headers).status_code == 200

    # Org B receives 404 (strictly isolated)
    assert client.get(f"/api/v1/tenders/{tender_id}", headers=org_b_headers).status_code == 404


def test_rbac_viewer_cannot_create_tender(client, session_factory):
    with session_factory() as s:
        org = Organization(name="Viewer Org")
        user = User(email=f"{uuid.uuid4().hex}@example.com")
        s.add_all([org, user])
        s.flush()
        s.add(Membership(organization_id=org.id, user_id=user.id, role=Role.VIEWER))
        s.commit()
        viewer_headers = {"X-Org-Id": str(org.id), "X-User-Id": str(user.id)}

    payload = {
        "title": "Unauthorized Tender Creation Attempt",
        "buyer_name": "City Council",
        "reference_number": "UNAUTH-01",
    }
    r = client.post("/api/v1/tenders", json=payload, headers=viewer_headers)
    assert r.status_code == 403
    assert "Permission denied: role 'viewer'" in r.json()["detail"]


def test_rbac_bid_manager_can_create_tender(client, make_member):
    manager_headers = make_member("Authorized Supplier Co")
    payload = {
        "title": "Authorized Medical Equipment Supply",
        "buyer_name": "City Health Department",
        "reference_number": "AUTH-MED-01",
    }
    r = client.post("/api/v1/tenders", json=payload, headers=manager_headers)
    assert r.status_code == 201
    assert r.json()["title"] == payload["title"]


def test_audit_event_logged_on_tender_creation(client, session_factory, make_member):
    manager_headers = make_member("Audited Enterprise")
    payload = {
        "title": "Audited Highway Construction Tender",
        "buyer_name": "National Highway Authority",
        "reference_number": "NHA-HW-2026",
    }
    r = client.post("/api/v1/tenders", json=payload, headers=manager_headers)
    assert r.status_code == 201

    with session_factory() as s:
        events = s.scalars(
            select(AuditEvent).where(
                AuditEvent.action == "tender.create",
                AuditEvent.object_type == "tender",
            )
        ).all()
        assert len(events) >= 1
        last_event = events[-1]
        assert last_event.after["reference_number"] == "NHA-HW-2026"
        assert str(last_event.organization_id) == manager_headers["X-Org-Id"]
