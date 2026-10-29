# Open Questions & Strategic Decisions Requiring Confirmation

**Date**: 12 October 2026  
**Author**: Lead System Engineer (AI Tender Portal)  
**Status**: Pending Human Stakeholder Confirmation  
**Reference**: docs/PROJECT_BRIEF.md & AGENTS.md  

---

## 1. Overview

Before starting Phase 1 implementation code, the following architectural, product, and legal decisions must be reviewed and confirmed. Where appropriate, recommended engineering defaults are provided based on the project brief and AGENTS.md rules.

---

## 2. Decision Log & Open Questions

### 2.1 Launch Countries & Sector Taxonomy
- **Question**: Is Pakistan the exclusive launch geography for the MVP pilot, and what industry sector classification should be used?
- **Options**:
  - *Option A (Recommended)*: Pakistan-first launch (default country `PK`, default currency `PKR`), using a unified procurement taxonomy combining CPV (Common Procurement Vocabulary) with Pakistan-specific categories (Works, Goods, Services, Consulting) and provincial sector tags (e.g. Punjab Health, Sindh IT).
  - *Option B*: Multi-country generic taxonomy from Day 1 (PK, UAE, Saudi Arabia).
- **Engineering Recommendation**: Option A. Configurable country code and currency fields in the database schema ensure international expansion requires zero schema changes later.

### 2.2 First Source List, Access Rights & Legal Permissions
- **Question**: Which public and corporate procurement portals constitute the initial source roster, and what are their confirmed access policies?
- **Candidate Sources**: Federal PPRA (EPADS), Punjab PPRA, Sindh PPRA, Khyber Pakhtunkhwa PPRA, Baluchistan PPRA, and corporate portals.
- **Constraints (AGENTS.md Rule 13)**: The MVP must NEVER bypass authentication, access restrictions, or site terms of service.
- **Engineering Recommendation**: For MVP, utilize manual upload ingestion as the primary mechanism, supplemented by 2 clearly marked fictional sample connectors (`SampleFederalEProcurementConnector`, `SampleProvincialPortalConnector`). Conduct legal/terms-of-service verification for live automated feeds before enabling production scrapers or API connectors.

### 2.3 Document Languages & Multilingual OCR
- **Question**: What languages are required for document ingestion, requirement extraction, and proposal generation?
- **Considerations**: While tender notices and RFP documents in Pakistan are predominantly published in English, official annexures, government gazettes, and tax certificates frequently contain Urdu text or bilingual stamps.
- **Engineering Recommendation**: Primary processing pipeline in English (UTF-8). Ingestion pipeline will include Tesseract / OCR support for bilingual English + Urdu text extraction. Fallback to manual correction queue if confidence is low.

### 2.4 Submission Formats & Buyer Delivery Constraints
- **Question**: What submission package formats must the export engine support, and how should physical vs electronic submissions be handled?
- **Context**: In Pakistan public procurement (PPRA Rules 36a/36b), tenders frequently mandate "Single Stage Two Envelope" procedures requiring physical hardcopy submission in separately sealed wax envelopes (one technical, one financial), often accompanied by original physical bank guarantees (Bid Security).
- **Engineering Recommendation**:
  - Export engine produces two clean, separated packages:
    1. Technical Package (DOCX + printable PDF, strictly free of commercial pricing per AGENTS.md Rule 10).
    2. Financial Package (Commercial schedule, pricing tables, tax breakdowns).
    3. Attachment Archive (ZIP with pinned evidence documents).
  - Explicit UI guidance stating: "Readiness checklist does not constitute submission or buyer acceptance." Status "Submitted" requires explicit user confirmation with delivery receipt upload.

### 2.5 Subscription Limits & Resource Quotas
- **Question**: What are the multi-tenant storage, user seat, and AI token quotas for trial and production tiers?
- **Proposed Tier Limits**:
  - *Starter*: 5 team members, 5 GB document vault, 50 AI requirement extractions/month.
  - *Enterprise*: Unlimited seats, 100 GB vault storage, dedicated rate limits.
- **Engineering Recommendation**: Implement tier limits as a flexible JSONB configuration on the `Organization` record, with soft warning alerts at 80% usage and hard caps on file uploads.

### 2.6 Review Roles & Separation of Duties
- **Question**: What is the exact sign-off authority hierarchy for bid approvals, and which roles can override AI suggestions?
- **Roles in Brief**: `EXECUTIVE`, `BID_MANAGER`, `PROPOSAL_LEAD`, `TECHNICAL_CONTRIBUTOR`, `FINANCE_COMMERCIAL`, `COMPLIANCE_LEGAL`, `VIEWER`.
- **Engineering Recommendation**:
  - `BID_MANAGER` or `EXECUTIVE`: Can record binding Bid/No-Bid decision.
  - `COMPLIANCE_LEGAL`: Can verify mandatory compliance and approve "Not Applicable" justifications.
  - `FINANCE_COMMERCIAL`: Exclusive permission to edit pricing schedules and view internal margin percentages.
  - Strict separation of duties: A user cannot approve an approval step they personally authored.

### 2.7 Data Retention, Multi-Tenant Privacy & LLM Training
- **Question**: What is the data retention policy for uploaded bid materials, and how is commercial confidentiality guaranteed against AI model training?
- **Engineering Recommendation**:
  - Strict zero-training policy: Contractual zero-data-retention endpoints with cloud LLM providers (e.g. Gemini / OpenAI Enterprise terms).
  - All proprietary company vault evidence and tender responses are stored with tenant-isolated S3 keys and never shared across organization boundaries.
  - Organization data deletion triggers hard cascade deletion of private documents, bids, and proposals, while retaining anonymized audit event IDs.

### 2.8 External Enterprise Integrations
- **Question**: Are external enterprise integrations (e.g. ERP, CRM, Slack, Microsoft Teams, SharePoint) expected for the MVP, or deferred to post-launch?
- **Engineering Recommendation**: Defer live third-party ERP/CRM integrations to Phase 6+ roadmap. MVP will focus on webhook triggers and email notifications.

### 2.9 Clean Demarcation of Bidder-Only Scope
- **Question**: Should any buyer-side procurement features (tender publication, bid opening evaluation committee consoles) be supported?
- **Engineering Recommendation**: Enforce strictly **bidder-side SaaS** architecture: "Find -> Evaluate -> Decide -> Prepare -> Approve -> Submit -> Track outcome." Buyer-side features are out of scope.
