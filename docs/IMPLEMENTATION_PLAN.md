# Phased Implementation Plan

**Date**: 12 October 2026  
**Author**: Lead System Engineer (AI Tender Portal)  
**Standard**: AGENTS.md Binding Standing Rules  
**Source of Truth**: docs/PROJECT_BRIEF.md & design/figma/  

---

## 1. Plan Overview & Execution Principles

This implementation plan adapts the target roadmap to the findings of the prototype audit. Execution proceeds strictly **one phase per conversation**. At the end of each phase:
1. Automated unit and integration tests run and pass.
2. Linter runs and passes.
3. A browser walkthrough is conducted and verified against `design/figma/`.
4. A concise summary of changes and remaining backlog is produced before stopping for human review.

---

## 2. Phase Breakdown

### Phase 1 — Application Foundation, Shell & Tenant Security
- **Goal**: Establish the core visual shell, design token integration, multi-tenant session model, RBAC matrix, audit event infrastructure, and seed datasets.
- **Deliverables**:
  1. **Theme & Token Integration**: Tailwind CSS v4 design tokens file (`design/tokens.ts`) reflecting the Figma visual system (Navy `#0b1c30`, Primary Blue `#0051d5`/`#2563eb`, Canvas `#f8f9ff`).
  2. **Shared Component Library**: Build 14 enterprise components with loading, empty, and error states:
     - `TenderCard`, `FilterChip`, `SourceBadge`, `StatusPill`, `ConfidenceLabel`, `CitationLink`, `DocumentPreviewShell`, `RequirementRow`, `EvidenceSelector`, `TaskCard`, `Timeline`, `ApprovalPanel`, `PricingTableShell`, `NotificationDrawer`.
  3. **Application Shell Layout**: Global responsive navigation sidebar matching Figma, top header (tenant switcher, search, notifications, profile), and platform admin switch.
  4. **Auth & Multi-Tenant Onboarding**: Account creation, organization profile setup, sector/region capabilities, profile completeness indicator, and "Complete later" option.
  5. **RBAC Enforcement**: Middleware and dependencies for all roles (`EXECUTIVE`, `BID_MANAGER`, `PROPOSAL_LEAD`, `TECHNICAL_CONTRIBUTOR`, `FINANCE_COMMERCIAL`, `COMPLIANCE_LEGAL`, `VIEWER`).
  6. **Audit Event Service**: Append-only audit logger capturing actor, action, object, and before/after state.
  7. **Seed Data for 3 Demo Scenarios**: Pre-loaded organizations, tenders, requirements, and evidence for Scenarios A, B, and C (clearly labelled as fictional).
- **Estimated Agent Effort**: Medium-High (30-40 tool invocations).
- **Key Risks & Mitigations**:
  - *Risk*: Tenant leakage across session boundaries.
  - *Mitigation*: Automated integration tests asserting that Tenant A users receive 403/404 when querying Tenant B data.

---

### Phase 2 — Discovery Hub & Tender Intelligence
- **Goal**: Ingestion pipeline, source connector abstraction, deduplication, search/filter hub, and side-by-side tender detail viewer with citations.
- **Deliverables**:
  1. **Ingestion Pipeline**: Async worker for file uploads (PDF, DOCX, images, URLs) with virus/type check, SHA256 hashing, text extraction, and deduplication.
  2. **Source Connector Interface**: Abstract connector class with two clearly labelled **fictional** sample connectors (`SampleFederalEProcurementConnector`, `SampleProvincialPortalConnector`). No real website scraping.
  3. **Tender Provenance Tracking**: Store and display source link, retrieval timestamp, extraction confidence, and unresolved fields.
  4. **Discovery Workspace**: Filter panel (budget, category, location, fit range, procurement method), table/card view toggle, saved layouts, and "Why recommended" AI rationale.
  5. **Saved Searches & Layouts**: Saved queries with alert cadences (instant, daily digest, weekly).
  6. **Side-by-Side Tender Detail View**: Overview, Scope & Lots, Requirements, Documents, Dates & Amendments, Evaluation, Questions, and Activity tabs. Citation-linked PDF viewer allowing click-to-highlight exact sections.
- **Estimated Agent Effort**: High (40-50 tool invocations).
- **Key Risks & Mitigations**:
  - *Risk*: Large document OCR latency causing timeouts.
  - *Mitigation*: Fully asynchronous job worker with polling progress indicators and idempotent retry hooks.

---

### Phase 3 — Company Profile, Vault & Compliance Engine
- **Goal**: Evidence vault with expiration alerting, obligation language extraction, and the compliance requirements matrix with 4 distinct indicators.
- **Deliverables**:
  1. **Document Vault & Profile**: File manager with document type, version, issuer, expiry date, jurisdiction, and OCR search.
  2. **Approved Content Library**: Curated repository of verified methodologies, executive summaries, case studies, and certifications.
  3. **Requirement Extraction Engine**: Rule-based regex + LLM extraction identifying obligation language ("shall", "must", "is required to") into structured rows with citations. Low-confidence items routed to manual review queue.
  4. **Compliance Center Matrix**: Full interactive matrix displaying requirement ID, text, category, lot, kind, AI suggestion vs reviewer status, linked evidence, and reviewer notes.
  5. **Four Distinct Indicators**:
     - Opportunity Fit (0-100%).
     - Verified Mandatory Eligibility (`POTENTIALLY_ELIGIBLE`, `NOT_ELIGIBLE`, `UNDETERMINED`).
     - Proposal Coverage (0-100%).
     - Submission Readiness (`READY_TO_SUBMIT`, `BLOCKED`, `IN_PROGRESS`).
  6. **Disqualification Risk Engine**: Expired evidence displays prominent warning banners and blocks "Eligible" status. High fit score never masks eligibility failure.
- **Estimated Agent Effort**: Very High (50-60 tool invocations - Core Risk Phase).
- **Key Risks & Mitigations**:
  - *Risk*: AI hallucinates evidence or mistakenly satisfies mandatory requirements with expired certificates.
  - *Mitigation*: Strict programmatic rule enforcement in Python code; AI output is treated solely as a draft suggestion (`ai_status`), distinct from binding human verification (`reviewer_status`).

---

### Phase 4 — Decision & Execution Workspace
- **Goal**: Bid/no-bid qualification framework, participation Kanban board, task manager, calendar, and multi-tier approval flows.
- **Deliverables**:
  1. **Bid / No-Bid Scorecard**: Structured evaluation across 7 dimensions (strategic fit, eligibility, capability gaps, financial capacity, bid cost vs contract value, risks). Authorized user decision logging (`BID`, `NO_BID`, `HOLD`) with mandatory rationale.
  2. **Participation Board**: Interactive Kanban and table views across all 10 bid stages. Gated transitions requiring prerequisite approvals.
  3. **Bid Workspace**: Owner, contributors, lots, internal vs buyer deadlines, tasks, and clarification log.
  4. **Configurable Approval Workflows**: Multi-tier sign-off flows (participation, technical, commercial, final) with separation of duties (author cannot self-approve).
  5. **Calendar & Task Center**: Distinction between buyer submission deadlines and internal reminders, displaying local and original timezones.
- **Estimated Agent Effort**: Medium-High (35-45 tool invocations).
- **Key Risks & Mitigations**:
  - *Risk*: Stage jumping without required compliance or executive sign-offs.
  - *Mitigation*: Server-side validation rejecting stage promotion if pending approvals remain unfulfilled.

---

### Phase 5 — Proposal Builder & Commercial Workspace
- **Goal**: Three-panel proposal editor, citation-grounded drafting, deterministic pricing tables, readiness checklist, and separated export packages.
- **Deliverables**:
  1. **Proposal Wizard**: Select tender/lots -> template -> confirm evidence -> commercial assumptions -> draft generation -> approval routing.
  2. **Three-Panel Proposal Editor**: Document outline (left), rich-text document canvas (center), and requirements/evidence assistant (right).
  3. **Requirement-by-Requirement Drafting**: Factual claims link to vault evidence or tender citations. Missing information creates visible placeholders or questions; AI never invents facts.
  4. **Prompt-Injection Defenses**: Tender text parsed inside strict XML boundaries; regression tests with malicious embedded instructions.
  5. **Commercial Workspace**: Line-item pricing, quantities, unit costs, selling prices, tax rates, margins, and currency conversions using deterministic decimal arithmetic (`Numeric(18, 2)`). Commercial margin visibility restricted by RBAC.
  6. **Submission Readiness Checklist**: Verified mandatory evidence, completed sections, valid approvals, and bid securities.
  7. **Package Exporter**:
     - Technical Package: Word DOCX and PDF with zero commercial pricing content.
     - Financial Package: Complete commercial schedules and tax declarations.
     - Attachment Bundle: ZIP archive with pinned evidence versions.
- **Estimated Agent Effort**: Very High (55-65 tool invocations - Highest Risk Phase).
- **Key Risks & Mitigations**:
  - *Risk*: Commercial pricing leaking into the technical submission envelope.
  - *Mitigation*: Hard server-side export sanitization filter + unit tests asserting 0% pricing keywords or numbers in technical exports.

---

### Phase 6 — Submission, Outcomes, Amendments & Governance
- **Goal**: Formal submission recording, outcome tracking, amendment invalidation engine, BI reporting, and platform administration.
- **Deliverables**:
  1. **Submission Recording Panel**: Detailed buyer delivery instructions. "Submitted" status gated on mandatory human confirmation recording timestamp, reference, and receipt attachment.
  2. **Outcome Tracking**: Win/loss logging, competitor analysis, reason for loss, bid security release, debrief notes.
  3. **Amendment Invalidation Engine**: Corrigendum ingestion -> version diff -> affected requirements flagged -> impacted proposal sections highlighted -> readiness recalculated -> affected approvals automatically invalidated.
  4. **Reports & BI Dashboard**: Win rate calculated strictly as `awarded / (awarded + lost)` excluding unresolved/withdrawn/cancelled, always showing raw counts. Funnel drop-offs, bid costs, and workload distribution.
  5. **Source Administration Console**: Platform admin view for managing connectors, checking crawler health, viewing retry logs, and manual extraction correction queues.
- **Estimated Agent Effort**: High (40-50 tool invocations).
- **Key Risks & Mitigations**:
  - *Risk*: Tender corrigendum arrives but team inadvertently submits outdated proposal version.
  - *Mitigation*: Automated approval invalidation and prominent amendment alert banner across workspace.

---

### Phase 7 — Hardening, Accessibility & Acceptance Verification
- **Goal**: End-to-end verification of all acceptance criteria, security audit, accessibility review, scenario walkthroughs, and documentation.
- **Deliverables**:
  1. **Acceptance Criteria Verification Report**: Criterion-by-criterion assessment mapping to automated tests and screenshots.
  2. **Security & Isolation Audit**: Tenant boundary fuzzing, RBAC bypass attempts, prompt injection test suite, file upload MIME validation, audit event completeness.
  3. **Accessibility Pass (WCAG AA)**: Keyboard-only navigation, visible focus rings, color contrast ratios, screen-reader table headers.
  4. **All UI States Verification**: Verify loading, empty, populated, error, permission-denied, stale-data, expired evidence, and conflicting deadlines across all screens.
  5. **Visual QA vs Figma**: Screen-by-screen comparison against `design/figma/`.
  6. **Demo Scenario Walkthroughs**: Document and record complete end-to-end user journeys for Scenarios A, B, and C.
  7. **Documentation**: Final `README.md` and `docs/KNOWN_LIMITATIONS.md`.
- **Estimated Agent Effort**: Medium-High (30-40 tool invocations).

---

## 3. Demo Scenarios Mapping

| Scenario | Objective | Required Seed Data | Key Verification Checkpoint |
|---|---|---|---|
| **Scenario A** | Fully eligible company preparing a winning bid | Fictional medical supplier with active NTN, ISO 13485, 5 years experience, valid audit reports | Reaches `READY_TO_SUBMIT`, all mandatory evidence resolved, approvals granted, packages cleanly exported. |
| **Scenario B** | Company with missing/expired mandatory evidence | Fictional tech contractor with expired tax clearance certificate and missing ISO 27001 | Eligibility indicator shows `NOT_ELIGIBLE` or `UNDETERMINED`. Prominent warning banner displayed. Submission checklist strictly blocks submission. |
| **Scenario C** | Amended tender invalidating approved proposal | Approved proposal for a hospital equipment tender; buyer publishes Corrigendum changing scope and delivery timeline | Ingestion detects amendment, flags affected requirements, invalidates commercial & technical approvals, and prompts re-review. |
