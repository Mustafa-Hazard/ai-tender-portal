# AI Tender Portal

SaaS platform that helps suppliers find, evaluate, prepare, and submit tender proposals.

**Workflow:** Find → Evaluate → Decide → Prepare → Approve → Submit → Track outcome

## Repository structure

| Path | Purpose |
|---|---|
| `apps/web` | Responsive web frontend |
| `apps/api` | Application API (tenants, bids, permissions) |
| `services/ingestion` | Source connectors, OCR/parsing, deduplication |
| `infra` | Deployment and infrastructure config |
| `docs/product` | Product brief and specifications |
| `docs/decisions` | Architecture decision records (ADRs) |

## Status

Scaffolding phase. Pakistan-first launch, configurable for other countries.

## Tech stack

- **Backend:** Python, FastAPI, SQLAlchemy, Alembic
- **Frontend:** Next.js (TypeScript, Tailwind)
- **Data:** PostgreSQL, Redis (job queue), MinIO/S3 (document storage)

## Run locally

Start infrastructure:

    docker compose -f infra/docker-compose.yml up -d

Start the API:

    cd apps/api && source .venv/bin/activate && uvicorn app.main:app --reload

Start the web app:

    cd apps/web && npm run dev
