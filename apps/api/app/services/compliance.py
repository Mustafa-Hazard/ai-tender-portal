import uuid
from datetime import date, datetime, timezone
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.compliance import Evidence, Requirement, RequirementAssessment
from app.models.enums import ApprovalState, ComplianceStatus, RequirementKind
from app.models.tender import Tender
from app.schemas.compliance import (
    ComplianceMatrixOut,
    ComplianceMatrixRow,
    EvidenceCreate,
    EvidenceListOut,
    EvidenceOut,
    RequirementAssessmentOut,
    RequirementAssessmentUpdate,
)


def get_evidence_out(ev: Evidence) -> EvidenceOut:
    today = date.today()
    is_expired = False
    days_to_expiry = None

    if ev.expires_on:
        days = (ev.expires_on - today).days
        days_to_expiry = days
        if days < 0:
            is_expired = True

    return EvidenceOut(
        id=ev.id,
        organization_id=ev.organization_id,
        doc_type=ev.doc_type,
        title=ev.title,
        version=ev.version,
        supersedes_id=ev.supersedes_id,
        issuer=ev.issuer,
        issued_on=ev.issued_on,
        expires_on=ev.expires_on,
        is_expired=is_expired,
        days_to_expiry=days_to_expiry,
        jurisdiction=ev.jurisdiction,
        confidentiality=ev.confidentiality,
        approval_state=ev.approval_state,
        storage_key=ev.storage_key,
        sha256=ev.sha256,
        created_at=ev.created_at,
        updated_at=ev.updated_at,
    )


def list_evidence(db: Session, organization_id: uuid.UUID, doc_type: str | None = None) -> EvidenceListOut:
    stmt = select(Evidence).where(Evidence.organization_id == organization_id)
    if doc_type:
        stmt = stmt.where(Evidence.doc_type == doc_type)
    stmt = stmt.order_by(Evidence.created_at.desc())
    items = db.execute(stmt).scalars().all()

    outs = [get_evidence_out(e) for e in items]
    expired_cnt = sum(1 for o in outs if o.is_expired)
    expiring_soon_cnt = sum(1 for o in outs if not o.is_expired and o.days_to_expiry is not None and o.days_to_expiry <= 30)

    return EvidenceListOut(
        items=outs,
        total=len(outs),
        expired_count=expired_cnt,
        expiring_soon_count=expiring_soon_cnt,
    )


def create_evidence(db: Session, organization_id: uuid.UUID, payload: EvidenceCreate) -> EvidenceOut:
    ev = Evidence(
        organization_id=organization_id,
        doc_type=payload.doc_type,
        title=payload.title,
        issuer=payload.issuer,
        issued_on=payload.issued_on,
        expires_on=payload.expires_on,
        jurisdiction=payload.jurisdiction,
        confidentiality=payload.confidentiality,
        approval_state=payload.approval_state,
        storage_key=payload.storage_key,
        sha256=payload.sha256,
        version=1,
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return get_evidence_out(ev)


def delete_evidence(db: Session, evidence_id: uuid.UUID, organization_id: uuid.UUID) -> bool:
    ev = db.execute(
        select(Evidence).where(Evidence.id == evidence_id, Evidence.organization_id == organization_id)
    ).scalar_one_or_none()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence document not found")
    db.delete(ev)
    db.commit()
    return True


def evaluate_compliance_matrix(
    db: Session, tender_id: uuid.UUID, organization_id: uuid.UUID
) -> ComplianceMatrixOut:
    tender = db.execute(select(Tender).where(Tender.id == tender_id)).scalar_one_or_none()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")

    requirements = db.execute(
        select(Requirement).where(Requirement.tender_id == tender_id).order_by(Requirement.created_at)
    ).scalars().all()

    assessments = db.execute(
        select(RequirementAssessment).where(
            RequirementAssessment.organization_id == organization_id,
            RequirementAssessment.requirement_id.in_([r.id for r in requirements]) if requirements else False,
        )
    ).scalars().all()
    assessment_map = {a.requirement_id: a for a in assessments}

    # Fetch any linked evidence
    evidence_ids = [a.evidence_id for a in assessments if a.evidence_id is not None]
    ev_map = {}
    if evidence_ids:
        evidence_objs = db.execute(select(Evidence).where(Evidence.id.in_(evidence_ids))).scalars().all()
        ev_map = {e.id: get_evidence_out(e) for e in evidence_objs}

    rows: list[ComplianceMatrixRow] = []
    blockers: list[str] = []
    today = date.today()

    total_requirements = len(requirements)
    mandatory_count = 0
    mandatory_met_count = 0
    reviewed_count = 0
    has_disqualification_defect = False
    has_undetermined_mandatory = False

    for req in requirements:
        is_mandatory = (req.kind == RequirementKind.MANDATORY)
        if is_mandatory:
            mandatory_count += 1

        assessment = assessment_map.get(req.id)
        reviewer_status = assessment.reviewer_status if assessment else ComplianceStatus.UNREVIEWED
        ai_status = assessment.ai_status if assessment else None
        linked_evidence = ev_map.get(assessment.evidence_id) if assessment and assessment.evidence_id else None
        
        is_evidence_expired = False
        if linked_evidence:
            if linked_evidence.expires_on and linked_evidence.expires_on < today:
                is_evidence_expired = True

        if reviewer_status != ComplianceStatus.UNREVIEWED:
            reviewed_count += 1

        req_code = req.code or "REQ"

        # Check compliance & disqualification logic
        if is_mandatory:
            if is_evidence_expired:
                has_disqualification_defect = True
                blockers.append(
                    f"Requirement {req_code}: Linked evidence '{linked_evidence.title}' expired on {linked_evidence.expires_on.isoformat()} (RULE 7: Expired evidence in company vault blocks mandatory eligibility)"
                )
            elif reviewer_status == ComplianceStatus.MEETS:
                mandatory_met_count += 1
            elif reviewer_status == ComplianceStatus.NOT_APPLICABLE:
                if assessment and assessment.not_applicable_justification:
                    mandatory_met_count += 1
                else:
                    has_disqualification_defect = True
                    blockers.append(f"Requirement {req_code}: Marked N/A without recorded justification.")
            elif reviewer_status == ComplianceStatus.DOES_NOT_MEET:
                has_disqualification_defect = True
                blockers.append(f"Requirement {req_code}: Evaluator verified failure (DOES NOT MEET).")
            else:
                # Unreviewed, missing evidence, needs interpretation, etc.
                has_undetermined_mandatory = True

        rows.append(
            ComplianceMatrixRow(
                requirement_id=req.id,
                code=req_code,
                category=req.category or "General",
                kind=req.kind,
                original_text=req.original_text,
                citation=req.citation,
                extraction_confidence=req.extraction_confidence,
                ai_status=ai_status,
                reviewer_status=reviewer_status,
                linked_evidence=linked_evidence,
                is_evidence_expired=is_evidence_expired,
                not_applicable_justification=assessment.not_applicable_justification if assessment else None,
                notes=assessment.notes if assessment else None,
            )
        )

    # Calculate 4 distinct indicators:
    # 1. Eligibility Status
    if has_disqualification_defect:
        eligibility_status = "not_eligible"
        is_mandatory_eligible = False
    elif has_undetermined_mandatory:
        eligibility_status = "undetermined"
        is_mandatory_eligible = False
    elif mandatory_count > 0 and mandatory_met_count == mandatory_count:
        eligibility_status = "potentially_eligible"
        is_mandatory_eligible = True
    else:
        eligibility_status = "undetermined" if mandatory_count > 0 else "potentially_eligible"
        is_mandatory_eligible = (mandatory_count == 0)

    # 2. Coverage Percent
    coverage_percent = round((reviewed_count / total_requirements * 100)) if total_requirements > 0 else 0

    return ComplianceMatrixOut(
        tender_id=tender.id,
        tender_title=tender.title,
        rows=rows,
        total_requirements=total_requirements,
        mandatory_count=mandatory_count,
        mandatory_met_count=mandatory_met_count,
        is_mandatory_eligible=is_mandatory_eligible,
        eligibility_status=eligibility_status,
        blockers=blockers,
        coverage_percent=coverage_percent,
    )


def update_assessment(
    db: Session,
    requirement_id: uuid.UUID,
    organization_id: uuid.UUID,
    payload: RequirementAssessmentUpdate,
) -> RequirementAssessmentOut:
    # RULE 6: "Not Applicable" (N/A) requires recorded justification
    if payload.reviewer_status == ComplianceStatus.NOT_APPLICABLE:
        if not payload.not_applicable_justification or not payload.not_applicable_justification.strip():
            raise HTTPException(
                status_code=422,
                detail="RULE 6 ENFORCEMENT: 'Not Applicable' (N/A) requires a recorded justification explaining why this tender requirement does not apply.",
            )

    req = db.execute(select(Requirement).where(Requirement.id == requirement_id)).scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Requirement not found")

    if payload.evidence_id:
        ev = db.execute(
            select(Evidence).where(Evidence.id == payload.evidence_id, Evidence.organization_id == organization_id)
        ).scalar_one_or_none()
        if not ev:
            raise HTTPException(status_code=404, detail="Evidence document not found for organization")

    assessment = db.execute(
        select(RequirementAssessment).where(
            RequirementAssessment.requirement_id == requirement_id,
            RequirementAssessment.organization_id == organization_id,
        )
    ).scalar_one_or_none()

    now = datetime.now(timezone.utc)

    if not assessment:
        assessment = RequirementAssessment(
            requirement_id=requirement_id,
            organization_id=organization_id,
            reviewer_status=payload.reviewer_status,
            evidence_id=payload.evidence_id,
            notes=payload.notes,
            not_applicable_justification=payload.not_applicable_justification,
            reviewed_at=now,
        )
        db.add(assessment)
    else:
        assessment.reviewer_status = payload.reviewer_status
        assessment.evidence_id = payload.evidence_id
        assessment.notes = payload.notes
        assessment.not_applicable_justification = payload.not_applicable_justification
        assessment.reviewed_at = now

    db.commit()
    db.refresh(assessment)

    return RequirementAssessmentOut.model_validate(assessment)
