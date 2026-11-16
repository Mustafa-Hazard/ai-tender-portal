import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class ApprovalStepOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    bid_id: uuid.UUID
    flow_type: str
    step_name: str
    step_order: int
    required_role: str
    status: str
    approver_name: str | None = None
    decision_notes: str | None = None
    decided_at: datetime | None = None
    is_invalidated: bool = False


class ApprovalActionIn(BaseModel):
    action: str = Field(..., description="Action: approved, changes_requested, rejected")
    notes: str = Field(..., min_length=3, description="Audit justification or requested modifications")
    approver_name: str | None = None


class SubmissionChecklistOut(BaseModel):
    bid_id: uuid.UUID
    tender_id: uuid.UUID
    tender_title: str
    mandatory_criteria_met: bool
    no_expired_evidence: bool
    commercial_decimal_verified: bool
    all_approvals_cleared: bool
    tasks_completed: bool
    can_submit: bool
    blockers: list[str] = []
    total_steps: int = 4
    approved_steps: int = 0


class SubmissionExecuteIn(BaseModel):
    submitted_by_name: str | None = "Mustafa Muhammad (CEO)"
    declaration_accepted: bool = True


class SubmissionReceiptOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    bid_id: uuid.UUID
    submission_reference: str
    tender_title: str
    submitted_by_name: str | None = None
    submitted_at: datetime
    sha256_package_hash: str
    status: str
    package_manifest: dict | None = None
