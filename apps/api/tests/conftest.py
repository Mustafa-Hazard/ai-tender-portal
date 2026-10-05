import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401
from app.core.config import settings
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models import Membership, Organization, User
from app.models.enums import Role


@pytest.fixture()
def session_factory():
    engine = create_engine(
        "sqlite+pysqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, expire_on_commit=False)


@pytest.fixture()
def client(session_factory, tmp_path, monkeypatch):
    def override_get_db():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    monkeypatch.setattr(settings, "storage_dir", str(tmp_path))
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture()
def make_member(session_factory):
    def _make(org_name="Sample Supplier Ltd"):
        with session_factory() as s:
            org = Organization(name=org_name)
            user = User(email=f"{uuid.uuid4().hex}@example.com")
            s.add_all([org, user])
            s.flush()
            s.add(Membership(organization_id=org.id, user_id=user.id, role=Role.BID_MANAGER))
            s.commit()
            return {"X-Org-Id": str(org.id), "X-User-Id": str(user.id)}

    return _make


@pytest.fixture()
def member(make_member):
    return make_member("Org A")


@pytest.fixture()
def other_member(make_member):
    return make_member("Org B")
