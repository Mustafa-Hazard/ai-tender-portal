BASE = "/api/v1/tenders"


def payload(**over):
    data = {
        "title": "Supply of 50 ventilators (sample data)",
        "buyer_name": "Fictional General Hospital",
        "reference_number": "FGH-2026-001",
    }
    data.update(over)
    return data


def upload(client, headers, tender_id, content, name="notice.pdf"):
    return client.post(
        f"{BASE}/{tender_id}/documents",
        headers=headers,
        files={"file": (name, content, "application/pdf")},
    )


def test_list_empty(client):
    r = client.get(BASE)
    assert r.status_code == 200
    assert r.json()["total"] == 0


def test_create_requires_auth(client):
    assert client.post(BASE, json=payload()).status_code == 401


def test_header_mismatch_is_forbidden(client, member, other_member):
    mixed = {"X-Org-Id": member["X-Org-Id"], "X-User-Id": other_member["X-User-Id"]}
    assert client.post(BASE, json=payload(), headers=mixed).status_code == 403


def test_unknown_values_are_not_stated(client, member):
    r = client.post(BASE, json=payload(), headers=member)
    assert r.status_code == 201
    body = r.json()
    assert "deadline_at" in body["not_stated"]
    assert "estimated_value" in body["not_stated"]
    assert body["estimated_value"] is None
    assert body["deadline_at"] is None
    assert body["verification_status"] == "needs_verification"
    assert body["is_private"] is True
    assert body["first_retrieved_at"] is not None


def test_naive_deadline_is_rejected(client, member):
    r = client.post(BASE, json=payload(deadline_at="2026-12-01T10:00:00"), headers=member)
    assert r.status_code == 422


def test_tenant_isolation(client, member, other_member):
    created = client.post(BASE, json=payload(), headers=member).json()
    assert client.get(BASE, headers=member).json()["total"] == 1
    assert client.get(BASE, headers=other_member).json()["total"] == 0
    assert client.get(BASE).json()["total"] == 0
    assert client.get(f"{BASE}/{created['id']}", headers=member).status_code == 200
    assert client.get(f"{BASE}/{created['id']}", headers=other_member).status_code == 404


def test_duplicate_tender_returns_409_with_existing_id(client, member):
    first = client.post(BASE, json=payload(), headers=member).json()
    dup = client.post(BASE, json=payload(reference_number="fgh 2026 001"), headers=member)
    assert dup.status_code == 409
    assert dup.json()["detail"]["existing_tender_id"] == first["id"]


def test_detail_unknown_id_is_404(client):
    assert client.get(f"{BASE}/00000000-0000-0000-0000-000000000000").status_code == 404


def test_search_by_keyword(client, member):
    client.post(BASE, json=payload(), headers=member)
    client.post(
        BASE,
        json=payload(title="Office stationery supply (sample data)",
                     buyer_name="Other Dept", reference_number="OD-1"),
        headers=member,
    )
    r = client.get(BASE, params={"q": "ventilators"}, headers=member)
    assert r.json()["total"] == 1
    assert "ventilators" in r.json()["items"][0]["title"]


def test_document_versioning_and_dedup(client, member):
    tender = client.post(BASE, json=payload(), headers=member).json()

    first = upload(client, member, tender["id"], b"%PDF-1 original notice")
    assert first.status_code == 201
    assert first.json()["version_number"] == 1

    same = upload(client, member, tender["id"], b"%PDF-1 original notice")
    assert same.status_code == 200
    assert same.json()["id"] == first.json()["id"]

    second = upload(client, member, tender["id"], b"%PDF-1 corrigendum")
    assert second.status_code == 201
    assert second.json()["version_number"] == 2

    detail = client.get(f"{BASE}/{tender['id']}", headers=member).json()
    assert len(detail["versions"]) == 2
    assert detail["versions"][0]["superseded_by_id"] == second.json()["id"]
    assert detail["versions"][1]["superseded_by_id"] is None


def test_upload_rejects_unsupported_type(client, member):
    tender = client.post(BASE, json=payload(), headers=member).json()
    r = client.post(
        f"{BASE}/{tender['id']}/documents",
        headers=member,
        files={"file": ("virus.exe", b"MZ...", "application/octet-stream")},
    )
    assert r.status_code == 400


def test_other_org_cannot_upload_to_tender(client, member, other_member):
    tender = client.post(BASE, json=payload(), headers=member).json()
    r = upload(client, other_member, tender["id"], b"%PDF-1 nope")
    assert r.status_code == 404
