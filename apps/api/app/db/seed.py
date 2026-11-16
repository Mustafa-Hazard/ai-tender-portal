"""
Database Seed Module — Seed Data Purged for Production Clean State.

In production and clean environments, mock data is not preloaded on startup.
Users register and onboard via /api/v1/auth/signup to establish real organizations,
roles, and data.
"""

from sqlalchemy.orm import Session


def seed_database(db: Session) -> dict:
    """Purged: No mock data is seeded. Starts with a clean empty database."""
    return {}


if __name__ == "__main__":
    print("Seed data has been purged. Application operates on clean database.")
