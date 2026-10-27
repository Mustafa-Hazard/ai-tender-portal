import uuid
from datetime import date, timedelta
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.enums import ComplianceStatus, RequirementKind

client = TestClient(app)

APEX_ORG_ID = "11111111-1111-1111-1111-111111111111"
DELTA_ORG_ID = "22222222-2222-2222-2222-222222222222"
VENTILATOR_TENDER_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"


def test_vault_list_and_create():
    # 1. List existing evidence for Apex
    res = client.get(f"/api/v1/vault?organization_id={APEX_ORG_ID}")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 3
    assert "items" in data

    # 2. Upload new evidence
    new_doc = {
        "doc_type": "ISO 27001 Security Certificate",
        "title": "ISO 27001:2022 Apex Cyber Security Accreditation",
        "issuer": "BSI Global",
        "issued_on": "2026-01-15",
        "expires_on": "2029-01-15",
        "jurisdiction": "Global",
        "confidentiality": "internal",
    }
    create_res = client.post(f"/api/v1/vault?organization_id={APEX_ORG_ID}", json=new_doc)
    assert create_res.status_code == 200
    created = create_res.json()
    assert created["title"] == new_doc["title"]
    assert created["is_expired"] is False
    assert created["days_to_expiry"] > 365

    # 3. Clean up by deleting
    del_res = client.delete(f"/api/v1/vault/{created['id']}?organization_id={APEX_ORG_ID}")
    assert del_res.status_code == 200


def test_compliance_matrix_scenario_a_potentially_eligible():
    # Apex on Ventilator Tender has all 3 requirements met with valid, unexpired evidence
    res = client.get(f"/api/v1/compliance/matrix/{VENTILATOR_TENDER_ID}?organization_id={APEX_ORG_ID}")
    assert res.status_code == 200
    data = res.json()
    assert data["tender_title"]
    assert data["total_requirements"] == 3
    assert data["mandatory_count"] == 3
    assert data["mandatory_met_count"] == 3
    assert data["is_mandatory_eligible"] is True
    assert data["eligibility_status"] == "potentially_eligible"
    assert len(data["blockers"]) == 0
    assert data["coverage_percent"] == 100


def test_rule_6_not_applicable_requires_justification():
    # Fetch matrix to get requirement ID
    res = client.get(f"/api/v1/compliance/matrix/{VENTILATOR_TENDER_ID}?organization_id={APEX_ORG_ID}")
    row = res.json()["rows"][0]
    req_id = row["requirement_id"]

    # Attempt to set NOT_APPLICABLE without justification -> Must fail with 422
    fail_res = client.put(
        f"/api/v1/compliance/assessments/{req_id}?organization_id={APEX_ORG_ID}",
        json={
            "reviewer_status": "not_applicable",
            "not_applicable_justification": "",
        },
    )
    assert fail_res.status_code == 422
    assert "RULE 6 ENFORCEMENT" in fail_res.json()["detail"]

    # Provide valid justification -> Must succeed
    success_res = client.put(
        f"/api/v1/compliance/assessments/{req_id}?organization_id={APEX_ORG_ID}",
        json={
            "reviewer_status": "not_applicable",
            "not_applicable_justification": "Exempt under Federal Statutory Regulatory Order (SRO) 456/2025 for healthcare import suppliers.",
        },
    )
    assert success_res.status_code == 200
    assert success_res.json()["reviewer_status"] == "not_applicable"

    # Reset back to MEETS with evidence
    client.put(
        f"/api/v1/compliance/assessments/{req_id}?organization_id={APEX_ORG_ID}",
        json={
            "reviewer_status": "meets_requirement",
            "evidence_id": row["linked_evidence"]["id"] if row["linked_evidence"] else None,
        },
    )


def test_rule_7_expired_evidence_disqualifies_eligibility():
    # 1. Create an expired certificate in Vault
    past_date = (date.today() - timedelta(days=15)).isoformat()
    expired_doc = {
        "doc_type": "FBR Tax Active Taxpayer Certificate",
        "title": "Expired FBR Registration 2025",
        "issuer": "FBR",
        "issued_on": "2024-01-01",
        "expires_on": past_date,
        "jurisdiction": "Pakistan",
    }
    doc_res = client.post(f"/api/v1/vault?organization_id={APEX_ORG_ID}", json=expired_doc)
    assert doc_res.status_code == 200
    expired_ev_id = doc_res.json()["id"]
    assert doc_res.json()["is_expired"] is True

    # 2. Get first requirement
    matrix_res = client.get(f"/api/v1/compliance/matrix/{VENTILATOR_TENDER_ID}?organization_id={APEX_ORG_ID}")
    req_id = matrix_res.json()["rows"][0]["requirement_id"]
    original_ev_id = matrix_res.json()["rows"][0]["linked_evidence"]["id"]

    # 3. Link the expired evidence to the mandatory requirement and claim MEETS
    client.put(
        f"/api/v1/compliance/assessments/{req_id}?organization_id={APEX_ORG_ID}",
        json={
            "reviewer_status": "meets_requirement",
            "evidence_id": expired_ev_id,
        },
    )

    # 4. Check matrix -> MUST be NOT_ELIGIBLE despite reviewer claiming meets!
    eval_res = client.get(f"/api/v1/compliance/matrix/{VENTILATOR_TENDER_ID}?organization_id={APEX_ORG_ID}")
    eval_data = eval_res.json()
    assert eval_data["is_mandatory_eligible"] is False
    assert eval_data["eligibility_status"] == "not_eligible"
    assert any("expired" in b.lower() and "RULE 7" in b for b in eval_data["blockers"])

    # 5. Restore original unexpired evidence
    client.put(
        f"/api/v1/compliance/assessments/{req_id}?organization_id={APEX_ORG_ID}",
        json={
            "reviewer_status": "meets_requirement",
            "evidence_id": original_ev_id,
        },
    )

    # 6. Delete the temporary test doc
    client.delete(f"/api/v1/vault/{expired_ev_id}?organization_id={APEX_ORG_ID}")
