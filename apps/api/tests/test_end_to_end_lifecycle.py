import uuid
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

APEX_ORG_ID = "11111111-1111-1111-1111-111111111111"
VENTILATOR_TENDER_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
VENTILATOR_BID_ID = "aaaaaaaa-bbbb-cccc-dddd-111111111111"

# Authorized Role Headers (from seed.py)
USER_A_EXEC_ID = "11111111-0000-0000-0000-000000000001"  # OWNER_ADMIN
USER_A_BID_ID = "11111111-0000-0000-0000-000000000002"   # BID_MANAGER
USER_A_COMP_ID = "11111111-0000-0000-0000-000000000003"  # COMPLIANCE_REVIEWER

HEADERS_ADMIN = {"X-Org-Id": APEX_ORG_ID, "X-User-Id": USER_A_EXEC_ID}
HEADERS_BID_MGR = {"X-Org-Id": APEX_ORG_ID, "X-User-Id": USER_A_BID_ID}
HEADERS_COMP = {"X-Org-Id": APEX_ORG_ID, "X-User-Id": USER_A_COMP_ID}


@pytest.fixture(autouse=True)
def reset_lifecycle_state():
    client.put(
        f"/api/v1/bids/{VENTILATOR_BID_ID}/stage?organization_id={APEX_ORG_ID}",
        json={"stage": "discovered"},
    )
    yield


def test_complete_end_to_end_tender_lifecycle():
    """
    CANONICAL END-TO-END VERIFICATION:
    Find -> Evaluate -> Decide -> Prepare -> Approve -> Submit -> Track outcome
    Verifies functional correctness and compliance with Rules 1, 2, 3, 4, 6, 7, 8, 10, 11, 14.
    """

    # -------------------------------------------------------------------------
    # 1. FIND (Tender Discovery & Search)
    # -------------------------------------------------------------------------
    search_res = client.get(
        "/api/v1/tenders?q=Ventilator&category=Medical Equipment&country=PK",
        headers=HEADERS_BID_MGR,
    )
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert search_data["total"] >= 1
    found_tender = next(t for t in search_data["items"] if t["id"] == VENTILATOR_TENDER_ID)
    assert found_tender["reference_number"] == "FTH-ICU-2026-088"
    assert "stale" in found_tender

    # -------------------------------------------------------------------------
    # 2. EVALUATE (Compliance Matrix & Vault Evidence Mapping)
    # -------------------------------------------------------------------------
    matrix_res = client.get(f"/api/v1/compliance/matrix/{VENTILATOR_TENDER_ID}?organization_id={APEX_ORG_ID}")
    assert matrix_res.status_code == 200
    matrix = matrix_res.json()
    assert matrix["total_requirements"] >= 3
    assert matrix["mandatory_count"] >= 1
    assert matrix["eligibility_status"] in ["potentially_eligible", "undetermined"]

    # Test Rule 6: Attempting 'not_applicable' without justification must fail
    first_req_id = matrix["rows"][0]["requirement_id"]
    na_fail_res = client.put(
        f"/api/v1/compliance/assessments/{first_req_id}?organization_id={APEX_ORG_ID}",
        json={"reviewer_status": "not_applicable", "not_applicable_justification": ""},
    )
    assert na_fail_res.status_code == 422
    assert "RULE 6" in na_fail_res.json()["detail"]

    # -------------------------------------------------------------------------
    # 3. DECIDE (Bid/No-Bid Decision Gate)
    # -------------------------------------------------------------------------
    decision_res = client.put(
        f"/api/v1/bids/{VENTILATOR_BID_ID}/decision?organization_id={APEX_ORG_ID}",
        json={
            "decision": "bid",
            "decision_rationale": "High clinical margin, certified warehouse stock, and strategic hospital buyer alignment.",
        },
    )
    assert decision_res.status_code == 200
    assert decision_res.json()["decision"] == "bid"
    assert decision_res.json()["stage"] == "participation_approved"

    # Advance stage to preparing
    stage_res = client.put(
        f"/api/v1/bids/{VENTILATOR_BID_ID}/stage?organization_id={APEX_ORG_ID}",
        json={"stage": "preparing"},
    )
    assert stage_res.status_code == 200

    # -------------------------------------------------------------------------
    # 4. PREPARE (AI Proposal Builder, Citations & Rule 8 Decimal Pricing)
    # -------------------------------------------------------------------------
    # A. Init & Generate Grounded Proposal
    prop_res = client.post(
        f"/api/v1/proposals?organization_id={APEX_ORG_ID}",
        json={"bid_id": VENTILATOR_BID_ID, "title": "ICU Ventilators Full Proposal Package"},
    )
    assert prop_res.status_code == 200
    prop_id = prop_res.json()["id"]

    gen_res = client.post(
        f"/api/v1/proposals/{prop_id}/generate?organization_id={APEX_ORG_ID}",
        json={"regenerate": True},
    )
    assert gen_res.status_code == 200
    prop_data = gen_res.json()
    assert prop_data["citations_count"] >= 1
    assert len(prop_data["sections"]) == 7

    # B. Test Rule 10 Two-Envelope Segregation
    tech_pkg = client.get(
        f"/api/v1/proposals/{prop_id}/export?envelope_type=technical&organization_id={APEX_ORG_ID}"
    ).json()
    assert tech_pkg["envelope_type"] == "technical"
    assert "commercial_schedule" not in [s["section_key"] for s in tech_pkg["sections"]]
    assert len(tech_pkg["manifest_hash"]) == 64

    # C. Rule 8 Pricing Calculation
    pricing_res = client.post(
        "/api/v1/bids/pricing/calculate?currency=PKR",
        json=[
            {
                "item_code": "VENT-X1",
                "description": "Invasive ICU Ventilator",
                "quantity": 10,
                "unit": "Units",
                "unit_cost": 3000000.00,
                "selling_price": 4500000.00,
                "tax_rate_percent": 18.0,
            }
        ],
    )
    assert pricing_res.status_code == 200
    pricing = pricing_res.json()
    assert Decimal(str(pricing["subtotal_net"])) == Decimal("45000000.00")
    assert Decimal(str(pricing["total_tax"])) == Decimal("8100000.00")
    assert Decimal(str(pricing["grand_total"])) == Decimal("53100000.00")
    assert Decimal(str(pricing["bid_security_amount"])) == Decimal("1062000.00")

    # -------------------------------------------------------------------------
    # 5. APPROVE (Sequential 4-Step Approval & Invalidation Safeguard)
    # -------------------------------------------------------------------------
    steps = client.get(f"/api/v1/approvals/{VENTILATOR_BID_ID}?organization_id={APEX_ORG_ID}").json()
    assert len(steps) == 4

    # Step 1: Technical sign-off by Bid Manager / Technical Contributor
    s1 = steps[0]
    act1 = client.post(
        f"/api/v1/approvals/{VENTILATOR_BID_ID}/steps/{s1['id']}/action?organization_id={APEX_ORG_ID}",
        headers=HEADERS_BID_MGR,
        json={"action": "approved", "notes": "Technical scope vetted against DRAP requirements"},
    )
    assert act1.status_code == 200

    # Step 2: Commercial sign-off by Admin
    s2 = steps[1]
    act2 = client.post(
        f"/api/v1/approvals/{VENTILATOR_BID_ID}/steps/{s2['id']}/action?organization_id={APEX_ORG_ID}",
        headers=HEADERS_ADMIN,
        json={"action": "approved", "notes": "Commercial pricing schedule approved"},
    )
    assert act2.status_code == 200

    # Test Rule 11 Invalidation Safeguard: if step 2 requests changes, downstream invalidated
    inval_act = client.post(
        f"/api/v1/approvals/{VENTILATOR_BID_ID}/steps/{s2['id']}/action?organization_id={APEX_ORG_ID}",
        headers=HEADERS_ADMIN,
        json={"action": "changes_requested", "notes": "Recalculate warranty margin"},
    )
    assert inval_act.status_code == 200

    # Verify downstream step 3 and 4 are invalidated
    refreshed_steps = client.get(f"/api/v1/approvals/{VENTILATOR_BID_ID}?organization_id={APEX_ORG_ID}").json()
    assert refreshed_steps[2]["is_invalidated"] is True

    # Re-approve Step 2, Step 3, Step 4
    client.post(
        f"/api/v1/approvals/{VENTILATOR_BID_ID}/steps/{s2['id']}/action?organization_id={APEX_ORG_ID}",
        headers=HEADERS_ADMIN,
        json={"action": "approved", "notes": "Margin updated and approved"},
    )
    s3 = refreshed_steps[2]
    client.post(
        f"/api/v1/approvals/{VENTILATOR_BID_ID}/steps/{s3['id']}/action?organization_id={APEX_ORG_ID}",
        headers=HEADERS_COMP,
        json={"action": "approved", "notes": "Legal & vault evidence compliance audit cleared"},
    )
    s4 = refreshed_steps[3]
    act4 = client.post(
        f"/api/v1/approvals/{VENTILATOR_BID_ID}/steps/{s4['id']}/action?organization_id={APEX_ORG_ID}",
        headers=HEADERS_ADMIN,
        json={"action": "approved", "notes": "CEO final submission approval granted", "approver_name": "Mustafa Khan"},
    )
    assert act4.status_code == 200

    # Verify bid stage transitioned to approved_to_submit
    bid_check = client.get(f"/api/v1/bids/{VENTILATOR_BID_ID}?organization_id={APEX_ORG_ID}").json()
    assert bid_check["stage"] == "approved_to_submit"

    # -------------------------------------------------------------------------
    # 6. SUBMIT (Pre-Flight Checklist & Sealed Package Execution)
    # -------------------------------------------------------------------------
    checklist = client.get(f"/api/v1/approvals/{VENTILATOR_BID_ID}/checklist?organization_id={APEX_ORG_ID}").json()
    assert checklist["all_approvals_cleared"] is True
    assert checklist["can_submit"] is True

    # Execute Final Submission Gate
    sub_res = client.post(
        f"/api/v1/approvals/{VENTILATOR_BID_ID}/submit?organization_id={APEX_ORG_ID}",
        json={"submitted_by_name": "Mustafa Khan (Authorized CEO)", "declaration_accepted": True},
    )
    assert sub_res.status_code == 200
    receipt = sub_res.json()
    assert receipt["status"] == "submitted"
    assert receipt["submission_reference"].startswith("SUB-")
    assert len(receipt["sha256_package_hash"]) == 64

    # Verify bid status locked as SUBMITTED
    sub_bid = client.get(f"/api/v1/bids/{VENTILATOR_BID_ID}?organization_id={APEX_ORG_ID}").json()
    assert sub_bid["stage"] == "submitted"

    # -------------------------------------------------------------------------
    # 7. TRACK OUTCOME (Debrief, Post-Award Lessons & Win-Rate Analytics)
    # -------------------------------------------------------------------------
    outcome_payload = {
        "outcome_status": "awarded",
        "awarded_amount": 59000000.00,
        "contract_reference": "CTR-E2E-2026-FINAL",
        "winner_name": "Apex Healthcare Technologies Ltd",
        "winning_bid_amount": 59000000.00,
        "technical_score": 98.0,
        "financial_rank": 1,
        "debrief_notes": "Ranked L1 lowest evaluated responsive bidder. Full compliance achieved.",
        "lessons_learned": "ISO 13485 certification and prompt submission gave decisive lead.",
    }
    out_res = client.post(
        f"/api/v1/outcomes/{VENTILATOR_BID_ID}?organization_id={APEX_ORG_ID}",
        json=outcome_payload,
    )
    assert out_res.status_code == 200
    assert out_res.json()["outcome_status"] == "awarded"

    # Verify Bid transitioned to AWARDED
    final_bid = client.get(f"/api/v1/bids/{VENTILATOR_BID_ID}?organization_id={APEX_ORG_ID}").json()
    assert final_bid["stage"] == "awarded"

    # Verify Analytics Summary (Rule 14 deterministic win rate)
    analytics = client.get(f"/api/v1/outcomes/analytics/summary?organization_id={APEX_ORG_ID}").json()
    assert analytics["total_participated"] >= 1
    assert analytics["awarded_count"] >= 1
    assert analytics["win_rate_percent"] == 100.0
    assert Decimal(str(analytics["total_awarded_value"])) >= Decimal("59000000.00")

    # Verify Calendar Milestones
    cal = client.get(f"/api/v1/outcomes/calendar/milestones?organization_id={APEX_ORG_ID}").json()
    assert len(cal) >= 1
    assert any(m["event_type"] in ["submission_deadline", "bid_opening"] for m in cal)
