from fastapi.testclient import TestClient

from app.main import app

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


def test_cross_tenant_isolation_on_bids_and_vault():
    headers_org_b = {
        "X-Org-Id": ORG_B_ID,
        "X-User-Id": USER_B_EXEC_ID,
    }
    # Org B trying to access Org A's bids via query override must be blocked with 403
    res_bids = client.get(f"/api/v1/bids?organization_id={ORG_A_ID}", headers=headers_org_b)
    assert res_bids.status_code == 403
    assert "Cross-tenant" in res_bids.json()["detail"]

    # Org B trying to access Org A's vault via query override must be blocked with 403
    res_vault = client.get(f"/api/v1/vault?organization_id={ORG_A_ID}", headers=headers_org_b)
    assert res_vault.status_code == 403
    assert "Cross-tenant" in res_vault.json()["detail"]

    # Org B trying to access Org A's compliance matrix via query override must be blocked with 403
    res_matrix = client.get(f"/api/v1/compliance/matrix/{VENTILATOR_BID_ID}?organization_id={ORG_A_ID}", headers=headers_org_b)
    assert res_matrix.status_code == 403
    assert "Cross-tenant" in res_matrix.json()["detail"]


def test_unauthenticated_requests_return_401():
    # Calling tenant-scoped endpoints with no headers or query org must return 401
    assert client.get("/api/v1/organizations/me").status_code == 401
    assert client.get("/api/v1/bids").status_code == 401
    assert client.get("/api/v1/vault").status_code == 401
    assert client.get("/api/v1/saved-searches").status_code == 401


def test_invalid_tenant_membership_returns_403():
    # Spoofing: sending Org A's header with User B's ID (who belongs to Org B)
    spoofed_headers = {
        "X-Org-Id": ORG_A_ID,
        "X-User-Id": USER_B_EXEC_ID,
    }
    res = client.get("/api/v1/bids", headers=spoofed_headers)
    assert res.status_code == 403
    assert "not a member" in res.json()["detail"].lower()


def test_cross_tenant_direct_resource_access_returns_403():
    # Authenticated as Org B, attempting direct path access to Org A's resources
    headers_org_b = {
        "X-Org-Id": ORG_B_ID,
        "X-User-Id": USER_B_EXEC_ID,
    }

    # 1. Direct bid access
    res_bid = client.get(f"/api/v1/bids/{VENTILATOR_BID_ID}", headers=headers_org_b)
    assert res_bid.status_code == 403
    assert "Cross-tenant" in res_bid.json()["detail"]

    # 2. Direct bid stage update
    res_stage = client.put(f"/api/v1/bids/{VENTILATOR_BID_ID}/stage", headers=headers_org_b, json={"stage": "submitted"})
    assert res_stage.status_code == 403
    assert "Cross-tenant" in res_stage.json()["detail"]

    # 3. Direct bid decision update
    res_dec = client.put(
        f"/api/v1/bids/{VENTILATOR_BID_ID}/decision",
        headers=headers_org_b,
        json={"decision": "no_bid", "decision_rationale": "Tampering"},
    )
    assert res_dec.status_code == 403
    assert "Cross-tenant" in res_dec.json()["detail"]

    # 4. Direct bid tasks listing
    res_tasks = client.get(f"/api/v1/bids/{VENTILATOR_BID_ID}/tasks", headers=headers_org_b)
    assert res_tasks.status_code == 403
    assert "Cross-tenant" in res_tasks.json()["detail"]

    # 5. Direct bid task creation
    res_create_task = client.post(
        f"/api/v1/bids/{VENTILATOR_BID_ID}/tasks",
        headers=headers_org_b,
        json={"title": "Illegal Task", "task_type": "bid_security"},
    )
    assert res_create_task.status_code == 403
    assert "Cross-tenant" in res_create_task.json()["detail"]


def test_rbac_viewer_restrictions():
    # Viewer in Org A
    headers_viewer = {
        "X-Org-Id": ORG_A_ID,
        "X-User-Id": "11111111-0000-0000-0000-000000000008",
    }

    # 1. Viewer can read bids
    res_read = client.get("/api/v1/bids", headers=headers_viewer)
    assert res_read.status_code == 200

    # 2. Viewer cannot update bid stage
    res_stage = client.put(
        f"/api/v1/bids/{VENTILATOR_BID_ID}/stage",
        headers=headers_viewer,
        json={"stage": "submitted"},
    )
    assert res_stage.status_code == 403
    assert "Permission denied" in res_stage.json()["detail"]

    # 3. Viewer cannot record bid decision
    res_dec = client.put(
        f"/api/v1/bids/{VENTILATOR_BID_ID}/decision",
        headers=headers_viewer,
        json={"decision": "bid", "decision_rationale": "Viewer override"},
    )
    assert res_dec.status_code == 403
    assert "Permission denied" in res_dec.json()["detail"]

    # 4. Viewer cannot create tasks
    res_task = client.post(
        f"/api/v1/bids/{VENTILATOR_BID_ID}/tasks",
        headers=headers_viewer,
        json={"title": "Viewer Task", "task_type": "bid_security"},
    )
    assert res_task.status_code == 403
    assert "Permission denied" in res_task.json()["detail"]

    # 5. Viewer cannot upload vault documents
    res_vault = client.post(
        "/api/v1/vault",
        headers=headers_viewer,
        json={"title": "Fake Doc", "doc_type": "certification"},
    )
    assert res_vault.status_code == 403
    assert "Permission denied" in res_vault.json()["detail"]

    # 6. Viewer cannot finalize submission
    res_submit = client.post(
        f"/api/v1/approvals/{VENTILATOR_BID_ID}/submit",
        headers=headers_viewer,
        json={"target_portal": "EPADS", "signatory_name": "Sara"},
    )
    assert res_submit.status_code == 403
    assert "Permission denied" in res_submit.json()["detail"]


def test_rbac_technical_and_finance_separation_of_duties():
    headers_tech = {
        "X-Org-Id": ORG_A_ID,
        "X-User-Id": "11111111-0000-0000-0000-000000000004",
    }
    headers_fin = {
        "X-Org-Id": ORG_A_ID,
        "X-User-Id": "11111111-0000-0000-0000-000000000005",
    }
    steps = client.get(f"/api/v1/approvals/{VENTILATOR_BID_ID}?organization_id={ORG_A_ID}").json()
    step_tech = steps[0]["id"]  # technical
    step_comm = steps[1]["id"]  # commercial
    step_final = steps[3]["id"] # final

    # 1. Tech user approves Technical step -> 200 OK
    res_tech_ok = client.post(
        f"/api/v1/approvals/{VENTILATOR_BID_ID}/steps/{step_tech}/action?organization_id={ORG_A_ID}",
        headers=headers_tech,
        json={"action": "approved", "notes": "Technical specs validated"},
    )
    assert res_tech_ok.status_code == 200

    # 2. Tech user attempts Commercial step -> 403 Forbidden
    res_tech_fail = client.post(
        f"/api/v1/approvals/{VENTILATOR_BID_ID}/steps/{step_comm}/action?organization_id={ORG_A_ID}",
        headers=headers_tech,
        json={"action": "approved", "notes": "Unauthorized commercial sign-off"},
    )
    assert res_tech_fail.status_code == 403
    assert "Permission denied" in res_tech_fail.json()["detail"]

    # 3. Finance user approves Commercial step -> 200 OK
    res_fin_ok = client.post(
        f"/api/v1/approvals/{VENTILATOR_BID_ID}/steps/{step_comm}/action?organization_id={ORG_A_ID}",
        headers=headers_fin,
        json={"action": "approved", "notes": "Pricing margin and 2% bond approved"},
    )
    assert res_fin_ok.status_code == 200

    # 4. Finance user attempts Final executive step -> 403 Forbidden
    res_fin_fail = client.post(
        f"/api/v1/approvals/{VENTILATOR_BID_ID}/steps/{step_final}/action?organization_id={ORG_A_ID}",
        headers=headers_fin,
        json={"action": "approved", "notes": "Unauthorized final executive sign-off"},
    )
    assert res_fin_fail.status_code == 403
    assert "Permission denied" in res_fin_fail.json()["detail"]

