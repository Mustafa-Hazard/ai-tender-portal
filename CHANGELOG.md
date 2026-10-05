# Changelog

All notable changes to this project are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows [SemVer](https://semver.org/).

## [Unreleased]

## [0.1.0] - 2026-10-05

### Added
- Repository structure: `apps/api`, `apps/web`, `services/ingestion`, `infra`, `docs`.
- FastAPI backend skeleton with `/health` endpoint.
- Next.js (TypeScript, Tailwind) frontend skeleton.
- Local infrastructure via Docker Compose: PostgreSQL, Redis, MinIO.
- Core data models and initial Alembic migration (15 tables): organizations, users, memberships, sources, tenders, tender versions, lots, requirements, evidence, requirement assessments, bids, tasks, audit events.
- Tender API: search with filters, detail, manual create, versioned document upload.
- Duplicate detection (buyer + reference, SHA-256 file hash), tenant isolation, audit events.
- Unknown tender values return as `null` with a `not_stated` list.
- Git workflow documentation, PR template, and CI for backend tests.

### Security
- Temporary header-based identity (`X-Org-Id`, `X-User-Id`). **Not for deployment**; replaced by real authentication in an upcoming release.
- Upload malware scanning is not implemented yet (TODO in upload endpoint).
