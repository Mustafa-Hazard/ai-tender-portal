# System & Prototype Audit Report

**Date**: 12 October 2026  
**Auditor**: Lead System Engineer (AI Tender Portal)  
**Standard**: AGENTS.md Binding Standing Rules  
**Status**: Audit & Plan Phase Complete (No Application Code Altered)

---

## 1. Executive Summary

An exhaustive technical audit of the current **AI Tender Portal** repository was conducted covering the web application, backend API service, background services, relational database schemas, automated test suite, external infrastructure, and reachable runtime states.

### Key Audit Findings:
1. **Frontend Architecture (`apps/web`)**:
   - Initialized with **Next.js 16.3.8 (App Router, Turbopack)**, **React 19.2.8**, and **Tailwind CSS v4**.
   - Contains only the default starter boilerplate (`page.tsx`, `layout.tsx`, `globals.css`).
   - Zero business pages, navigation layouts, theme tokens, or domain components have been implemented.
   - Builds cleanly with Turbopack in 7.8s (`npm run build`) and passes linting (`eslint`).
2. **Backend Architecture (`apps/api`)**:
   - Implemented in **FastAPI 0.142.2** on **Python 3.14.4** with **SQLAlchemy 2.1.3** and **Alembic 1.20.0**.
   - Core relational models are partially defined in `app/models/` (`Organization`, `User`, `Membership`, `Source`, `Tender`, `TenderVersion`, `Lot`, `Bid`, `BidLot`, `Task`, `Requirement`, `Evidence`, `RequirementAssessment`, `AuditEvent`).
   - Key endpoints implemented in `app/api/tenders.py` for tender creation, listing with tenant isolation, keyword search, and document upload with SHA256 deduping and version chaining.
   - Pytest suite contains **17 passing tests** (0 failures, executed in 0.55s).
3. **Background Services & Ingestion (`services/ingestion`)**:
   - Directory currently contains only a `.gitkeep` placeholder. No automated crawl, OCR, or text extraction worker is active.
4. **Infrastructure Layer (`infra`)**:
   - `docker-compose.yml` provides **PostgreSQL 16**, **Redis 7**, and **MinIO** object storage.
5. **Reachable Runtime State**:
   - Web application was run on `http://localhost:3000` (renders starter template).
   - API was verified at `http://localhost:8000/health` (returns `{"status": "ok", "service": "ai-tender-portal"}`).

---

## 2. Technical Stack Inventory

| Component | Technology | Version | Purpose & Architecture |
|---|---|---|---|
| **Web Framework** | Next.js (App Router) | 16.3.8 | Modern server/client hybrid rendering with Turbopack engine |
| **Frontend Library** | React | 19.2.8 | Concurrent React with Server Components |
| **Styling** | Tailwind CSS | 4.0.0+ | Modern CSS styling with `@tailwindcss/postcss` |
| **Language (Web)** | TypeScript | 5.x | Strict typed JavaScript |
| **API Framework** | FastAPI | 0.142.2 | High-performance asynchronous REST API |
| **Language (API)** | Python | 3.14.4 | Server-side business logic and AI orchestration |
| **Database ORM** | SQLAlchemy | 2.1.3 | Typed ORM supporting PostgreSQL 16 (and SQLite for tests) |
| **Schema Migrations**| Alembic | 1.20.0 | Versioned relational migrations (Revision `ef62fe967e03`) |
| **Validation** | Pydantic | 2.13.5 | Strict schema validation and settings management |
| **Database Driver** | Psycopg 3 | 3.3.6 | Native binary PostgreSQL client |
| **Primary Database** | PostgreSQL | 16 | Relational store with multi-tenant isolation |
| **Cache / Queue** | Redis | 7 | Job queuing and ephemeral cache |
| **Object Storage** | MinIO | Latest | S3-compatible blob storage for raw tender documents |
| **Test Framework** | Pytest | 9.1.1 | Unit and API integration test suite |

---

## 3. Component & State Inventory

### 3.1 Frontend (`apps/web`)
- **Routing**: `src/app/` using App Router. Only root route `/` exists.
- **State Management**: None present. Recommending **TanStack Query (React Query) v5** for server cache management and **Zustand** for transient client workspace state (e.g., active filters, drawer toggles).
- **Styling**: `globals.css` with `@import "tailwindcss";`. No custom design tokens, color palette, or typography scales configured.
- **Shared Components**: None present. All 14 required core components from AGENTS.md must be constructed in Phase 1:
  - `TenderCard`, `FilterChip`, `SourceBadge`, `StatusPill`, `ConfidenceLabel`, `CitationLink`, `DocumentPreviewShell`, `RequirementRow`, `EvidenceSelector`, `TaskCard`, `Timeline`, `ApprovalPanel`, `PricingTableShell`, `NotificationDrawer`.
- **Build / Lint Verification**:
  - `npm run lint`: PASSED (0 errors).
  - `npm run build`: PASSED (Static optimization completed with 0 errors).

### 3.2 Backend (`apps/api`)
- **Structure**:
  - `app/api/`: REST routing (`tenders.py`, `deps.py`).
  - `app/core/`: Configuration and settings (`config.py`).
  - `app/db/`: Session management, base classes, UUID/timestamp mixins, custom enum/JSON types (`base.py`, `session.py`, `types.py`).
  - `app/models/`: Declarative models for domain entities.
  - `app/schemas/`: Pydantic request/response schemas.
  - `app/services/`: Domain services (`tenders.py`).
  - `app/workers/`: Worker placeholders for background processing.
- **Data Layer Compliance**:
  - Tenant isolation is strictly enforced via mandatory `organization_id` foreign keys and header verification (`X-Org-Id`, `X-User-Id`).
  - Unknown values stay `NULL` and are serialized as `"Not stated"` or `"Needs verification"` in accordance with AGENTS.md Rule 1.
  - Money values use `Numeric(18, 2)` (deterministic decimal representation), satisfying AGENTS.md Rule 8.

---

## 4. Test Suite Audit & Passing Assertions

The existing test suite was executed via `pytest`:
- **Results**: `17 passed, 1 warning in 0.55s`
- **Key Passing Assertions**:
  1. `test_health`: API reports healthy status.
  2. `test_unknown_tender_values_stay_null`: Validates that deadline, value, and currency are `NULL` and lifecycle defaults to `UNKNOWN`.
  3. `test_bid_defaults_and_no_decision_until_recorded`: Bid starts in `DISCOVERED` with `decision = None`.
  4. `test_one_bid_per_organization_per_tender`: Database uniqueness constraint blocks duplicate bids.
  5. `test_new_assessment_is_unreviewed_and_has_no_ai_status`: Requirement assessments initialize to `UNREVIEWED` with no AI status.
  6. `test_list_empty`: Empty tenant returns zero tenders.
  7. `test_create_requires_auth`: 401 Unauthorized without auth headers.
  8. `test_header_mismatch_is_forbidden`: 403 Forbidden when user does not belong to the requested organization.
  9. `test_unknown_values_are_not_stated`: API response contains explicit `"not_stated"` array for missing fields.
  10. `test_naive_deadline_is_rejected`: Timezone-naive datetime inputs are rejected with 422 Unprocessable Entity.
  11. `test_tenant_isolation`: Verifies that Organization A cannot list or retrieve Organization B's private tenders.
  12. `test_duplicate_tender_returns_409_with_existing_id`: Duplicate reference number conflict returns 409 with existing ID.
  13. `test_search_by_keyword`: Case-insensitive title and buyer search works correctly.
  14. `test_document_versioning_and_dedup`: Identical file hash returns existing version; new file hash chains `superseded_by_id`.
  15. `test_upload_rejects_unsupported_type`: Non-whitelisted MIME types (e.g. `.exe`) are rejected with 400.
  16. `test_other_org_cannot_upload_to_tender`: Cross-tenant upload attempts are blocked with 404.

---

## 5. Reachable Screen Inventory & Environment Observations

- **Web Prototype Route (`/`)**:
  - Reachable on `http://localhost:3000`.
  - Content: Vercel / Next.js boilerplate landing page.
  - Verified via Next.js SSR HTML response.
- **Environment Automation Constraints**:
  - Browser subagent attempted to launch Chromium via Playwright, but encountered a network 404 on Azure/Akamai CDN for the Windows Playwright driver zip (`playwright-1.57.0-win32_x64.zip`) within the sandboxed environment.
  - Runtime validation was conducted via direct local HTTP dev server interactions, curl verification, and build analysis.

---

## 6. Working Agreements Compliance Check

- **Working in Existing Prototype**: Preserved `apps/web`, `apps/api`, and `infra`. No destructive rewrites performed.
- **Audit Deliverable**: No application code modified in this planning turn.
