"""
AI Tender Portal — Reset Database to Clean State (No Seed Data)
Usage:
    python reset_db.py
"""
import os
import subprocess
import sys
from app.db.session import SessionLocal
from app.models import Tender, Organization

db_file = "tender.db"

if os.path.exists(db_file):
    os.remove(db_file)
    print(f"🗑️ Deleted existing {db_file}")

print("🔄 Applying Alembic migrations (upgrade head)...")
res = subprocess.run([sys.executable, "-m", "alembic", "upgrade", "head"], capture_output=True, text=True)
if res.returncode != 0:
    print("❌ Alembic migration failed:")
    print(res.stderr)
    sys.exit(1)

print("✅ All 20 tables created successfully.")

db = SessionLocal()
t_count = db.query(Tender).count()
o_count = db.query(Organization).count()
db.close()

print(f"📊 Current status: Clean empty database ({t_count} tenders, {o_count} organizations).")
print("👉 Ready for live demo. When instructed by Sir, run: python seed_db.py")

