import uuid
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

APEX_ORG_ID = "11111111-1111-1111-1111-111111111111"
VENTILATOR_BID_ID = "aaaaaaaa-bbbb-cccc-dddd-111111111111"


def test_record_and_list_outcome():
    # Record awarded outcome
    payload = {
        "outcome_status": "awarded",
        "awarded_amount": 59000000.00,
        "contract_reference": "CTR-2026-ME-0491",
        "winner_name": "Apex Healthcare Technologies Ltd",
        "winning_bid_amount": 59000000.00,
        "technical_score": 96.5,
        "financial_rank": 1,
        "debrief_notes": "Ranked L1 lowest evaluated responsive bidder. Excellent technical evaluation score.",
        "lessons_learned": "Early engagement on ISO 13485 certification proved decisive against competing bidders.",
    }
    rec_res = client.post(
        f"/api/v1/outcomes/{VENTILATOR_BID_ID}?organization_id={APEX_ORG_ID}",
        json=payload,
    )
    assert rec_res.status_code == 200
    data = rec_res.json()
    assert data["outcome_status"] == "awarded"
    assert Decimal(str(data["awarded_amount"])) == Decimal("59000000.00")
    assert data["contract_reference"] == "CTR-2026-ME-0491"
    assert data["financial_rank"] == 1

    # List outcomes
    list_res = client.get(f"/api/v1/outcomes?organization_id={APEX_ORG_ID}")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1


def test_analytics_and_calendar_endpoints():
    # Analytics summary
    ana_res = client.get(f"/api/v1/outcomes/analytics/summary?organization_id={APEX_ORG_ID}")
    assert ana_res.status_code == 200
    analytics = ana_res.json()
    assert "win_rate_percent" in analytics
    assert "total_awarded_value" in analytics
    assert analytics["disqualification_rate_percent"] == 0.0

    # Calendar milestones
    cal_res = client.get(f"/api/v1/outcomes/calendar/milestones?organization_id={APEX_ORG_ID}")
    assert cal_res.status_code == 200
    events = cal_res.json()
    assert len(events) >= 1
    assert any(e["event_type"] in ["submission_deadline", "bid_opening"] for e in events)


def test_analytics_zero_outcomes_never_invents_win_rate():
    # Enforces Rule 1 & Rule 14: Never invent 66.7% win rate when no outcomes are recorded
    empty_org_id = str(uuid.uuid4())
    res = client.get(f"/api/v1/outcomes/analytics/summary?organization_id={empty_org_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["total_participated"] == 0
    assert data["awarded_count"] == 0
    assert data["lost_count"] == 0
    assert data["win_rate_percent"] == 0.0
    assert data["average_discount_percent"] == 0.0
