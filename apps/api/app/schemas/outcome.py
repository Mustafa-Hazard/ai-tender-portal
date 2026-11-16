import uuid
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field


class OutcomeRecordIn(BaseModel):
    outcome_status: str = Field(..., description="awarded, lost, disqualified, cancelled, withdrawn")
    awarded_amount: Decimal | None = None
    contract_reference: str | None = None
    winner_name: str | None = None
    winning_bid_amount: Decimal | None = None
    technical_score: Decimal | None = None
    financial_rank: int | None = None
    debrief_notes: str | None = None
    lessons_learned: str | None = None


class OutcomeRecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    bid_id: uuid.UUID
    organization_id: uuid.UUID
    outcome_status: str
    tender_title: str | None = None
    tender_ref: str | None = None
    awarded_amount: Decimal | None = None
    contract_reference: str | None = None
    winner_name: str | None = None
    winning_bid_amount: Decimal | None = None
    price_variance_percent: Decimal | None = None
    technical_score: Decimal | None = None
    financial_rank: int | None = None
    debrief_notes: str | None = None
    lessons_learned: str | None = None
    recorded_at: datetime


class AnalyticsOverviewOut(BaseModel):
    total_participated: int
    awarded_count: int
    lost_count: int
    disqualified_count: int
    win_rate_percent: float
    total_awarded_value: Decimal
    total_pipeline_value: Decimal
    average_discount_percent: float
    disqualification_rate_percent: float


class CalendarMilestoneOut(BaseModel):
    id: str
    tender_title: str
    tender_ref: str
    event_type: str  # submission_deadline, pre_bid_meeting, bid_opening, document_purchase
    event_date: datetime | date
    status: str
    client: str
