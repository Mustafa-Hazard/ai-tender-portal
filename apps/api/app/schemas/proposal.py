import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class ProposalSectionIn(BaseModel):
    section_key: str
    title: str
    order_index: int = 0
    envelope_type: str = "technical"  # technical, commercial, general
    content: str = ""
    citations: list[dict] = Field(default_factory=list)
    placeholders: list[str] = Field(default_factory=list)
    status: str = "draft"


class ProposalSectionUpdate(BaseModel):
    content: str | None = None
    status: str | None = None
    title: str | None = None


class ProposalSectionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    proposal_id: uuid.UUID
    section_key: str
    title: str
    order_index: int
    envelope_type: str
    content: str
    is_ai_generated: bool
    citations: list[dict] | None = None
    placeholders: list[str] | None = None
    status: str
    created_at: datetime
    updated_at: datetime


class ProposalCreate(BaseModel):
    bid_id: uuid.UUID
    title: str | None = None
    template_name: str = "standard_single_stage_two_envelope"


class ProposalUpdate(BaseModel):
    title: str | None = None
    status: str | None = None
    summary: str | None = None


class ProposalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    bid_id: uuid.UUID
    tender_id: uuid.UUID
    title: str
    template_name: str
    status: str
    version: int
    summary: str | None = None
    sections: list[ProposalSectionOut] = Field(default_factory=list)
    placeholders_count: int = 0
    citations_count: int = 0
    created_at: datetime
    updated_at: datetime


class ProposalGenerateIn(BaseModel):
    section_keys: list[str] | None = None
    regenerate: bool = False


class ProposalExportOut(BaseModel):
    proposal_id: uuid.UUID
    bid_id: uuid.UUID
    tender_title: str
    tender_ref: str
    envelope_type: str  # technical or commercial
    manifest_hash: str
    sections_count: int
    sections: list[dict]
    excluded_sections: list[str]
    rendered_package_text: str

