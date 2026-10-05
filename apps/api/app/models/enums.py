import enum


class Role(str, enum.Enum):
    OWNER_ADMIN = "owner_admin"
    BID_MANAGER = "bid_manager"
    BUSINESS_DEVELOPMENT = "business_development"
    TECHNICAL = "technical_contributor"
    FINANCE = "finance_contributor"
    COMPLIANCE = "compliance_reviewer"
    APPROVER = "approver"
    VIEWER = "viewer"


class SourceType(str, enum.Enum):
    GOV_PORTAL = "government_portal"
    GOV_DEPARTMENT = "government_department"
    PRIVATE_CORPORATE = "private_corporate"
    SUPPLIER_PORTAL = "supplier_portal"
    NEWSPAPER = "newspaper"
    EMAIL = "email"
    UPLOAD = "upload"


class SourceHealth(str, enum.Enum):
    UNKNOWN = "unknown"
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    FAILING = "failing"


class TenderLifecycle(str, enum.Enum):
    UNKNOWN = "unknown"
    OPEN = "open"
    AMENDED = "amended"
    CLOSED = "closed"
    CANCELLED = "cancelled"
    AWARDED = "awarded"


class VerificationStatus(str, enum.Enum):
    NEEDS_VERIFICATION = "needs_verification"
    VERIFIED = "verified"


class RequirementKind(str, enum.Enum):
    MANDATORY = "mandatory"
    SCORED = "scored"


class RequirementOrigin(str, enum.Enum):
    EXTRACTED = "extracted"
    MANUAL = "manual"


class ComplianceStatus(str, enum.Enum):
    UNREVIEWED = "unreviewed"
    MEETS = "meets_requirement"
    PARTIALLY_MEETS = "partially_meets"
    DOES_NOT_MEET = "does_not_meet"
    MISSING_EVIDENCE = "missing_evidence"
    NEEDS_INTERPRETATION = "needs_interpretation"
    NOT_APPLICABLE = "not_applicable"


class ApprovalState(str, enum.Enum):
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class BidStage(str, enum.Enum):
    DISCOVERED = "discovered"
    SHORTLISTED = "shortlisted"
    EVALUATING = "evaluating"
    PARTICIPATION_APPROVED = "participation_approved"
    PREPARING = "preparing"
    INTERNAL_REVIEW = "internal_review"
    APPROVED_TO_SUBMIT = "approved_to_submit"
    SUBMITTED = "submitted"
    UNDER_EVALUATION = "under_evaluation"
    AWARDED = "awarded"
    LOST = "lost"
    WITHDRAWN = "withdrawn"
    CANCELLED = "cancelled"


class BidDecision(str, enum.Enum):
    BID = "bid"
    NO_BID = "no_bid"
    HOLD = "hold"


class TaskType(str, enum.Enum):
    REGISTRATION = "registration"
    DOCUMENT_PURCHASE = "tender_document_purchase"
    PREBID_MEETING = "pre_bid_attendance"
    SITE_VISIT = "site_visit"
    CLARIFICATION = "clarification_submission"
    BID_SECURITY = "bid_security"
    PHYSICAL_DELIVERY = "physical_delivery"
    OTHER = "other"


class TaskStatus(str, enum.Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    BLOCKED = "blocked"
    DONE = "done"
