import uuid
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.enums import BidStage

client = TestClient(app)

APEX_ORG_ID = "11111111-1111-1111-1111-111111111111"
VENTILATOR_BID_ID = "aaaaaaaa-bbbb-cccc-dddd-111111111111"


@pytest.fixture(autouse=True)
def reset_bid_state():
    # Reset bid to preparing before each test
    client.put(
        f"/api/v1/bids/{VENTILATOR_BID_ID}/stage?organization_id={APEX_ORG_ID}",
        json={"stage": "preparing"},
    )
    # Reset approval steps to pending
    steps = client.get(f"/api/v1/approvals/{VENTILATOR_BID_ID}?organization_id={APEX_ORG_ID}").json()
    for s in steps:
        if s["status"] != "pending":
            client.post(
                f"/api/v1/approvals/{VENTILATOR_BID_ID}/steps/{s['id']}/action?organization_id={APEX_ORG_ID}",
                json={"action": "changes_requested", "notes": "Reset for test fixture."},
            )
    yield


def test_approval_workflow_lifecycle_and_invalidation():
    # 1. Get or init workflow
    wf_res = client.get(f"/api/v1/approvals/{VENTILATOR_BID_ID}?organization_id={APEX_ORG_ID}")
    assert wf_res.status_code == 200
    steps = wf_res.json()
    assert len(steps) == 4
    assert steps[0]["flow_type"] == "technical"
    assert steps[1]["flow_type"] == "commercial"
    assert steps[2]["flow_type"] == "legal_compliance"
    assert steps[3]["flow_type"] == "final"

    # 2. Approve step 1 (Technical)
    step1_id = steps[0]["id"]
    act1 = client.post(
        f"/api/v1/approvals/{VENTILATOR_BID_ID}/steps/{step1_id}/action?organization_id={APEX_ORG_ID}",
        json={
            "action": "approved",
            "notes": "Verified medical equipment specifications against DRAP standards.",
            "approver_name": "Dr. Tariq Mahmood",
        },
    )
    assert act1.status_code == 200
    assert act1.json()["status"] == "approved"

    # 3. Check pre-flight checklist: should be blocked because steps 2, 3, 4 are still pending
    chk_res = client.get(f"/api/v1/approvals/{VENTILATOR_BID_ID}/checklist?organization_id={APEX_ORG_ID}")
    assert chk_res.status_code == 200
    chk_data = chk_res.json()
    assert chk_data["can_submit"] is False
    assert any("approvals incomplete" in b.lower() for b in chk_data["blockers"])


def test_complete_all_approvals_and_finalize_submission():
    # 1. Fetch steps
    steps = client.get(f"/api/v1/approvals/{VENTILATOR_BID_ID}?organization_id={APEX_ORG_ID}").json()

    # 2. Approve all 4 steps
    for step in steps:
        act_res = client.post(
            f"/api/v1/approvals/{VENTILATOR_BID_ID}/steps/{step['id']}/action?organization_id={APEX_ORG_ID}",
            json={
                "action": "approved",
                "notes": f"Officially authorized sign-off for {step['step_name']}.",
                "approver_name": "Executive Signatory",
            },
        )
        assert act_res.status_code == 200

    # 3. Verify checklist is now cleared
    chk_res = client.get(f"/api/v1/approvals/{VENTILATOR_BID_ID}/checklist?organization_id={APEX_ORG_ID}")
    chk_data = chk_res.json()
    assert chk_data["all_approvals_cleared"] is True
    assert chk_data["can_submit"] is True

    # 4. Finalize submission
    sub_res = client.post(
        f"/api/v1/approvals/{VENTILATOR_BID_ID}/submit?organization_id={APEX_ORG_ID}",
        json={"submitted_by_name": "Mustafa Muhammad (CEO)", "declaration_accepted": True},
    )
    assert sub_res.status_code == 200
    receipt = sub_res.json()
    assert receipt["submission_reference"].startswith("SUB-")
    assert len(receipt["sha256_package_hash"]) == 64
    assert receipt["status"] == "submitted"

    # 5. Confirm bid stage transitioned to submitted
    bid_res = client.get(f"/api/v1/bids/{VENTILATOR_BID_ID}?organization_id={APEX_ORG_ID}")
    assert bid_res.json()["stage"] == "submitted"
