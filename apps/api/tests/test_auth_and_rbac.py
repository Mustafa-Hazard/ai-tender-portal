import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_auth_signup_login_and_rbac():
    unique_suffix = uuid.uuid4().hex[:8]
    test_email = f"test.owner.{unique_suffix}@acme-defense.pk"
    password = "StrongPassword2026!"

    # 1. Sign up a new user and organization
    signup_data = {
        "email": test_email,
        "password": password,
        "full_name": "Hamza Tariq",
        "organization_name": "Acme Defense Systems",
        "role": "owner_admin",
    }
    res = client.post("/api/v1/auth/signup", json=signup_data)
    assert res.status_code == 201, f"Signup failed: {res.text}"
    payload = res.json()
    assert "access_token" in payload
    assert payload["token_type"] == "bearer"
    assert payload["user"]["email"] == test_email
    assert payload["user"]["role"] == "owner_admin"
    assert payload["user"]["organization_name"] == "Acme Defense Systems"

    token = payload["access_token"]

    # 2. Duplicate signup should be rejected
    res_dup = client.post("/api/v1/auth/signup", json=signup_data)
    assert res_dup.status_code == 400
    assert "already exists" in res_dup.json()["detail"]

    # 3. Successful Login
    login_data = {
        "email": test_email,
        "password": password,
    }
    res_login = client.post("/api/v1/auth/login", json=login_data)
    assert res_login.status_code == 200
    login_payload = res_login.json()
    assert "access_token" in login_payload
    assert login_payload["user"]["organization_name"] == "Acme Defense Systems"

    # 4. Failed Login with wrong password
    bad_login = {
        "email": test_email,
        "password": "WrongPassword999!",
    }
    res_bad = client.post("/api/v1/auth/login", json=bad_login)
    assert res_bad.status_code == 401
    assert "Invalid email or password" in res_bad.json()["detail"]

    # 5. Protected /me endpoint with JWT
    res_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status_code == 200
    me_data = res_me.json()
    assert me_data["email"] == test_email
    assert me_data["role"] == "owner_admin"
    assert me_data["organization_name"] == "Acme Defense Systems"

    # 6. Protected /me endpoint without credentials fails
    res_unauth = client.get("/api/v1/auth/me")
    assert res_unauth.status_code == 401
