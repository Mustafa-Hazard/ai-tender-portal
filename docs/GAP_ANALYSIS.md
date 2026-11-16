# UI & Functional Gap Analysis

**Date**: 12 October 2026  
**Auditor**: Lead System Engineer (AI Tender Portal)  
**Reference**: docs/PROJECT_BRIEF.md (Section 15 Minimum Screen Set) & design/figma/ (Figma Export)  
**Standard**: AGENTS.md Binding Standing Rules  

---

## 1. Overview & Analysis Methodology

This document evaluates the 22 required screens/modules outlined in Section 15 of `docs/PROJECT_BRIEF.md` against:
1. **Existing Prototype Implementation** (`apps/web` frontend & `apps/api` backend).
2. **Figma Visual Design Deliverables** (33 exported screens and states in `design/figma/`).
3. **AGENTS.md Non-Negotiable Trust Rules** (Four distinct indicators, unknown values as "Not stated", citations, separate AI vs reviewer statuses, deterministic decimal pricing, approval invalidation on amendment).

---

## 2. Comprehensive 22-Screen Gap Analysis Matrix

| # | Screen / Module | Brief Section | UI Status | Figma Match | Backend API Status | Key Gaps & Specific Remediation Actions |
|---|---|---|---|---|---|---|
| **1** | **Onboarding** | Section 6.1, 15 | **Missing** | **Partial** | **Partial** | No multi-step onboarding wizard in `apps/web`. Figma provides empty states for team/profile, but lacks the step-by-step setup flow (Org creation -> Sector selection -> Capability tagging -> Initial document vault drop -> Team invite). Org models exist in API. |
| **2** | **Dashboard** | Section 6.2, 15 | **Missing** | **Yes** | **Partial** | Next.js has only starter template. Figma provides 3 complete screens: Active & Populated, API Error, and Foundation. API has tender list and bid models, but lacks aggregated metrics endpoint (active bids, pending compliance actions, deadline ticker). |
| **3** | **Discovery (Table & Cards)** | Section 6.3, 15 | **Missing** | **Yes** | **Partial** | Figma provides Phase 2 Discovery Hub with table/card layouts, filter panels, and fit badges. API implements basic text search and listing, but lacks faceted filtering (budget range, region, procurement method, category) and "Why recommended" explainability. |
| **4** | **Saved Searches** | Section 6.3, 15 | **Missing** | **Yes** | **Missing** | Figma provides 3 screens (Workspace, Zero Results, Initial Empty). Backend has no `saved_searches` table or alert cadence scheduler (instant, daily digest, weekly). |
| **5** | **Tender Comparison** | Section 6.3, 15 | **Missing** | **Partial** | **Missing** | Figma shows discovery comparison widgets. Multi-tender comparison view (up to 4 tenders side-by-side comparing scope, lots, eligibility, and deadlines) is missing in UI and has no specialized backend comparison endpoint. |
| **6** | **Tender Detail & Doc Viewer** | Section 6.4, 15 | **Missing** | **Partial** | **Partial** | API supports document upload, versioning, and detail fetching. However, the dedicated side-by-side document viewer with PDF page deep-linking, citation highlights, and lot tabs is completely missing from `apps/web`. |
| **7** | **Bid / No-Bid Evaluation** | Section 6.5, 15 | **Missing** | **Yes** | **Partial** | Figma Phase 3 covers bid cards and inspection drawers. API has `BidDecision` (BID, NO_BID, HOLD) and rationale fields, but lacks the 7-factor evaluation assessment scorecards (strategic fit, capability gaps, financial capacity, risks). |
| **8** | **Participation Board** | Section 6.6, 15 | **Missing** | **Yes** | **Partial** | Figma provides Phase 3 Kanban board with lifecycle stages. API models `BidStage` enum with 10 states, but lacks drag-and-drop Kanban UI, stage transition gating rules, and batch status update endpoints. |
| **9** | **Bid Workspace** | Section 6.6, 15 | **Missing** | **Yes** | **Partial** | Figma Phase 3 covers workspace drawers with team assignees and dates. UI is not built. API has `Bid` and `Task` models, but lacks milestone tracking, risk logs, and clarification message threads. |
| **10** | **Compliance Matrix & Drawer** | Section 6.7, 15 | **Missing** | **Yes** | **Partial** | Figma Phase 4 provides complete 100% compliant, clearance, and empty states. API has `Requirement` and `RequirementAssessment` models. UI matrix with side-drawer, citation linking, reviewer overrides, and four separate indicators is not built. |
| **11** | **Company Profile** | Section 6.8, 15 | **Missing** | **Yes** | **Partial** | Figma Phase 5 covers Company Profile with locked shell, empty setup, and critical expiry states. API has `Organization` model, but lacks reusable capability cards, past performance records, and profile completeness calculator. |
| **12** | **Document Vault** | Section 6.8, 15 | **Missing** | **Yes** | **Partial** | Figma Phase 7 provides populated, empty, and critical expiry blocker states. API has `Evidence` model with `expires_on` and `sha256`. UI file manager with OCR text search, version history, and expiry alerts is missing in `apps/web`. |
| **13** | **Proposal Wizard, Editor & Preview** | Section 6.9, 15 | **Missing** | **Yes** | **Missing** | Figma Phase 6 provides Initial Draft, Review Workspace, and Critical Compliance Blocker states. Backend has no `Proposal` model yet. Three-panel editor (Outline, Draft, Assistant/Citations) and AI drafting actions are completely unbuilt. |
| **14** | **Commercial Schedule** | Section 6.10, 15 | **Missing** | **Partial** | **Missing** | Partially represented inside Proposal Builder. Dedicated commercial line-item table with multi-currency support, tax calculation, margin visibility gating, and deterministic decimal arithmetic is missing in both UI and backend. |
| **15** | **Approvals** | Section 6.11, 15 | **Missing** | **Partial** | **Missing** | Represented as approval panels in Figma. Needs universal approval workflow engine supporting separation of duties (e.g. author cannot approve their own commercial bid) and automatic invalidation upon tender amendment. |
| **16** | **Submission Checklist & Receipt** | Section 6.12, 15 | **Missing** | **Partial** | **Missing** | Figma Phase 6 shows compliance blockers. Dedicated buyer instruction checklist, confirmation dialogs (ensuring status 'Submitted' requires explicit human confirmation per Rule 9), and timestamped receipt logging are missing. |
| **17** | **Calendar & Tasks** | Section 6.13, 15 | **Missing** | **Yes** | **Partial** | Figma Phase 8 covers Calendar/Tasks management, empty state, and critical overdue blocker state. API has `Task` model with `TaskType` enum. Calendar view distinguishing buyer hard deadlines from internal reminders is missing in UI. |
| **18** | **Notifications** | Section 6.13, 15 | **Missing** | **Partial** | **Missing** | Figma shows notification bell and top bar indicators. Missing slide-out notification drawer, unread counters, and preference controls for in-app vs email digests. |
| **19** | **Reports & BI** | Section 6.14, 15 | **Missing** | **Yes** | **Missing** | Figma Phase 9 covers Populated BI, Empty state, and Pipeline error state. Backend has no analytics aggregation services. Calculation of win rate via `awarded / (awarded + lost)` with counts (Rule 14) is not implemented. |
| **20** | **Team & Permissions** | Section 6.15, 15 | **Missing** | **Yes** | **Partial** | Figma Phase 10 covers Team Management, Empty onboarding, and Workload bottleneck states. API has `Membership` and `Role` enum. Invitation flow, role change UI, and workload distribution metrics are unbuilt. |
| **21** | **Settings & Workspace** | Section 6.15, 15 | **Missing** | **Yes** | **Partial** | Figma Phase 10 provides an extensive 4977px settings screen. Organization details, currency preferences, jurisdiction rules, and API keys are not implemented in UI. |
| **22** | **Source Administration** | Section 6.16, 15 | **Missing** | **No** | **Partial** | No dedicated Figma screen exists (Settings touches on it). Platform admin console to inspect crawler health, refresh schedules, connector errors, and extraction review queues is completely missing. |

---

## 3. Visual & Token Gaps (Figma vs. Application Code)

1. **Theme Tokens**: The existing web app uses uncustomized Tailwind CSS v4 defaults. The Figma designs utilize a distinct enterprise palette:
   - Deep Navy text (`#0b1c30`).
   - Restrained Blue actions (`#0051d5` / `#2563eb`).
   - Light cool-neutral backgrounds (`#f8f9ff`).
   - Clean white cards (`#ffffff`) with subtle 1px borders (`#e2e2e6`).
   - High-contrast semantic badges (Green `#009668`, Amber `#d97706`, Red `#ba1a1a`).
2. **Missing Figma Screens**:
   - Standalone first-time onboarding stepper.
   - Full side-by-side document viewer with PDF citation highlighter.
   - Dedicated platform Source Administration console.
   - Standalone universal Approvals inbox.
   - Post-submission formal receipt confirmation dialog.

---

## 4. Trust Rules & Edge Case Coverage Gaps

AGENTS.md mandates strict edge cases across all major screens. Currently, none of the frontend screens exist, so every screen must be built with these states:
- **Mandatory UI States**: Loading, Empty, Populated, Error, Permission-Denied, Stale-Data.
- **Specific Domain States**:
  - Missing source documents / Low-confidence OCR banner.
  - Expired evidence warning (blocking 'Eligible' status).
  - Conflicting deadlines (original timezone vs local timezone).
  - Failed AI generation / retry without losing human edits.
  - Pending multi-stage approval.
  - Cancelled tender preserving bidder preparation history.
  - Material amendment after approval invalidating prior sign-offs.
