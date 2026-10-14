# Relational Data Model & ER Outline

**Date**: 12 October 2026  
**Author**: Lead System Engineer (AI Tender Portal)  
**Standard**: AGENTS.md Binding Standing Rules  
**Source of Truth**: docs/PROJECT_BRIEF.md (Section 9)  

---

## 1. Data Model Principles & Trust Rules

1. **Deterministic Decimal Arithmetic (AGENTS.md Rule 8)**:
   - All monetary values (`estimated_value`, `unit_cost`, `selling_price`, `tax_amount`, `total_price`) utilize `NUMERIC(18, 2)`.
   - Tax percentages use `NUMERIC(5, 4)` (e.g., 0.1800 for 18%).
2. **Four Distinct Status Indicators (AGENTS.md Rule 4 & 5)**:
   - These indicators are separate database fields and distinct UI indicators:
     - `fit_score`: 0 to 100 integer/percentage (statistical opportunity relevance).
     - `mandatory_eligibility_status`: `POTENTIALLY_ELIGIBLE`, `NOT_ELIGIBLE`, `UNDETERMINED`.
     - `proposal_coverage`: 0 to 100 percentage of mandatory + scored tender requirements addressed.
     - `submission_readiness`: `READY_TO_SUBMIT`, `BLOCKED`, `IN_PROGRESS`.
   - **Crucial Rule**: A high `fit_score` never overrides or masks a `NOT_ELIGIBLE` status or missing evidence.
3. **Distinct Lifecycle & Process Fields**:
   - `tender.lifecycle_status`: Buyer procurement state (`UNKNOWN`, `PUBLISHED`, `AMENDED`, `CLOSED`, `CANCELLED`).
   - `bid.stage`: Supplier internal bid pipeline (`DISCOVERED` -> `SHORTLISTED` -> `EVALUATING` -> `PARTICIPATION_APPROVED` -> `PREPARING` -> `INTERNAL_REVIEW` -> `APPROVED_TO_SUBMIT` -> `SUBMITTED` -> `UNDER_EVALUATION` -> `AWARDED` / `LOST` / `WITHDRAWN` / `CANCELLED`).
   - `requirement_assessment.ai_status` vs `reviewer_status`: Separates AI suggestions from human sign-offs.
   - `proposal.approval_state`: Approval status (`DRAFT`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `INVALIDATED_BY_AMENDMENT`).
4. **Unknown Values Preservation (AGENTS.md Rule 1)**:
   - Unknown deadlines, budgets, or categories stay `NULL`. They are never defaulted to `0` or current timestamps.
5. **Human-Confirmed Submission (AGENTS.md Rule 9)**:
   - The status `SUBMITTED` can only be set upon explicit user confirmation recording `confirmed_by_id`, timestamp, and channel. Readiness alone never sets it. AI never signs or submits.

---

## 2. Entity-Relationship Outline

```
[Organization] 1---* [User (Memberships)]
       |
       +---* [Evidence (Document Vault)]
       |         ^
       |         | (pins exact version)
       +---* [Bid] 1---* [RequirementAssessment] *---1 [Requirement] *---1 [Tender]
       |       |                     |                                         |
       |       +---* [Proposal]      +-----------------------+                 +---* [TenderVersion]
       |       |        +---* [ProposalSection]               |                 +---* [Lot]
       |       |                   +---* [ProposalCitation]  |
       |       +---* [PricingSchedule] 1---* [PricingItem]   |
       |       +---* [Task]                                  |
       |       +---* [Approval]                              |
       |       +---1 [Submission]                            |
       |       +---1 [Outcome]                               |
       |                                                     |
       +---* [AuditEvent] (Immutable Log)                    |
       +---* [SavedSearch]                                   |
```

---

## 3. Entity Definitions & Schemas

### 3.1 Organization & Identity
- **`organizations`**:
  - `id`: UUID (Primary Key)
  - `name`: VARCHAR(255)
  - `registration_country`: VARCHAR(2) (Default: 'PK')
  - `legal_identifiers`: JSONB (NTN, STRN, SECP incorporation, provincial sales tax numbers)
  - `business_categories`: JSONB (Array of CPV / procurement categories)
  - `service_regions`: JSONB (Array of geographic regions / provinces)
  - `currencies`: JSONB (Array of supported operating currencies)
  - `company_size`: VARCHAR(50)
  - `min_opportunity_value`: NUMERIC(18, 2)
  - `max_opportunity_value`: NUMERIC(18, 2)
  - `tender_preferences`: JSONB
  - `profile_completeness`: INTEGER (0-100)
  - `created_at`, `updated_at`: TIMESTAMPTZ

- **`users`**:
  - `id`: UUID (Primary Key)
  - `email`: VARCHAR(320) (Unique)
  - `full_name`: VARCHAR(255)
  - `is_active`: BOOLEAN
  - `is_platform_admin`: BOOLEAN
  - `created_at`, `updated_at`: TIMESTAMPTZ

- **`memberships`**:
  - `id`: UUID (Primary Key)
  - `organization_id`: UUID (FK -> organizations.id)
  - `user_id`: UUID (FK -> users.id)
  - `role`: ENUM (`EXECUTIVE`, `BID_MANAGER`, `PROPOSAL_LEAD`, `TECHNICAL_CONTRIBUTOR`, `FINANCE_COMMERCIAL`, `COMPLIANCE_LEGAL`, `VIEWER`)
  - Unique Constraint: `(organization_id, user_id)`

### 3.2 Sources & Tenders
- **`sources`**:
  - `id`: UUID (Primary Key)
  - `name`: VARCHAR(255)
  - `source_type`: ENUM (`FEDERAL_PPRA`, `PROVINCIAL_PPRA`, `DEPARTMENT`, `CORPORATE`, `SUPPLIER_PORTAL`, `MANUAL`)
  - `access_method`: VARCHAR(100) ('api', 'feed', 'permitted_crawl', 'manual')
  - `base_url`: VARCHAR(1000)
  - `refresh_schedule`: VARCHAR(100) (Cron expression)
  - `last_checked_at`, `last_success_at`: TIMESTAMPTZ
  - `health`: ENUM (`HEALTHY`, `DEGRADED`, `FAILING`, `UNKNOWN`)
  - `coverage_notes`: TEXT

- **`tenders`**:
  - `id`: UUID (Primary Key)
  - `organization_id`: UUID (FK -> organizations.id, NULL for public tenders, populated for private uploads)
  - `source_id`: UUID (FK -> sources.id, Nullable)
  - `uploaded_by_id`: UUID (FK -> users.id, Nullable)
  - `buyer_name`: VARCHAR(255)
  - `reference_number`: VARCHAR(255)
  - `title`: VARCHAR(500)
  - `description`: TEXT
  - `category`: VARCHAR(255)
  - `procurement_type`: VARCHAR(100)
  - `country`: VARCHAR(2) (ISO-3166-1 alpha-2)
  - `region`: VARCHAR(100)
  - `city`: VARCHAR(100)
  - `lifecycle_status`: ENUM (`UNKNOWN`, `PUBLISHED`, `AMENDED`, `CLOSED`, `CANCELLED`)
  - `published_at`: TIMESTAMPTZ (Nullable - stays NULL if unknown)
  - `deadline_at`: TIMESTAMPTZ (Nullable - stays NULL if unknown)
  - `deadline_timezone`: VARCHAR(64) (e.g., 'Asia/Karachi')
  - `estimated_value`: NUMERIC(18, 2) (Nullable - stays NULL if unknown)
  - `currency`: VARCHAR(3) (Nullable)
  - `original_url`: VARCHAR(2000)
  - `first_retrieved_at`, `last_checked_at`: TIMESTAMPTZ
  - `extraction_confidence`: FLOAT (Nullable)
  - `unresolved_fields`: JSONB (Array of field names missing/unclear)
  - `verification_status`: ENUM (`VERIFIED`, `NEEDS_VERIFICATION`)
  - `dedup_key`: VARCHAR(255) (Indexed)
  - `deadline_history`: JSONB (Array of prior deadlines with corrigendum citations)
  - `is_private`: BOOLEAN (Default: FALSE)

- **`tender_versions`**:
  - `id`: UUID (Primary Key)
  - `tender_id`: UUID (FK -> tenders.id)
  - `version_number`: INTEGER
  - `document_hash`: VARCHAR(128) (SHA256)
  - `original_filename`: VARCHAR(500)
  - `storage_key`: VARCHAR(1000)
  - `retrieved_at`: TIMESTAMPTZ
  - `superseded_by_id`: UUID (FK -> tender_versions.id, Nullable)
  - `change_summary`: JSONB (Structured diff of dates, scope, lots)

- **`lots`**:
  - `id`: UUID (Primary Key)
  - `tender_id`: UUID (FK -> tenders.id)
  - `lot_number`: VARCHAR(50)
  - `title`: VARCHAR(500)
  - `scope`: TEXT
  - `estimated_value`: NUMERIC(18, 2)
  - `currency`: VARCHAR(3)

### 3.3 Compliance & Evidence Vault
- **`requirements`**:
  - `id`: UUID (Primary Key)
  - `tender_id`: UUID (FK -> tenders.id)
  - `lot_id`: UUID (FK -> lots.id, Nullable: NULL = applies to whole tender)
  - `tender_version_id`: UUID (FK -> tender_versions.id)
  - `code`: VARCHAR(50) (e.g. 'REQ-001')
  - `category`: VARCHAR(100) ('Legal', 'Technical', 'Financial', 'Experience')
  - `kind`: ENUM (`MANDATORY`, `SCORED`, `INFORMATIONAL`)
  - `original_text`: TEXT
  - `citation`: VARCHAR(500) (Document name + Page/Section)
  - `origin`: ENUM (`EXTRACTED`, `MANUAL`)
  - `extraction_confidence`: FLOAT

- **`evidence` (Document Vault)**:
  - `id`: UUID (Primary Key)
  - `organization_id`: UUID (FK -> organizations.id)
  - `doc_type`: VARCHAR(100) (e.g. 'NTN Certificate', 'ISO 9001', 'Audit Report')
  - `title`: VARCHAR(500)
  - `version`: INTEGER
  - `supersedes_id`: UUID (FK -> evidence.id, Nullable)
  - `issuer`: VARCHAR(255)
  - `owner_id`: UUID (FK -> users.id)
  - `issued_on`: DATE
  - `expires_on`: DATE (Crucial: expired evidence triggers warning and disqualification risk)
  - `jurisdiction`: VARCHAR(100)
  - `confidentiality`: VARCHAR(50) ('Public', 'Confidential', 'Restricted')
  - `approval_state`: ENUM (`DRAFT`, `IN_REVIEW`, `APPROVED`, `EXPIRED`, `ARCHIVED`)
  - `storage_key`: VARCHAR(1000)
  - `sha256`: VARCHAR(64)

- **`requirement_assessments`**:
  - `id`: UUID (Primary Key)
  - `requirement_id`: UUID (FK -> requirements.id)
  - `organization_id`: UUID (FK -> organizations.id)
  - `bid_id`: UUID (FK -> bids.id, Nullable)
  - `ai_status`: ENUM (`MEETS`, `PARTIALLY_MEETS`, `DOES_NOT_MEET`, `MISSING_EVIDENCE`, `NEEDS_INTERPRETATION`, `NOT_APPLICABLE`)
  - `reviewer_status`: ENUM (`UNREVIEWED`, `MEETS`, `PARTIALLY_MEETS`, `DOES_NOT_MEET`, `NOT_APPLICABLE`)
  - `evidence_id`: UUID (FK -> evidence.id, Nullable - pinned exact version)
  - `owner_id`: UUID (FK -> users.id)
  - `due_date`: DATE
  - `notes`: TEXT
  - `not_applicable_justification`: TEXT (Mandatory when reviewer_status is NOT_APPLICABLE)
  - `reviewed_by_id`: UUID (FK -> users.id)
  - `reviewed_at`: TIMESTAMPTZ

### 3.4 Bids, Proposals & Commercial Workspace
- **`bids`**:
  - `id`: UUID (Primary Key)
  - `organization_id`: UUID (FK -> organizations.id)
  - `tender_id`: UUID (FK -> tenders.id)
  - `stage`: ENUM (`DISCOVERED`, `SHORTLISTED`, `EVALUATING`, `PARTICIPATION_APPROVED`, `PREPARING`, `INTERNAL_REVIEW`, `APPROVED_TO_SUBMIT`, `SUBMITTED`, `UNDER_EVALUATION`, `AWARDED`, `LOST`, `WITHDRAWN`, `CANCELLED`)
  - `decision`: ENUM (`BID`, `NO_BID`, `HOLD`, Nullable)
  - `decision_rationale`: TEXT
  - `decided_by_id`: UUID (FK -> users.id)
  - `decided_at`: TIMESTAMPTZ
  - `decision_review_date`: DATE
  - `owner_id`: UUID (FK -> users.id)
  - `internal_deadline`: TIMESTAMPTZ
  - `expected_bid_cost`: NUMERIC(18, 2)
  - `potential_contract_value`: NUMERIC(18, 2)
  - `currency`: VARCHAR(3)
  - `fit_score`: INTEGER (0-100)
  - `mandatory_eligibility_status`: ENUM (`POTENTIALLY_ELIGIBLE`, `NOT_ELIGIBLE`, `UNDETERMINED`)
  - `proposal_coverage`: INTEGER (0-100)
  - `submission_readiness`: ENUM (`READY_TO_SUBMIT`, `BLOCKED`, `IN_PROGRESS`)

- **`proposals`**:
  - `id`: UUID (Primary Key)
  - `bid_id`: UUID (FK -> bids.id)
  - `organization_id`: UUID (FK -> organizations.id)
  - `title`: VARCHAR(500)
  - `template_name`: VARCHAR(100)
  - `version_number`: INTEGER
  - `approval_state`: ENUM (`DRAFT`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `INVALIDATED_BY_AMENDMENT`)
  - `approved_by_id`: UUID (FK -> users.id, Nullable)
  - `approved_at`: TIMESTAMPTZ
  - `invalidated_at`: TIMESTAMPTZ
  - `invalidation_reason`: TEXT

- **`proposal_sections`**:
  - `id`: UUID (Primary Key)
  - `proposal_id`: UUID (FK -> proposals.id)
  - `section_number`: VARCHAR(50) (e.g. '1.1', '2.0')
  - `title`: VARCHAR(255)
  - `content`: TEXT
  - `section_owner_id`: UUID (FK -> users.id)
  - `ai_generated`: BOOLEAN (Default: FALSE)
  - `reviewed_by_id`: UUID (FK -> users.id, Nullable)
  - `is_locked`: BOOLEAN (Default: FALSE)

- **`proposal_citations`**:
  - `id`: UUID (Primary Key)
  - `proposal_section_id`: UUID (FK -> proposal_sections.id)
  - `citation_text`: VARCHAR(500)
  - `tender_document_id`: UUID (FK -> tender_versions.id, Nullable)
  - `evidence_id`: UUID (FK -> evidence.id, Nullable)
  - `page_number`: INTEGER
  - `section_ref`: VARCHAR(100)

- **`pricing_schedules`**:
  - `id`: UUID (Primary Key)
  - `bid_id`: UUID (FK -> bids.id)
  - `lot_id`: UUID (FK -> lots.id, Nullable)
  - `currency`: VARCHAR(3) (Default: 'PKR')
  - `total_net_amount`: NUMERIC(18, 2)
  - `tax_rate`: NUMERIC(5, 4)
  - `tax_amount`: NUMERIC(18, 2)
  - `total_gross_amount`: NUMERIC(18, 2)
  - `assumptions`: TEXT
  - `approval_state`: ENUM (`DRAFT`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `INVALIDATED`)

- **`pricing_items`**:
  - `id`: UUID (Primary Key)
  - `pricing_schedule_id`: UUID (FK -> pricing_schedules.id)
  - `item_code`: VARCHAR(50)
  - `description`: TEXT
  - `quantity`: NUMERIC(12, 2)
  - `unit`: VARCHAR(50)
  - `unit_cost`: NUMERIC(18, 2)
  - `unit_selling_price`: NUMERIC(18, 2)
  - `discount_percent`: NUMERIC(5, 2)
  - `total_price`: NUMERIC(18, 2)

### 3.5 Tasks, Approvals, Submissions & Outcomes
- **`tasks`**:
  - `id`: UUID (Primary Key)
  - `organization_id`: UUID (FK -> organizations.id)
  - `bid_id`: UUID (FK -> bids.id, Nullable)
  - `task_type`: ENUM (`REGISTRATION`, `DOCUMENT_PURCHASE`, `PREBID_MEETING`, `SITE_VISIT`, `CLARIFICATION`, `BID_SECURITY`, `PHYSICAL_DELIVERY`, `OTHER`)
  - `title`: VARCHAR(500)
  - `status`: ENUM (`TODO`, `IN_PROGRESS`, `BLOCKED`, `DONE`)
  - `assignee_id`: UUID (FK -> users.id)
  - `due_at`: TIMESTAMPTZ
  - `notes`: TEXT

- **`approvals`**:
  - `id`: UUID (Primary Key)
  - `organization_id`: UUID (FK -> organizations.id)
  - `bid_id`: UUID (FK -> bids.id)
  - `proposal_id`: UUID (FK -> proposals.id, Nullable)
  - `pricing_schedule_id`: UUID (FK -> pricing_schedules.id, Nullable)
  - `flow_type`: ENUM (`PARTICIPATION`, `TECHNICAL_PROPOSAL`, `COMMERCIAL_PRICING`, `FINAL_SUBMISSION`)
  - `status`: ENUM (`PENDING`, `APPROVED`, `CHANGES_REQUESTED`, `REJECTED`, `INVALIDATED`)
  - `approver_id`: UUID (FK -> users.id)
  - `decision_notes`: TEXT
  - `decided_at`: TIMESTAMPTZ

- **`submissions`**:
  - `id`: UUID (Primary Key)
  - `bid_id`: UUID (FK -> bids.id) (Unique Constraint)
  - `organization_id`: UUID (FK -> organizations.id)
  - `channel`: ENUM (`ONLINE_PORTAL`, `PHYSICAL_DELIVERY`, `EMAIL`, `HYBRID`)
  - `package_version`: INTEGER
  - `submitted_at`: TIMESTAMPTZ
  - `confirmed_by_id`: UUID (FK -> users.id) (Mandatory human confirmer)
  - `submission_reference`: VARCHAR(255)
  - `receipt_storage_key`: VARCHAR(1000)
  - `notes`: TEXT

- **`outcomes`**:
  - `id`: UUID (Primary Key)
  - `bid_id`: UUID (FK -> bids.id)
  - `lot_id`: UUID (FK -> lots.id, Nullable)
  - `result`: ENUM (`AWARDED`, `LOST`, `CANCELLED`, `WITHDRAWN`, `UNKNOWN`)
  - `decided_date`: DATE
  - `awarded_contract_value`: NUMERIC(18, 2)
  - `loss_reason`: VARCHAR(255)
  - `competitor_winner`: VARCHAR(255)
  - `debrief_notes`: TEXT

- **`audit_events`** (Append-Only Immutable Ledger):
  - `id`: UUID (Primary Key)
  - `organization_id`: UUID (FK -> organizations.id, Nullable)
  - `actor_id`: UUID (FK -> users.id, Nullable)
  - `action`: VARCHAR(100)
  - `object_type`: VARCHAR(100) (Indexed)
  - `object_id`: VARCHAR(64) (Indexed)
  - `before`: JSONB (Nullable)
  - `after`: JSONB (Nullable)
  - `created_at`: TIMESTAMPTZ
  *(Note: No `updated_at` column — rows are immutable)*
