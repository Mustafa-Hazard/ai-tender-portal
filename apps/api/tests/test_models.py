import pytest
from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.base import Base
from app.models import Bid, Organization, Requirement, RequirementAssessment, Tender
from app.models.enums import BidStage, ComplianceStatus, TenderLifecycle


@pytest.fixture()
def session():
    engine = create_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(engine)
    with Session(engine) as s:
        yield s


def make_tender(session):
    tender = Tender(
        buyer_name="Fictional General Hospital",
        reference_number="FGH-2026-001",
        title="Supply of 50 ventilators (sample data)",
    )
    session.add(tender)
    session.commit()
    return tender


def test_unknown_tender_values_stay_null(session):
    tender = make_tender(session)
    assert tender.deadline_at is None
    assert tender.estimated_value is None
    assert tender.currency is None
    assert tender.lifecycle_status == TenderLifecycle.UNKNOWN


def test_bid_defaults_and_no_decision_until_recorded(session):
    org = Organization(name="Sample Supplier Ltd")
    session.add(org)
    tender = make_tender(session)
    bid = Bid(organization_id=org.id, tender_id=tender.id)
    session.add(bid)
    session.commit()
    assert bid.stage == BidStage.DISCOVERED
    assert bid.decision is None


def test_one_bid_per_organization_per_tender(session):
    org = Organization(name="Sample Supplier Ltd")
    session.add(org)
    tender = make_tender(session)
    session.add(Bid(organization_id=org.id, tender_id=tender.id))
    session.commit()
    session.add(Bid(organization_id=org.id, tender_id=tender.id))
    with pytest.raises(IntegrityError):
        session.commit()


def test_new_assessment_is_unreviewed_and_has_no_ai_status(session):
    org = Organization(name="Sample Supplier Ltd")
    session.add(org)
    tender = make_tender(session)
    req = Requirement(tender_id=tender.id, original_text="Valid tax registration required")
    session.add(req)
    session.commit()
    assessment = RequirementAssessment(requirement_id=req.id, organization_id=org.id)
    session.add(assessment)
    session.commit()
    assert assessment.reviewer_status == ComplianceStatus.UNREVIEWED
    assert assessment.ai_status is None
