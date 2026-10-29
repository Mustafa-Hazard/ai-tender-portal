import uuid
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict

from app.models.enums import ApprovalState, ComplianceStatus, RequirementKind, RequirementOrigin


class EvidenceCreate(BaseModel):
    doc_type: str
    title: str
    issuer: str | None = None
    issued_on: date | None = None
    expires_on: date | None = None
    jurisdiction: str | None = None
    confidentiality: str | None = "internal"
    approval_state: ApprovalState = ApprovalState.APPROVED
    storage_key: str | None = None
    sha256: str | None = None


class EvidenceUpdate(BaseModel):
    title: str | None = None
    issuer: str | None = None
    issued_on: date | None = None
    expires_on: date | None = None
    jurisdiction: str | None = None
    approval_state: ApprovalState | None = None


class EvidenceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    doc_type: str
    title: str
    version: int
    supersedes_id: uuid.UUID | None
    issuer: str | None
    issued_on: date | None
    expires_on: date | None
    is_expired: bool = False
    days_to_expiry: int | None = None
    jurisdiction: str | None
    confidentiality: str | None
    approval_state: ApprovalState
    storage_key: str | None
    sha256: str | None
    created_at: datetime
    updated_at: datetime


class EvidenceListOut(BaseModel):
    items: list[EvidenceOut]
    total: int
    expired_count: int = 0
    expiring_soon_count: int = 0


class RequirementAssessmentUpdate(BaseModel):
    reviewer_status: ComplianceStatus
    evidence_id: uuid.UUID | None = None
    notes: str | None = None
    not_applicable_justification: str | None = None  # Mandatory if reviewer_status == NOT_APPLICABLE


class RequirementAssessmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    requirement_id: uuid.UUID
    organization_id: uuid.UUID
    bid_id: uuid.UUID | None
    ai_status: ComplianceStatus | None
    reviewer_status: ComplianceStatus
    evidence_id: uuid.UUID | None
    due_date: date | None
    notes: str | None
    not_applicable_justification: str | None
    reviewed_at: datetime | None


class ComplianceMatrixRow(BaseModel):
    requirement_id: uuid.UUID
    code: str
    category: str
    kind: RequirementKind
    original_text: str
    citation: str | None
    extraction_confidence: float | None
    ai_status: ComplianceStatus | None
    reviewer_status: ComplianceStatus
    linked_evidence: EvidenceOut | None = None
    is_evidence_expired: bool = False
    not_applicable_justification: str | None = None
    notes: str | None = None


class ComplianceMatrixOut(BaseModel):
    tender_id: uuid.UUID
    tender_title: str
    rows: list[ComplianceMatrixRow]
    total_requirements: int
    mandatory_count: int
    mandatory_met_count: int
    is_mandatory_eligible: bool
    eligibility_status: str  # potentially_eligible, not_eligible, undetermined
    blockers: list[str] = []
    coverage_percent: int
