from decimal import Decimal
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

APEX_ORG_ID = "11111111-1111-1111-1111-111111111111"
VENTILATOR_BID_ID = "aaaaaaaa-bbbb-cccc-dddd-111111111111"


def test_list_bids():
    res = client.get(f"/api/v1/bids?organization_id={APEX_ORG_ID}")
    assert res.status_code == 200
    bids = res.json()
    assert len(bids) >= 1
    assert any(b["id"] == VENTILATOR_BID_ID for b in bids)


def test_update_bid_stage_and_decision():
    # 1. Update decision with justification
    dec_payload = {
        "decision": "bid",
        "decision_rationale": "High strategic alignment and verified manufacturing capacity for ICU equipment.",
    }
    dec_res = client.put(
        f"/api/v1/bids/{VENTILATOR_BID_ID}/decision?organization_id={APEX_ORG_ID}",
        json=dec_payload,
    )
    assert dec_res.status_code == 200
    dec_data = dec_res.json()
    assert dec_data["decision"] == "bid"
    assert dec_data["decision_rationale"] == dec_payload["decision_rationale"]

    # 2. Update stage
    stage_res = client.put(
        f"/api/v1/bids/{VENTILATOR_BID_ID}/stage?organization_id={APEX_ORG_ID}",
        json={"stage": "preparing"},
    )
    assert stage_res.status_code == 200
    assert stage_res.json()["stage"] == "preparing"


def test_bid_tasks_lifecycle():
    # 1. Add a task
    task_payload = {
        "title": "Procure Bank Guarantee for Bid Bond (2%)",
        "task_type": "bid_security",
        "status": "todo",
        "notes": "Coordinate with Standard Chartered Bank corporate desk.",
    }
    add_res = client.post(
        f"/api/v1/bids/{VENTILATOR_BID_ID}/tasks?organization_id={APEX_ORG_ID}",
        json=task_payload,
    )
    assert add_res.status_code == 200
    task_data = add_res.json()
    assert task_data["title"] == task_payload["title"]
    task_id = task_data["id"]

    # 2. Update task status
    upd_res = client.put(
        f"/api/v1/bids/tasks/{task_id}?organization_id={APEX_ORG_ID}",
        json={"status": "in_progress"},
    )
    assert upd_res.status_code == 200
    assert upd_res.json()["status"] == "in_progress"

    # 3. Check list of tasks
    list_res = client.get(f"/api/v1/bids/{VENTILATOR_BID_ID}/tasks?organization_id={APEX_ORG_ID}")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1


def test_rule_8_deterministic_decimal_pricing():
    # Test strict decimal math without float rounding artifacts
    payload = [
        {
            "item_code": "ICU-VENT-01",
            "description": "High-End Invasive & Non-Invasive ICU Ventilator Unit",
            "quantity": 10.0,
            "unit": "Units",
            "selling_price": 4500000.00,
            "tax_rate_percent": 18.0,
        },
        {
            "item_code": "CENTRAL-MON-02",
            "description": "Central Multi-Parameter Patient Monitoring Station",
            "quantity": 2.0,
            "unit": "Systems",
            "selling_price": 2500000.00,
            "tax_rate_percent": 18.0,
        },
    ]

    calc_res = client.post("/api/v1/bids/pricing/calculate?currency=PKR", json=payload)
    assert calc_res.status_code == 200
    data = calc_res.json()

    # Net: (10 * 4,500,000) + (2 * 2,500,000) = 45,000,000 + 5,000,000 = 50,000,000
    # Tax: 18% of 50,000,000 = 9,000,000
    # Grand Total: 59,000,000
    # Bid Security (2%): 1,180,000
    assert Decimal(data["subtotal_net"]) == Decimal("50000000.00")
    assert Decimal(data["total_tax"]) == Decimal("9000000.00")
    assert Decimal(data["grand_total"]) == Decimal("59000000.00")
    assert Decimal(data["bid_security_amount"]) == Decimal("1180000.00")
