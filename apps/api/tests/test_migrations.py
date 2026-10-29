import pytest
from alembic.config import Config
from alembic.script import ScriptDirectory
from app.db.base import Base
import app.models


def test_alembic_revisions_chain():
    config = Config("alembic.ini")
    script = ScriptDirectory.from_config(config)
    heads = script.get_heads()
    assert len(heads) == 1
    assert heads[0] == "a1b2c3d4e5f6"

    # Verify base revision exists
    base_rev = script.get_base()
    assert base_rev == "ef62fe967e03"


def test_models_metadata_has_all_tables():
    expected_tables = {
        "organizations",
        "users",
        "sources",
        "audit_events",
        "evidence",
        "memberships",
        "tenders",
        "bids",
        "lots",
        "tender_versions",
        "bid_lots",
        "tasks",
        "requirements",
        "requirement_assessments",
        "saved_searches",
        "approval_step_records",
        "submission_records",
        "outcome_records",
        "proposals",
        "proposal_sections",
    }
    actual_tables = set(Base.metadata.tables.keys())
    for t in expected_tables:
        assert t in actual_tables, f"Missing table '{t}' from Base.metadata"

