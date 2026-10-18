# AI Tender Portal

Multi-tenant tender evaluation and proposal platform with FastAPI, Next.js, PostgreSQL, Redis, and MinIO.

<!-- add screenshot here -->

## About
AI Tender Portal is a full-stack platform built during the Wenawa traineeship to manage the procurement proposal lifecycle for suppliers. The system helps organizations find tender notices, parse and evaluate requirements, collaborate on bid preparation, and track submission outcomes. It is built as a multi-tenant application with separate tenant data boundaries, structured approval steps, and document storage. The architecture separates a Python FastAPI service from a Next.js web application.

## Features
- **Tender Pipeline Management:** Tracks opportunities across structured stages: Find, Evaluate, Decide, Prepare, Approve, Submit, and Track Outcome.
- **Multi-Tenant Data Modeling:** Tenant-scoped schemas for managing organizations, bids, users, and compliance rules.
- **Document Vault & Object Storage:** S3-compatible storage integration (MinIO for development) to store procurement specifications and draft files.
- **Approval Workflows:** Structured review and approval stages before proposals are marked ready for submission.
- **REST API with Automated Tests:** FastAPI backend with Pydantic validation models, SQLAlchemy ORM mappings, Alembic database migrations, and pytest test suite.

## Tech Stack
*Stack verified from `apps/api/requirements.txt`, `apps/web/package.json`, and `.github/workflows/ci.yml`.*

| Layer | Technologies |
|---|---|
| **Backend API** | FastAPI 0.142, Python 3.12, SQLAlchemy 2.1, Alembic 1.20, Pydantic 2.13, Uvicorn 0.54 |
| **Web Frontend** | Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4 |
| **Data & Storage** | PostgreSQL (`psycopg` 3.3), Redis 8.1, MinIO / S3 document storage |
| **Infrastructure & CI** | Docker Compose (`infra/docker-compose.yml`), GitHub Actions (`.github/workflows/ci.yml`) |

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Python 3.12
- Node.js (v20 or higher)

### 1. Start Infrastructure Services
Start PostgreSQL, Redis, and MinIO in the background:
```bash
docker compose -f infra/docker-compose.yml up -d
```

### 2. Setup and Run the Backend API
```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
API runs on `http://localhost:8000`. You can run tests using `pytest -q`.

### 3. Setup and Run the Web App
In a new terminal:
```bash
cd apps/web
npm install
npm run dev
```
Web frontend runs on `http://localhost:3000`.

### Environment Variables

| Variable | Description | Example Placeholder |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql+psycopg://user:password@localhost:5432/tender` |
| `REDIS_URL` | Redis cache and queue URL | `redis://localhost:6379/0` |
| `S3_ENDPOINT` | Object storage endpoint (MinIO) | `http://localhost:9000` |
| `S3_ACCESS_KEY` | Object storage access key | `your_minio_access_key` |
| `S3_SECRET_KEY` | Object storage secret key | `your_minio_secret_key` |
| `S3_BUCKET` | Default bucket name for documents | `tender-documents` |
| `NEXT_PUBLIC_API_URL` | Frontend API client base URL | `http://localhost:8000` |

## Project Structure
```text
ai-tender-portal/
├── apps/
│   ├── api/                 # FastAPI application
│   │   ├── app/             # Routers, schemas, models, and services
│   │   ├── tests/           # Pytest test suite
│   │   └── requirements.txt
│   └── web/                 # Next.js frontend application
│       ├── src/app/         # App router pages and layouts
│       └── package.json
├── infra/                   # Docker Compose setup for Postgres, Redis, MinIO
└── docs/                    # Architecture decisions and product briefs
```

## What I Learned & What I Would Improve
- Designed multi-tenant database models and domain schemas using SQLAlchemy 2.0 and Pydantic validation.
- Built structured REST endpoints for procurement lifecycles covering evaluations, proposals, and compliance checks.
- Future improvements: implement an asynchronous task worker (e.g. ARQ using the configured Redis instance) for long-running document extraction, implement semantic requirement search using `pgvector` in PostgreSQL, and expand end-to-end frontend tests.

## Author
**Mustafa Muhammad Iqbal** — [GitHub](https://github.com/Mustafa-Hazard) · [LinkedIn](https://linkedin.com/in/mustafa642)
