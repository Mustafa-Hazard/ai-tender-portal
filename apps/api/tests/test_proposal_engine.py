import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

APEX_ORG_ID = "11111111-1111-1111-1111-111111111111"
VENTILATOR_BID_ID = "aaaaaaaa-bbbb-cccc-dddd-111111111111"


def test_init_and_get_proposal():
    # 1. Initialize proposal for the ventilator bid
    init_res = client.post(
        f"/api/v1/proposals?organization_id={APEX_ORG_ID}",
        json={"bid_id": VENTILATOR_BID_ID, "title": "ICU Ventilator Turnkey Proposal"},
    )
    assert init_res.status_code == 200
    prop = init_res.json()
    assert prop["bid_id"] == VENTILATOR_BID_ID
    assert prop["organization_id"] == APEX_ORG_ID
    assert len(prop["sections"]) == 7

    # Verify canonical sections and envelope types
    sec_keys = {s["section_key"]: s["envelope_type"] for s in prop["sections"]}
    assert sec_keys["cover_letter"] == "general"
    assert sec_keys["executive_summary"] == "technical"
    assert sec_keys["technical_response"] == "technical"
    assert sec_keys["compliance_matrix"] == "technical"
    assert sec_keys["methodology_and_delivery"] == "technical"
    assert sec_keys["commercial_schedule"] == "commercial"  # Segregated under Rule 10
    assert sec_keys["declarations_and_legal"] == "general"

    prop_id = prop["id"]

    # 2. Get proposal by ID
    get_res = client.get(f"/api/v1/proposals/{prop_id}?organization_id={APEX_ORG_ID}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == prop_id


def test_generate_proposal_with_grounding_and_placeholders():
    # 1. Ensure proposal initialized
    init_res = client.post(
        f"/api/v1/proposals?organization_id={APEX_ORG_ID}",
        json={"bid_id": VENTILATOR_BID_ID},
    )
    prop_id = init_res.json()["id"]

    # 2. Generate grounded content
    gen_res = client.post(
        f"/api/v1/proposals/{prop_id}/generate?organization_id={APEX_ORG_ID}",
        json={"regenerate": True},
    )
    assert gen_res.status_code == 200
    prop_data = gen_res.json()
    assert prop_data["status"] == "in_review"
    assert prop_data["version"] >= 2
    assert prop_data["citations_count"] >= 1

    # Inspect technical_response section
    tech_sec = next(s for s in prop_data["sections"] if s["section_key"] == "technical_response")
    assert tech_sec["is_ai_generated"] is True
    assert len(tech_sec["citations"]) >= 1

    # Verified citations grounded in vault documents
    assert "ISO 13485" in tech_sec["content"]
    assert "Active Taxpayer" in tech_sec["content"]
    assert "Audited Accounts" in tech_sec["content"]


def test_rule_10_two_envelope_export_segregation():
    # 1. Get proposal
    init_res = client.post(
        f"/api/v1/proposals?organization_id={APEX_ORG_ID}",
        json={"bid_id": VENTILATOR_BID_ID},
    )
    prop_id = init_res.json()["id"]

    # 2. Generate content first
    client.post(
        f"/api/v1/proposals/{prop_id}/generate?organization_id={APEX_ORG_ID}",
        json={"regenerate": True},
    )

    # 3. Export TECHNICAL envelope
    tech_export_res = client.get(
        f"/api/v1/proposals/{prop_id}/export?envelope_type=technical&organization_id={APEX_ORG_ID}"
    )
    assert tech_export_res.status_code == 200
    tech_pkg = tech_export_res.json()
    assert tech_pkg["envelope_type"] == "technical"
    assert len(tech_pkg["manifest_hash"]) == 64

    # CRITICAL RULE 10: Technical package must NEVER include commercial section
    tech_sec_keys = [s["section_key"] for s in tech_pkg["sections"]]
    assert "commercial_schedule" not in tech_sec_keys
    assert any("Commercial" in exc for exc in tech_pkg["excluded_sections"])
    assert "RESTRICTED FINANCIAL ENVELOPE" not in tech_pkg["rendered_package_text"]

    # 4. Export COMMERCIAL envelope
    comm_export_res = client.get(
        f"/api/v1/proposals/{prop_id}/export?envelope_type=commercial&organization_id={APEX_ORG_ID}"
    )
    assert comm_export_res.status_code == 200
    comm_pkg = comm_export_res.json()
    assert comm_pkg["envelope_type"] == "commercial"
    comm_sec_keys = [s["section_key"] for s in comm_pkg["sections"]]
    assert "commercial_schedule" in comm_sec_keys


def test_edit_proposal_section():
    init_res = client.post(
        f"/api/v1/proposals?organization_id={APEX_ORG_ID}",
        json={"bid_id": VENTILATOR_BID_ID},
    )
    prop = init_res.json()
    prop_id = prop["id"]
    sec_id = prop["sections"][0]["id"]

    edit_res = client.put(
        f"/api/v1/proposals/{prop_id}/sections/{sec_id}?organization_id={APEX_ORG_ID}",
        json={
            "content": "Custom vetted executive transmittal content approved by legal officer.",
            "status": "approved",
        },
    )
    assert edit_res.status_code == 200
    updated = edit_res.json()
    assert updated["content"] == "Custom vetted executive transmittal content approved by legal officer."
    assert updated["status"] == "approved"
