import uuid
from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, IDMixin, TimestampMixin
from app.db.types import JSONType


class Proposal(IDMixin, TimestampMixin, Base):
    """
    Core AI Proposal record tying together a bid, tender requirements,
    and structured response sections across technical and commercial envelopes.
    """
    __tablename__ = "proposals"
    __table_args__ = (UniqueConstraint("bid_id"),)

    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id"), index=True)
    bid_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("bids.id"), unique=True, index=True)
    tender_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenders.id"), index=True)
    title: Mapped[str] = mapped_column(String(500))
    template_name: Mapped[str] = mapped_column(String(100), default="standard_single_stage_two_envelope")
    status: Mapped[str] = mapped_column(String(50), default="draft")  # draft, in_review, approved, locked
    version: Mapped[int] = mapped_column(Integer, default=1)
    summary: Mapped[str | None] = mapped_column(Text)


class ProposalSection(IDMixin, TimestampMixin, Base):
    """
    Individual proposal response section with citation grounding,
    envelope tagging (Rule 10 separation), and placeholder tracking.
    """
    __tablename__ = "proposal_sections"
    __table_args__ = (UniqueConstraint("proposal_id", "section_key"),)

    proposal_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("proposals.id", ondelete="CASCADE"), index=True)
    section_key: Mapped[str] = mapped_column(String(100))
    title: Mapped[str] = mapped_column(String(255))
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    envelope_type: Mapped[str] = mapped_column(String(50), default="technical")  # technical, commercial, general
    content: Mapped[str] = mapped_column(Text, default="")
    is_ai_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    citations: Mapped[list | None] = mapped_column(JSONType, default=list)
    placeholders: Mapped[list | None] = mapped_column(JSONType, default=list)
    status: Mapped[str] = mapped_column(String(50), default="draft")  # draft, reviewed, approved

