"""
AI Tender Portal — Live Demo Database Seeder
Usage:
    python seed_db.py
"""
import sys
from app.db.session import SessionLocal
from app.db.seed import seed_database
from app.models import Organization, Tender, Bid, Evidence, Requirement

def main():
    print("🌱 Seeding AI Tender Portal database (Scenarios A, B, and C)...")
    db = SessionLocal()
    try:
        existing_orgs = db.query(Organization).count()
        if existing_orgs > 0:
            print(f"⚠️ Notice: Database already contains {existing_orgs} organization(s).")
            print("To re-seed from scratch, run 'python reset_db.py' first.")
            return

        seed_database(db)
        print("✅ Database successfully seeded for demo!")
        print(f"   • Organizations : {db.query(Organization).count()} (Apex Healthcare, Delta Engineering)")
        print(f"   • Tenders       : {db.query(Tender).count()} (ICU Ventilators, Datacenter ERP, NDMA Fleet)")
        print(f"   • Bids          : {db.query(Bid).count()} (Active bid workflows)")
        print(f"   • Vault Evidence: {db.query(Evidence).count()} (Compliance certs)")
        print(f"   • Requirements  : {db.query(Requirement).count()} (Evaluated criteria)")
    except Exception as e:
        print(f"❌ Seeding error: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()

