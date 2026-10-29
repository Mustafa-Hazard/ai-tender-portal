import hashlib
import json
import uuid
from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.approval import ApprovalStepRecord, SubmissionRecord
from app.models.audit import AuditEvent
from app.models.bid import Bid, Task
from app.models.enums import BidStage, TaskStatus
from app.models.tender import Tender
from app.schemas.approval import (
    ApprovalActionIn,
    ApprovalStepOut,
    SubmissionChecklistOut,
    SubmissionExecuteIn,
    SubmissionReceiptOut,
)
from app.services.compliance import evaluate_compliance_matrix

CANONICAL_STEPS = [
    {
        "flow_type": "technical",
        "step_name": "Technical Specifications & Scope Sign-off",
        "step_order": 1,
        "required_role": "technical_contributor",
    },
    {
        "flow_type": "commercial",
        "step_name": "Commercial Schedule & Margin Verification (Rule 8)",
        "step_order": 2,
        "required_role": "finance_contributor",
    },
    {
        "flow_type": "legal_compliance",
        "step_name": "Mandatory Vault Credentials & Regulatory Audit (Rule 7)",
        "step_order": 3,
        "required_role": "compliance_reviewer",
    },
    {
        "flow_type": "final",
        "step_name": "Executive & CEO Final Submission Authorization",
        "step_order": 4,
        "required_role": "approver",
    },
]


def get_or_init_workflow(db: Session, bid_id: uuid.UUID, organization_id: uuid.UUID) -> list[ApprovalStepOut]:
    bid = db.execute(
        select(Bid).where(Bid.id == bid_id, Bid.organization_id == organization_id)
    ).scalar_one_or_none()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")

    existing = db.execute(
        select(ApprovalStepRecord).where(ApprovalStepRecord.bid_id == bid_id).order_by(ApprovalStepRecord.step_order)
    ).scalars().all()

    if not existing:
        for s in CANONICAL_STEPS:
            rec = ApprovalStepRecord(
                bid_id=bid_id,
                flow_type=s["flow_type"],
                step_name=s["step_name"],
                step_order=s["step_order"],
                required_role=s["required_role"],
                status="pending",
                is_invalidated=False,
            )
            db.add(rec)
        db.commit()
        existing = db.execute(
            select(ApprovalStepRecord).where(ApprovalStepRecord.bid_id == bid_id).order_by(ApprovalStepRecord.step_order)
        ).scalars().all()

    return [ApprovalStepOut.model_validate(e) for e in existing]


def process_step_action(
    db: Session,
    bid_id: uuid.UUID,
    step_id: uuid.UUID,
    payload: ApprovalActionIn,
    organization_id: uuid.UUID,
    user_role: str | None = None,
) -> ApprovalStepOut:
    bid = db.execute(
        select(Bid).where(Bid.id == bid_id, Bid.organization_id == organization_id)
    ).scalar_one_or_none()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")

    step = db.execute(
        select(ApprovalStepRecord).where(ApprovalStepRecord.id == step_id, ApprovalStepRecord.bid_id == bid_id)
    ).scalar_one_or_none()
    if not step:
        raise HTTPException(status_code=404, detail="Approval step record not found")

    # Enforce Role-Based Access Control (RBAC) per the project brief
    if user_role:
        normalized_role = user_role.lower()
        role_privileges = {
            "technical": {"technical_contributor", "bid_manager", "owner_admin"},
            "commercial": {"finance_contributor", "bid_manager", "owner_admin"},
            "legal_compliance": {"compliance_reviewer", "bid_manager", "owner_admin"},
            "final": {"approver", "owner_admin"},
        }
        allowed = role_privileges.get(step.flow_type, {"owner_admin"})
        if normalized_role not in allowed:
            raise HTTPException(
                status_code=403,
                detail=f"Permission denied: role '{user_role}' cannot authorize '{step.step_name}'. Requires one of: {', '.join(sorted(allowed))}.",
            )

    action = payload.action.lower()
    if action not in ["approved", "changes_requested", "rejected"]:
        raise HTTPException(status_code=422, detail="Invalid action. Must be approved, changes_requested, or rejected.")

    now = datetime.now(timezone.utc)
    step.status = action
    step.decision_notes = payload.notes
    step.decided_at = now
    step.approver_name = payload.approver_name or "Authorized Officer"
    step.is_invalidated = False

    # Log immutable audit event
    audit = AuditEvent(
        organization_id=organization_id,
        action=f"approval_step_{action}",
        object_type="approval_step",
        object_id=str(step.id),
        before=None,
        after={
            "bid_id": str(bid_id),
            "step_name": step.step_name,
            "status": action,
            "notes": payload.notes,
            "approver": step.approver_name,
        },
    )
    db.add(audit)

    # Invalidation Safeguard: if step requested changes or rejected, subsequent steps must be marked invalidated
    if action in ["changes_requested", "rejected"]:
        downstream = db.execute(
            select(ApprovalStepRecord).where(
                ApprovalStepRecord.bid_id == bid_id,
                ApprovalStepRecord.step_order > step.step_order,
            )
        ).scalars().all()
        for ds in downstream:
            ds.is_invalidated = True
            ds.status = "invalidated"
        bid.stage = BidStage.PREPARING

    # If approved, check if all 4 steps are approved
    if action == "approved":
        all_steps = db.execute(
            select(ApprovalStepRecord).where(ApprovalStepRecord.bid_id == bid_id)
        ).scalars().all()
        if all(s.status == "approved" for s in all_steps):
            bid.stage = BidStage.APPROVED_TO_SUBMIT

    db.commit()
    db.refresh(step)
    return ApprovalStepOut.model_validate(step)


def evaluate_submission_checklist(
    db: Session, bid_id: uuid.UUID, organization_id: uuid.UUID
) -> SubmissionChecklistOut:
    bid = db.execute(
        select(Bid).where(Bid.id == bid_id, Bid.organization_id == organization_id)
    ).scalar_one_or_none()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")

    tender = db.execute(select(Tender).where(Tender.id == bid.tender_id)).scalar_one_or_none()
    tender_title = tender.title if tender else "Tender"

    blockers: list[str] = []

    # 1. Rule 7 & Compliance check
    matrix = evaluate_compliance_matrix(db, tender_id=bid.tender_id, organization_id=organization_id)
    mandatory_criteria_met = matrix.is_mandatory_eligible
    no_expired_evidence = len(matrix.blockers) == 0

    if not mandatory_criteria_met or not no_expired_evidence:
        blockers.extend(matrix.blockers)

    # 2. Approvals check
    workflow = get_or_init_workflow(db, bid_id, organization_id)
    total_steps = len(workflow)
    approved_steps = sum(1 for s in workflow if s.status == "approved" and not s.is_invalidated)
    all_approvals_cleared = (approved_steps == total_steps and total_steps > 0)

    if not all_approvals_cleared:
        pending_names = [s.step_name for s in workflow if s.status != "approved" or s.is_invalidated]
        blockers.append(f"Multi-role approvals incomplete: {', '.join(pending_names)}.")

    # 3. Commercial decimal pricing check (Rule 8)
    commercial_decimal_verified = bid.potential_contract_value is not None and bid.potential_contract_value > 0
    if not commercial_decimal_verified:
        blockers.append("Commercial Pricing Schedule has not been verified or value is missing.")

    # 4. Milestone tasks check
    tasks = db.execute(select(Task).where(Task.bid_id == bid_id)).scalars().all()
    blocked_tasks = [t.title for t in tasks if t.status == TaskStatus.BLOCKED]
    if blocked_tasks:
        blockers.append(f"Blocked bid milestones: {', '.join(blocked_tasks)}.")
    tasks_completed = len(blocked_tasks) == 0

    can_submit = (
        mandatory_criteria_met
        and no_expired_evidence
        and all_approvals_cleared
        and commercial_decimal_verified
        and tasks_completed
    )

    return SubmissionChecklistOut(
        bid_id=bid_id,
        tender_id=bid.tender_id,
        tender_title=tender_title,
        mandatory_criteria_met=mandatory_criteria_met,
        no_expired_evidence=no_expired_evidence,
        commercial_decimal_verified=commercial_decimal_verified,
        all_approvals_cleared=all_approvals_cleared,
        tasks_completed=tasks_completed,
        can_submit=can_submit,
        blockers=blockers,
        total_steps=total_steps,
        approved_steps=approved_steps,
    )


def submit_bid_package(
    db: Session,
    bid_id: uuid.UUID,
    organization_id: uuid.UUID,
    payload: SubmissionExecuteIn,
) -> SubmissionReceiptOut:
    checklist = evaluate_submission_checklist(db, bid_id, organization_id)
    if not checklist.can_submit:
        raise HTTPException(
            status_code=400,
            detail=f"Submission Gate Blocked: {'; '.join(checklist.blockers)}",
        )

    bid = db.execute(select(Bid).where(Bid.id == bid_id)).scalar_one()
    tender = db.execute(select(Tender).where(Tender.id == bid.tender_id)).scalar_one()

    # Generate unique submission reference
    ref_part = (tender.reference_number or "TENDER").replace("/", "-")
    timestamp_str = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    submission_ref = f"SUB-{ref_part}-{timestamp_str[:8]}-{uuid.uuid4().hex[:4].upper()}"

    # Generate cryptographic SHA-256 manifest
    manifest_data = {
        "submission_reference": submission_ref,
        "tender_title": tender.title,
        "tender_ref": tender.reference_number,
        "organization_id": str(organization_id),
        "bid_id": str(bid_id),
        "contract_value": str(bid.potential_contract_value),
        "currency": bid.currency or "PKR",
        "submitted_by": payload.submitted_by_name,
        "declaration_accepted": payload.declaration_accepted,
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
    }
    raw_bytes = json.dumps(manifest_data, sort_keys=True).encode("utf-8")
    sha256_hash = hashlib.sha256(raw_bytes).hexdigest()

    # Check if submission record exists (upsert)
    sub = db.execute(select(SubmissionRecord).where(SubmissionRecord.bid_id == bid_id)).scalar_one_or_none()
    if sub:
        sub.submission_reference = submission_ref
        sub.submitted_by_name = payload.submitted_by_name
        sub.submitted_at = datetime.now(timezone.utc)
        sub.sha256_package_hash = sha256_hash
        sub.package_manifest = manifest_data
        sub.status = "submitted"
    else:
        sub = SubmissionRecord(
            bid_id=bid_id,
            organization_id=organization_id,
            submission_reference=submission_ref,
            submitted_by_name=payload.submitted_by_name,
            sha256_package_hash=sha256_hash,
            package_manifest=manifest_data,
            status="submitted",
        )
        db.add(sub)

    # Transition bid stage
    bid.stage = BidStage.SUBMITTED

    # Audit event
    audit = AuditEvent(
        organization_id=organization_id,
        action="bid_submitted_to_portal",
        object_type="submission",
        object_id=submission_ref,
        before={"stage": "approved_to_submit"},
        after={"stage": "submitted", "sha256": sha256_hash},
    )
    db.add(audit)

    db.commit()
    db.refresh(sub)

    return SubmissionReceiptOut(
        id=sub.id,
        bid_id=bid_id,
        submission_reference=sub.submission_reference,
        tender_title=tender.title,
        submitted_by_name=sub.submitted_by_name,
        submitted_at=sub.submitted_at,
        sha256_package_hash=sub.sha256_package_hash,
        status=sub.status,
        package_manifest=sub.package_manifest,
    )
