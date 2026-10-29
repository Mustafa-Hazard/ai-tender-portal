import uuid
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models import (
    AuditEvent, Bid, Evidence, Lot, Membership, Organization, Requirement,
    RequirementAssessment, Source, Tender, TenderVersion, User,
)
from app.models.enums import (
    ApprovalState, BidDecision, BidStage, ComplianceStatus, RequirementKind,
    RequirementOrigin, Role, SourceHealth, SourceType, TenderLifecycle,
    VerificationStatus,
)


def seed_database(db: Session) -> dict:
    """Populates deterministic seed data for Demo Scenarios A, B, and C. All data is visibly marked fictional."""
    now = datetime.now(timezone.utc)
    today = date.today()

    # Sources
    source_fed = Source(
        id=uuid.uuid4(),
        name="Pakistan Federal E-Procurement EPADS (Fictional Connector)",
        source_type=SourceType.GOV_PORTAL,
        access_method="api",
        base_url="https://eprocure.gov.pk.example",
        refresh_schedule="0 */2 * * *",
        last_checked_at=now - timedelta(minutes=15),
        last_success_at=now - timedelta(minutes=15),
        health=SourceHealth.HEALTHY,
        coverage_notes="Federal ministries and attached departments (Sample Data)",
    )
    source_prov = Source(
        id=uuid.uuid4(),
        name="Punjab PPRA Portal (Fictional Connector)",
        source_type=SourceType.GOV_PORTAL,
        access_method="feed",
        base_url="https://ppra.punjab.gov.pk.example",
        refresh_schedule="0 */4 * * *",
        last_checked_at=now - timedelta(hours=1),
        last_success_at=now - timedelta(hours=1),
        health=SourceHealth.HEALTHY,
        coverage_notes="Provincial health, education and infrastructure (Sample Data)",
    )
    db.add_all([source_fed, source_prov])
    db.flush()

    # =========================================================================
    # SCENARIO A: Fully eligible company preparing a bid
    # =========================================================================
    org_a = Organization(
        id=uuid.UUID("11111111-1111-1111-1111-111111111111"),
        name="Apex Healthcare Technologies Ltd (Fictional)",
        registration_country="PK",
        legal_identifiers={"NTN": "1234567-8", "SECP": "0098765", "STRN": "327787654321"},
        business_categories=["Medical Devices", "Hospital Equipment", "Biomedical Engineering"],
        service_regions=["Federal Capital", "Punjab", "Sindh"],
        currencies=["PKR", "USD"],
        company_size="Medium (50-249)",
        min_opportunity_value=Decimal("10000000.00"),
        max_opportunity_value=Decimal("500000000.00"),
        profile_completeness=92,
    )
    user_a_exec = User(
        id=uuid.UUID("11111111-0000-0000-0000-000000000001"),
        email="mustafa.exec@apex-health.example",
        full_name="Mustafa Khan (Owner/Admin)",
    )
    user_a_bid = User(
        id=uuid.UUID("11111111-0000-0000-0000-000000000002"),
        email="fatima.bid@apex-health.example",
        full_name="Fatima Ali (Bid Manager)",
    )
    user_a_comp = User(
        id=uuid.UUID("11111111-0000-0000-0000-000000000003"),
        email="bilal.comp@apex-health.example",
        full_name="Bilal Ahmed (Compliance Reviewer)",
    )
    mem_a1 = Membership(id=uuid.uuid4(), organization_id=org_a.id, user_id=user_a_exec.id, role=Role.OWNER_ADMIN)
    mem_a2 = Membership(id=uuid.uuid4(), organization_id=org_a.id, user_id=user_a_bid.id, role=Role.BID_MANAGER)
    mem_a3 = Membership(id=uuid.uuid4(), organization_id=org_a.id, user_id=user_a_comp.id, role=Role.COMPLIANCE)

    ev_a_tax = Evidence(
        id=uuid.uuid4(),
        organization_id=org_a.id,
        doc_type="FBR Tax Active Taxpayer Certificate",
        title="Active Taxpayer Status Certificate 2026-27",
        version=1,
        issuer="Federal Board of Revenue (FBR)",
        owner_id=user_a_comp.id,
        issued_on=today - timedelta(days=90),
        expires_on=today + timedelta(days=275),
        jurisdiction="Pakistan",
        approval_state=ApprovalState.APPROVED,
        sha256="a1b2c3d4e5f60000111122223333444455556666777788889999aaaabbbbcccc",
    )
    ev_a_iso = Evidence(
        id=uuid.uuid4(),
        organization_id=org_a.id,
        doc_type="ISO 13485 Medical Devices Certification",
        title="ISO 13485:2016 Quality Management Certificate",
        version=2,
        issuer="SGS International",
        owner_id=user_a_comp.id,
        issued_on=today - timedelta(days=365),
        expires_on=today + timedelta(days=730),
        jurisdiction="Global",
        approval_state=ApprovalState.APPROVED,
        sha256="b2c3d4e5f6a10000111122223333444455556666777788889999aaaabbbbcccc",
    )
    ev_a_audit = Evidence(
        id=uuid.uuid4(),
        organization_id=org_a.id,
        doc_type="Audited Financial Statements",
        title="Annual Audited Accounts FY2024-2025",
        version=1,
        issuer="KPMG Taseer Hadi & Co",
        owner_id=user_a_exec.id,
        issued_on=today - timedelta(days=120),
        expires_on=today + timedelta(days=245),
        jurisdiction="Pakistan",
        approval_state=ApprovalState.APPROVED,
        sha256="c3d4e5f6a1b20000111122223333444455556666777788889999aaaabbbbcccc",
    )

    tender_a = Tender(
        id=uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        source_id=source_fed.id,
        buyer_name="Federal Teaching Hospital Islamabad",
        reference_number="FTH-ICU-2026-088",
        title="Procurement of High-End ICU Ventilators & Patient Monitors (Sample Fictional Data)",
        description="Supply, installation, testing and commissioning of 50 advanced invasive/non-invasive ICU ventilators.",
        category="Medical Equipment",
        procurement_type="National Competitive Bidding",
        country="PK",
        region="Federal Capital",
        city="Islamabad",
        lifecycle_status=TenderLifecycle.OPEN,
        published_at=now - timedelta(days=10),
        deadline_at=now + timedelta(days=20),
        deadline_timezone="Asia/Karachi",
        estimated_value=Decimal("175000000.00"),
        currency="PKR",
        original_url="https://eprocure.gov.pk.example/tenders/FTH-ICU-2026-088",
        first_retrieved_at=now - timedelta(days=10),
        last_checked_at=now - timedelta(hours=2),
        extraction_confidence=0.96,
        verification_status=VerificationStatus.VERIFIED,
        dedup_key="federalteachinghospitalislamabad:fthicu2026088",
        
    )
    lot_a1 = Lot(
        id=uuid.uuid4(),
        tender_id=tender_a.id,
        lot_number="Lot-1",
        title="50x ICU Ventilators with High-Flow Nasal Cannula",
        scope="Invasive and non-invasive adult/pediatric ICU ventilators.",
        estimated_value=Decimal("140000000.00"),
        currency="PKR",
    )
    lot_a2 = Lot(
        id=uuid.uuid4(),
        tender_id=tender_a.id,
        lot_number="Lot-2",
        title="50x Multi-Parameter Vital Signs Monitors",
        scope="Modular patient monitors with central monitoring station integration.",
        estimated_value=Decimal("35000000.00"),
        currency="PKR",
    )
    req_a1 = Requirement(
        id=uuid.uuid4(),
        tender_id=tender_a.id,
        code="REQ-LEG-01",
        category="Legal",
        kind=RequirementKind.MANDATORY,
        original_text="The bidder must be on Active Taxpayers List (ATL) of FBR with valid NTN and STRN.",
        citation="RFP Tender Document Section II, Page 14, Clause 4.1",
        origin=RequirementOrigin.EXTRACTED,
        extraction_confidence=0.98,
    )
    req_a2 = Requirement(
        id=uuid.uuid4(),
        tender_id=tender_a.id,
        code="REQ-TEC-01",
        category="Technical",
        kind=RequirementKind.MANDATORY,
        original_text="Manufacturer must hold valid ISO 13485 certification and FDA/CE-MDR compliance.",
        citation="RFP Tender Document Section III, Page 22, Clause 8.2",
        origin=RequirementOrigin.EXTRACTED,
        extraction_confidence=0.95,
    )
    req_a3 = Requirement(
        id=uuid.uuid4(),
        tender_id=tender_a.id,
        code="REQ-FIN-01",
        category="Financial",
        kind=RequirementKind.MANDATORY,
        original_text="Average annual turnover of minimum PKR 100 Million over the last 3 fiscal years.",
        citation="RFP Tender Document Section II, Page 16, Clause 5.3",
        origin=RequirementOrigin.EXTRACTED,
        extraction_confidence=0.92,
    )

    bid_a = Bid(
        id=uuid.UUID("aaaaaaaa-bbbb-cccc-dddd-111111111111"),
        organization_id=org_a.id,
        tender_id=tender_a.id,
        stage=BidStage.PREPARING,
        decision=BidDecision.BID,
        decision_rationale="High strategic alignment with our medical equipment division. Full eligibility verified.",
        decided_by_id=user_a_exec.id,
        decided_at=now - timedelta(days=7),
        owner_id=user_a_bid.id,
        internal_deadline=now + timedelta(days=15),
        expected_bid_cost=Decimal("450000.00"),
        potential_contract_value=Decimal("170000000.00"),
        currency="PKR",
    )
    ass_a1 = RequirementAssessment(
        id=uuid.uuid4(),
        requirement_id=req_a1.id,
        organization_id=org_a.id,
        bid_id=bid_a.id,
        ai_status=ComplianceStatus.MEETS,
        reviewer_status=ComplianceStatus.MEETS,
        evidence_id=ev_a_tax.id,
        owner_id=user_a_comp.id,
        reviewed_by_id=user_a_comp.id,
        reviewed_at=now - timedelta(days=6),
        notes="Verified active on FBR ATL portal as of October 2026.",
    )
    ass_a2 = RequirementAssessment(
        id=uuid.uuid4(),
        requirement_id=req_a2.id,
        organization_id=org_a.id,
        bid_id=bid_a.id,
        ai_status=ComplianceStatus.MEETS,
        reviewer_status=ComplianceStatus.MEETS,
        evidence_id=ev_a_iso.id,
        owner_id=user_a_comp.id,
        reviewed_by_id=user_a_comp.id,
        reviewed_at=now - timedelta(days=6),
        notes="ISO 13485 certificate valid through 2028.",
    )
    ass_a3 = RequirementAssessment(
        id=uuid.uuid4(),
        requirement_id=req_a3.id,
        organization_id=org_a.id,
        bid_id=bid_a.id,
        ai_status=ComplianceStatus.MEETS,
        reviewer_status=ComplianceStatus.MEETS,
        evidence_id=ev_a_audit.id,
        owner_id=user_a_comp.id,
        reviewed_by_id=user_a_comp.id,
        reviewed_at=now - timedelta(days=6),
        notes="Audited turnover averages PKR 185M annually.",
    )

    db.add_all([
        org_a, user_a_exec, user_a_bid, user_a_comp, mem_a1, mem_a2, mem_a3,
        ev_a_tax, ev_a_iso, ev_a_audit, tender_a, lot_a1, lot_a2,
        req_a1, req_a2, req_a3, bid_a, ass_a1, ass_a2, ass_a3,
    ])

    # =========================================================================
    # SCENARIO B: Company with missing/expired mandatory evidence
    # =========================================================================
    org_b = Organization(
        id=uuid.UUID("22222222-2222-2222-2222-222222222222"),
        name="Delta Engineering & Cloud Solutions (Fictional)",
        registration_country="PK",
        legal_identifiers={"NTN": "5432109-8", "SECP": "0045678"},
        business_categories=["Cloud Computing", "IT Systems Integration", "Datacenter Infrastructure"],
        service_regions=["Punjab", "Sindh"],
        currencies=["PKR"],
        company_size="Small (10-49)",
        min_opportunity_value=Decimal("5000000.00"),
        max_opportunity_value=Decimal("150000000.00"),
        profile_completeness=60,
    )
    user_b_bid = User(
        id=uuid.UUID("22222222-0000-0000-0000-000000000001"),
        email="tariq.bid@delta-eng.example",
        full_name="Tariq Mansoor (Bid Manager)",
    )
    user_b_tech = User(
        id=uuid.UUID("22222222-0000-0000-0000-000000000002"),
        email="zainab.tech@delta-eng.example",
        full_name="Zainab Noor (Technical Contributor)",
    )
    mem_b1 = Membership(id=uuid.uuid4(), organization_id=org_b.id, user_id=user_b_bid.id, role=Role.BID_MANAGER)
    mem_b2 = Membership(id=uuid.uuid4(), organization_id=org_b.id, user_id=user_b_tech.id, role=Role.TECHNICAL)

    ev_b_expired_tax = Evidence(
        id=uuid.uuid4(),
        organization_id=org_b.id,
        doc_type="Provincial Sales Tax Registration",
        title="PRA Provincial Tax Clearance Certificate",
        version=1,
        issuer="Punjab Revenue Authority",
        owner_id=user_b_bid.id,
        issued_on=today - timedelta(days=400),
        expires_on=today - timedelta(days=35),  # EXPIRED 35 DAYS AGO
        jurisdiction="Punjab",
        approval_state=ApprovalState.REJECTED,
        sha256="ffff0000111122223333444455556666777788889999aaaabbbbccccddddeeee",
    )

    tender_b = Tender(
        id=uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        source_id=source_prov.id,
        buyer_name="Punjab Municipal Development Fund Company",
        reference_number="PMDFC-CLOUD-2026-012",
        title="Enterprise Cloud Migration & Municipal ERP Datacenter Modernization (Sample Fictional Data)",
        description="Comprehensive cloud migration of municipal e-services, container orchestration, and 24/7 SOC operations.",
        category="Information Technology",
        procurement_type="Quality & Cost Based Selection",
        country="PK",
        region="Punjab",
        city="Lahore",
        lifecycle_status=TenderLifecycle.OPEN,
        published_at=now - timedelta(days=5),
        deadline_at=now + timedelta(days=25),
        deadline_timezone="Asia/Karachi",
        estimated_value=Decimal("85000000.00"),
        currency="PKR",
        original_url="https://ppra.punjab.gov.pk.example/tenders/PMDFC-CLOUD-2026-012",
        first_retrieved_at=now - timedelta(days=5),
        last_checked_at=now - timedelta(hours=1),
        extraction_confidence=0.94,
        verification_status=VerificationStatus.VERIFIED,
        dedup_key="punjabmunicipaldevelopmentfundcompany:pmdfccloud2026012",
        
    )
    req_b_tax = Requirement(
        id=uuid.uuid4(),
        tender_id=tender_b.id,
        code="REQ-LEG-01",
        category="Legal",
        kind=RequirementKind.MANDATORY,
        original_text="Valid, active PRA Provincial Sales Tax Registration Certificate with clearance for the current fiscal year.",
        citation="RFP Section 2, Page 11, Clause 3.2",
        origin=RequirementOrigin.EXTRACTED,
        extraction_confidence=0.97,
    )
    req_b_iso = Requirement(
        id=uuid.uuid4(),
        tender_id=tender_b.id,
        code="REQ-SEC-01",
        category="Technical",
        kind=RequirementKind.MANDATORY,
        original_text="Mandatory ISO 27001 (Information Security Management) and ISO 20000 certifications.",
        citation="RFP Section 4, Page 31, Clause 12.1",
        origin=RequirementOrigin.EXTRACTED,
        extraction_confidence=0.96,
    )
    bid_b = Bid(
        id=uuid.UUID("bbbbbbbb-cccc-dddd-eeee-222222222222"),
        organization_id=org_b.id,
        tender_id=tender_b.id,
        stage=BidStage.EVALUATING,
        decision=BidDecision.HOLD,
        decision_rationale="High capability fit, but blocked by expired tax registration and missing ISO 27001 certification.",
        decided_by_id=user_b_bid.id,
        decided_at=now - timedelta(days=2),
        owner_id=user_b_bid.id,
        internal_deadline=now + timedelta(days=18),
        expected_bid_cost=Decimal("250000.00"),
        potential_contract_value=Decimal("85000000.00"),
        currency="PKR",
    )
    ass_b_tax = RequirementAssessment(
        id=uuid.uuid4(),
        requirement_id=req_b_tax.id,
        organization_id=org_b.id,
        bid_id=bid_b.id,
        ai_status=ComplianceStatus.DOES_NOT_MEET,
        reviewer_status=ComplianceStatus.DOES_NOT_MEET,
        evidence_id=ev_b_expired_tax.id,
        owner_id=user_b_bid.id,
        notes="WARNING: Linked PRA tax certificate expired 35 days ago. Disqualification risk under Rule 36.",
    )
    ass_b_iso = RequirementAssessment(
        id=uuid.uuid4(),
        requirement_id=req_b_iso.id,
        organization_id=org_b.id,
        bid_id=bid_b.id,
        ai_status=ComplianceStatus.MISSING_EVIDENCE,
        reviewer_status=ComplianceStatus.UNREVIEWED,
        evidence_id=None,
        owner_id=user_b_bid.id,
        notes="BLOCKER: No ISO 27001 certificate uploaded in Company Document Vault.",
    )

    db.add_all([
        org_b, user_b_bid, user_b_tech, mem_b1, mem_b2,
        ev_b_expired_tax, tender_b, req_b_tax, req_b_iso,
        bid_b, ass_b_tax, ass_b_iso,
    ])

    # =========================================================================
    # SCENARIO C: Amended tender that invalidates part of an approved proposal
    # =========================================================================
    tender_c = Tender(
        id=uuid.UUID("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        source_id=source_fed.id,
        buyer_name="National Disaster Management Authority (NDMA)",
        reference_number="NDMA-FLEET-2026-05",
        title="Supply of 100 Heavy-Duty All-Terrain Logistics Trucks (Sample Fictional Data)",
        description="Amended notice: Procurement of high-mobility disaster response logistics vehicles.",
        category="Vehicles & Heavy Equipment",
        procurement_type="International Competitive Bidding",
        country="PK",
        region="Federal Capital",
        city="Islamabad",
        lifecycle_status=TenderLifecycle.AMENDED,
        published_at=now - timedelta(days=20),
        deadline_at=now + timedelta(days=12),
        deadline_timezone="Asia/Karachi",
        estimated_value=Decimal("850000000.00"),
        currency="PKR",
        original_url="https://eprocure.gov.pk.example/tenders/NDMA-FLEET-2026-05",
        first_retrieved_at=now - timedelta(days=20),
        last_checked_at=now - timedelta(hours=3),
        extraction_confidence=0.98,
        verification_status=VerificationStatus.VERIFIED,
        dedup_key="nationaldisastermanagementauthorityndma:ndmafleet202605",
        deadline_history=[
            {"deadline_at": (now + timedelta(days=5)).isoformat(), "recorded_at": (now - timedelta(days=20)).isoformat(), "reason": "initial"},
            {"deadline_at": (now + timedelta(days=12)).isoformat(), "recorded_at": (now - timedelta(days=2)).isoformat(), "reason": "Corrigendum 1 deadline extension"},
        ],
        
    )
    ver_c1 = TenderVersion(
        id=uuid.uuid4(),
        tender_id=tender_c.id,
        version_number=1,
        document_hash="c111111111111111111111111111111111111111111111111111111111111111",
        original_filename="NDMA_Fleet_Original_Notice.pdf",
        storage_key="public/ndma/v1.pdf",
        retrieved_at=now - timedelta(days=20),
    )
    ver_c2 = TenderVersion(
        id=uuid.uuid4(),
        tender_id=tender_c.id,
        version_number=2,
        document_hash="c222222222222222222222222222222222222222222222222222222222222222",
        original_filename="NDMA_Fleet_Corrigendum_01.pdf",
        storage_key="public/ndma/v2_corrigendum.pdf",
        retrieved_at=now - timedelta(days=2),
        change_summary={
            "delivery_timeline": {"from": "90 Days", "to": "45 Days (Expedited)"},
            "new_requirement": "Mandatory real-time satellite GPS tracking unit per vehicle",
            "approvals_impacted": ["Technical Proposal Section 3.2", "Commercial Delivery Schedule"],
        },
    )
    ver_c1.superseded_by_id = ver_c2.id

    db.add_all([tender_c, ver_c1, ver_c2])

    # Initial audit events
    db.add(
        AuditEvent(
            organization_id=org_a.id,
            actor_id=user_a_exec.id,
            action="organization.seed_init",
            object_type="organization",
            object_id=str(org_a.id),
            before=None,
            after={"name": org_a.name, "scenario": "Scenario A"},
        )
    )
    db.add(
        AuditEvent(
            organization_id=org_b.id,
            actor_id=user_b_bid.id,
            action="compliance.disqualification_warning",
            object_type="bid",
            object_id=str(bid_b.id),
            before=None,
            after={"reason": "Expired tax registration", "scenario": "Scenario B"},
        )
    )

    db.commit()
    return {
        "org_a": org_a.id,
        "org_b": org_b.id,
        "tender_a": tender_a.id,
        "tender_b": tender_b.id,
        "tender_c": tender_c.id,
    }
