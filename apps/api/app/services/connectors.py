import hashlib
import uuid
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import Context
from app.models.enums import SourceHealth, SourceType, TenderLifecycle, VerificationStatus
from app.models.source import Source
from app.models.tender import Lot, Tender, TenderVersion
from app.services.audit import log_audit_event
from app.services.tenders import make_dedup_key


def _normalize_iso(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


class BaseSourceConnector(ABC):
    def __init__(self, name: str, source_type: SourceType, base_url: str, jurisdiction: str):
        self.name = name
        self.source_type = source_type
        self.base_url = base_url
        self.jurisdiction = jurisdiction

    @abstractmethod
    def fetch_raw_tenders(self) -> list[dict]:
        """Fetch raw tender payloads from the simulated source feed."""
        pass

    def get_or_create_source(self, db: Session) -> Source:
        source = db.scalar(select(Source).where(Source.name == self.name))
        if not source:
            source = Source(
                id=uuid.uuid4(),
                name=self.name,
                source_type=self.source_type,
                access_method="feed_sync",
                base_url=self.base_url,
                refresh_schedule="0 */2 * * *",
                health=SourceHealth.HEALTHY,
                coverage_notes=f"Fictional simulated feed for {self.jurisdiction} per Rule 13",
            )
            db.add(source)
            db.flush()
        return source

    def sync(self, db: Session, ctx: Context) -> dict:
        source = self.get_or_create_source(db)
        now = datetime.now(timezone.utc)
        raw_items = self.fetch_raw_tenders()

        created_count = 0
        updated_count = 0
        skipped_count = 0

        for item in raw_items:
            dedup_key = make_dedup_key(item.get("buyer_name"), item.get("reference_number"))
            existing = None
            if dedup_key:
                existing = db.scalar(select(Tender).where(Tender.dedup_key == dedup_key))

            if existing:
                # Check if deadline or document version changed
                changed = False
                new_deadline = item.get("deadline_at")
                if new_deadline and _normalize_iso(existing.deadline_at) != _normalize_iso(new_deadline):
                    history = existing.deadline_history or []
                    history.append({
                        "previous_deadline": existing.deadline_at.isoformat() if existing.deadline_at else None,
                        "updated_deadline": new_deadline.isoformat(),
                        "amendment_reason": item.get("amendment_reason", "Corrigendum published"),
                        "recorded_at": now.isoformat(),
                    })
                    existing.deadline_history = history
                    existing.deadline_at = new_deadline
                    existing.lifecycle_status = TenderLifecycle.AMENDED
                    changed = True

                existing.last_checked_at = now
                if changed:
                    updated_count += 1
                else:
                    skipped_count += 1
            else:
                # Create fresh tender
                tender = Tender(
                    id=uuid.uuid4(),
                    source_id=source.id,
                    organization_id=None,  # Public tender visible to all
                    title=item["title"],
                    buyer_name=item.get("buyer_name"),
                    reference_number=item.get("reference_number"),
                    description=item.get("description"),
                    category=item.get("category"),
                    procurement_type=item.get("procurement_type", "Open Competitive Bidding"),
                    country=item.get("country", "PK"),
                    region=item.get("region"),
                    city=item.get("city"),
                    lifecycle_status=item.get("lifecycle_status", TenderLifecycle.OPEN),
                    published_at=item.get("published_at"),
                    deadline_at=item.get("deadline_at"),
                    deadline_timezone=item.get("deadline_timezone", "Asia/Karachi"),
                    estimated_value=item.get("estimated_value"),
                    currency=item.get("currency", "PKR"),
                    original_url=item.get("original_url"),
                    first_retrieved_at=now,
                    last_checked_at=now,
                    extraction_confidence=item.get("extraction_confidence", 0.95),
                    unresolved_fields=item.get("unresolved_fields", []),
                    verification_status=VerificationStatus.VERIFIED if item.get("extraction_confidence", 1.0) >= 0.70 else VerificationStatus.NEEDS_VERIFICATION,
                    dedup_key=dedup_key,
                )
                db.add(tender)
                db.flush()

                # Add simulated lots if present
                for lot_data in item.get("lots", []):
                    lot = Lot(
                        id=uuid.uuid4(),
                        tender_id=tender.id,
                        lot_number=lot_data.get("lot_number", "1"),
                        title=lot_data.get("title"),
                        scope=lot_data.get("scope"),
                        estimated_value=lot_data.get("estimated_value"),
                        currency=lot_data.get("currency", "PKR"),
                    )
                    db.add(lot)

                # Add initial document version
                doc_hash = hashlib.sha256((tender.title + (tender.reference_number or "")).encode("utf-8")).hexdigest()
                v = TenderVersion(
                    id=uuid.uuid4(),
                    tender_id=tender.id,
                    version_number=1,
                    document_hash=doc_hash,
                    original_filename=item.get("sample_document_filename", "Bidding_Document_Vol_1.pdf"),
                    storage_key=f"tenders/{tender.id}/v1/{doc_hash[:16]}.pdf",
                    retrieved_at=now,
                    change_summary={"action": "Initial public ingestion"},
                )
                db.add(v)
                created_count += 1

        source.last_checked_at = now
        source.last_success_at = now
        source.health = SourceHealth.HEALTHY

        log_audit_event(
            db=db,
            organization_id=ctx.organization_id,
            actor_id=ctx.user_id,
            action="connector.sync_completed",
            object_type="source",
            object_id=str(source.id),
            after={
                "source_name": self.name,
                "created": created_count,
                "updated": updated_count,
                "skipped": skipped_count,
            },
        )
        db.commit()

        return {
            "source_id": str(source.id),
            "source_name": self.name,
            "created": created_count,
            "updated": updated_count,
            "skipped": skipped_count,
            "total_fetched": len(raw_items),
        }


class SampleFederalEProcurementConnector(BaseSourceConnector):
    def __init__(self):
        super().__init__(
            name="Pakistan Federal E-Procurement EPADS (Sample Fictional Connector)",
            source_type=SourceType.GOV_PORTAL,
            base_url="https://eprocure.gov.pk.example",
            jurisdiction="Federal",
        )

    def fetch_raw_tenders(self) -> list[dict]:
        return [
            {
                "title": "Procurement of High-End ICU Ventilators & Patient Monitors (Sample Fictional Data)",
                "buyer_name": "Federal Teaching Hospital Islamabad",
                "reference_number": "FTH-ICU-2026-088",
                "description": "Turnkey supply, clinical installation, testing, and 3-year warranty maintenance for 40 invasive ICU ventilators and multi-parameter cardiac monitors.",
                "category": "Medical Equipment",
                "procurement_type": "Single Stage Two Envelope",
                "country": "PK",
                "region": "Federal Capital",
                "city": "Islamabad",
                "estimated_value": Decimal("175000000.00"),
                "currency": "PKR",
                "published_at": datetime(2026, 10, 8, 9, 0, tzinfo=timezone.utc),
                "deadline_at": datetime(2026, 11, 20, 14, 0, tzinfo=timezone.utc),
                "deadline_timezone": "Asia/Karachi",
                "original_url": "https://eprocure.gov.pk.example/tenders/FTH-ICU-2026-088",
                "sample_document_filename": "FTH_ICU_Tender_Specifications_Vol_1.pdf",
                "extraction_confidence": 0.94,
                "lots": [
                    {
                        "lot_number": "Lot-1",
                        "title": "40x Invasive Critical Care Ventilators",
                        "scope": "Supply of intensive care ventilators with integrated capnography and turbine technology.",
                        "estimated_value": Decimal("120000000.00"),
                        "currency": "PKR",
                    },
                    {
                        "lot_number": "Lot-2",
                        "title": "40x Multi-Parameter Central Monitoring Stations",
                        "scope": "Central telemetry and bedside cardiac monitors with wired and wireless networking.",
                        "estimated_value": Decimal("55000000.00"),
                        "currency": "PKR",
                    },
                ],
            },
            {
                "title": "Supply of Molecular Biology Reagents & Automated DNA Sequencer (Sample Fictional Data)",
                "buyer_name": "National Health Research Institute",
                "reference_number": "NHRI-GEN-2026-012",
                "description": "High-throughput next-generation sequencing system and 12-month consumable reagents for genomic epidemiology.",
                "category": "Laboratory Equipment",
                "procurement_type": "Open Competitive Bidding",
                "country": "PK",
                "region": "Federal Capital",
                "city": "Islamabad",
                "estimated_value": Decimal("85000000.00"),
                "currency": "PKR",
                "published_at": datetime(2026, 10, 10, 11, 0, tzinfo=timezone.utc),
                "deadline_at": datetime(2026, 11, 26, 14, 0, tzinfo=timezone.utc),
                "deadline_timezone": "Asia/Karachi",
                "original_url": "https://eprocure.gov.pk.example/tenders/NHRI-GEN-2026-012",
                "sample_document_filename": "NHRI_Sequencer_RFP.pdf",
                "extraction_confidence": 0.91,
                "lots": [],
            },
        ]


class SampleProvincialPortalConnector(BaseSourceConnector):
    def __init__(self):
        super().__init__(
            name="Punjab PPRA E-Procurement Feed (Sample Fictional Connector)",
            source_type=SourceType.GOV_PORTAL,
            base_url="https://ppra.punjab.gov.pk.example",
            jurisdiction="Punjab",
        )

    def fetch_raw_tenders(self) -> list[dict]:
        return [
            {
                "title": "Tier-3 Datacenter Infrastructure & High-Density Hyperconverged Cluster (Sample Fictional Data)",
                "buyer_name": "Punjab Information Technology Board",
                "reference_number": "PITB-DC-2026-114",
                "description": "Enterprise cloud hardware, SAN storage expansion, and hyperconverged virtualization cluster for provincial government cloud.",
                "category": "IT & Telecom",
                "procurement_type": "Single Stage Two Envelope",
                "country": "PK",
                "region": "Punjab",
                "city": "Lahore",
                "estimated_value": Decimal("480000000.00"),
                "currency": "PKR",
                "published_at": datetime(2026, 10, 6, 10, 0, tzinfo=timezone.utc),
                "deadline_at": datetime(2026, 11, 12, 14, 0, tzinfo=timezone.utc),
                "deadline_timezone": "Asia/Karachi",
                "original_url": "https://ppra.punjab.gov.pk.example/tenders/PITB-DC-2026-114",
                "sample_document_filename": "PITB_Datacenter_Cluster_Bidding_Pack.pdf",
                "extraction_confidence": 0.68,
                "unresolved_fields": ["technical_evaluation_weightage"],
                "lots": [
                    {
                        "lot_number": "Lot-A",
                        "title": "HCI Compute Nodes & Spine-Leaf Switching",
                        "scope": "16 high-density dual-socket AMD EPYC nodes with 100GbE networking.",
                        "estimated_value": Decimal("320000000.00"),
                        "currency": "PKR",
                    },
                    {
                        "lot_number": "Lot-B",
                        "title": "All-Flash NVMe Tier-1 Storage Array",
                        "scope": "2 Petabyte raw capacity NVMe flash array with synchronous replication.",
                        "estimated_value": Decimal("160000000.00"),
                        "currency": "PKR",
                    },
                ],
            },
            {
                "title": "Solar PV Microgrid & 500kVA Smart Inverter Installation (Sample Fictional Data)",
                "buyer_name": "Energy Department Government of Punjab",
                "reference_number": "ENERGY-PUN-2026-079",
                "description": "Grid-tied rooftop solar power system with lithium-ion BESS battery storage for public secretariat complexes.",
                "category": "Renewable Energy",
                "procurement_type": "Open Competitive Bidding",
                "country": "PK",
                "region": "Punjab",
                "city": "Lahore",
                "estimated_value": Decimal("135000000.00"),
                "currency": "PKR",
                "published_at": datetime(2026, 10, 11, 14, 0, tzinfo=timezone.utc),
                "deadline_at": datetime(2026, 11, 30, 14, 0, tzinfo=timezone.utc),
                "deadline_timezone": "Asia/Karachi",
                "original_url": "https://ppra.punjab.gov.pk.example/tenders/ENERGY-PUN-2026-079",
                "sample_document_filename": "Solar_Microgrid_RFP.pdf",
                "extraction_confidence": 0.96,
                "lots": [],
            },
        ]
