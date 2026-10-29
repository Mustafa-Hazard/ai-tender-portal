import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.seed import seed_database
from app.main import app
from app.models.enums import Role

client = TestClient(app)

ORG_A_ID = "11111111-1111-1111-1111-111111111111"
ORG_B_ID = "22222222-2222-2222-2222-222222222222"
VENTILATOR_BID_ID = "aaaaaaaa-bbbb-cccc-dddd-111111111111"

# From seed.py:
USER_A_EXEC_ID = "11111111-0000-0000-0000-000000000001"  # OWNER_ADMIN
USER_A_BID_ID = "11111111-0000-0000-0000-000000000002"   # BID_MANAGER
USER_A_COMP_ID = "11111111-0000-0000-0000-000000000003"  # COMPLIANCE_REVIEWER
USER_B_EXEC_ID = "22222222-0000-0000-0000-000000000001"  # Org B member


def test_cross_tenant_access_is_forbidden():
    # User from Org B sends their valid headers but targets Org A's bid approval
    headers_org_b = {
        "X-Org-Id": ORG_B_ID,
        "X-User-Id": USER_B_EXEC_ID,
    }
    steps = client.get(f"/api/v1/approvals/{VENTILATOR_BID_ID}?organization_id={ORG_A_ID}").json()
    step_id = steps[0]["id"]

    res = client.post(
        f"/api/v1/approvals/{VENTILATOR_BID_ID}/steps/{step_id}/action?organization_id={ORG_A_ID}",
        headers=headers_org_b,
        json={"action": "approved", "notes": "Cross-tenant intrusion attempt"},
    )
    assert res.status_code == 403
    assert "Cross-tenant" in res.json()["detail"]


def test_rbac_compliance_reviewer_boundary():
    # Compliance reviewer in Org A can approve Step 3 (legal_compliance)
    headers_comp = {
        "X-Org-Id": ORG_A_ID,
        "X-User-Id": USER_A_COMP_ID,
    }
    steps = client.get(f"/api/v1/approvals/{VENTILATOR_BID_ID}?organization_id={ORG_A_ID}").json()
    step3_id = steps[2]["id"]  # legal_compliance
    step4_id = steps[3]["id"]  # final executive sign-off

    # 1. Compliance reviewer approves Step 3 -> SUCCESS (200)
    res_comp_ok = client.post(
        f"/api/v1/approvals/{VENTILATOR_BID_ID}/steps/{step3_id}/action?organization_id={ORG_A_ID}",
        headers=headers_comp,
        json={"action": "approved", "notes": "Statutory ISO & DRAP audit verified"},
    )
    assert res_comp_ok.status_code == 200
    assert res_comp_ok.json()["status"] == "approved"

    # 2. Compliance reviewer attempts to sign off on Step 4 (Final executive authorization) -> FORBIDDEN (403)
    res_comp_fail = client.post(
        f"/api/v1/approvals/{VENTILATOR_BID_ID}/steps/{step4_id}/action?organization_id={ORG_A_ID}",
        headers=headers_comp,
        json={"action": "approved", "notes": "Unauthorized final executive sign-off attempt"},
    )
    assert res_comp_fail.status_code == 403
    assert "Permission denied" in res_comp_fail.json()["detail"]


def test_rbac_bid_manager_role_boundary():
    # Bid manager can approve Step 1 (technical) but cannot authorize Step 4 (final CEO sign-off)
    headers_bid_mgr = {
        "X-Org-Id": ORG_A_ID,
        "X-User-Id": USER_A_BID_ID,
    }
    steps = client.get(f"/api/v1/approvals/{VENTILATOR_BID_ID}?organization_id={ORG_A_ID}").json()
    step1_id = steps[0]["id"]  # technical
    step4_id = steps[3]["id"]  # final

    # 1. Bid Manager approves Step 1 -> SUCCESS (200)
    res_mgr_ok = client.post(
        f"/api/v1/approvals/{VENTILATOR_BID_ID}/steps/{step1_id}/action?organization_id={ORG_A_ID}",
        headers=headers_bid_mgr,
        json={"action": "approved", "notes": "Bid manager scope clearance"},
    )
    assert res_mgr_ok.status_code == 200
    assert res_mgr_ok.json()["status"] == "approved"

    # 2. Bid Manager tries to authorize Step 4 (Final CEO authorization) -> FORBIDDEN (403)
    res_mgr_final = client.post(
        f"/api/v1/approvals/{VENTILATOR_BID_ID}/steps/{step4_id}/action?organization_id={ORG_A_ID}",
        headers=headers_bid_mgr,
        json={"action": "approved", "notes": "Unauthorized final sign-off"},
    )
    assert res_mgr_final.status_code == 403
    assert "Permission denied" in res_mgr_final.json()["detail"]


def test_rbac_owner_admin_can_approve_any_step():
    headers_admin = {
        "X-Org-Id": ORG_A_ID,
        "X-User-Id": USER_A_EXEC_ID,
    }
    steps = client.get(f"/api/v1/approvals/{VENTILATOR_BID_ID}?organization_id={ORG_A_ID}").json()
    step4_id = steps[3]["id"]  # final executive sign-off

    res_admin = client.post(
        f"/api/v1/approvals/{VENTILATOR_BID_ID}/steps/{step4_id}/action?organization_id={ORG_A_ID}",
        headers=headers_admin,
        json={"action": "approved", "notes": "Executive authority granted", "approver_name": "Mustafa Khan"},
    )
    assert res_admin.status_code == 200
    assert res_admin.json()["status"] == "approved"
