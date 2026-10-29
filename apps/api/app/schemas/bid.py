import uuid
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import BidDecision, BidStage, TaskStatus, TaskType


class BidCreate(BaseModel):
    tender_id: uuid.UUID
    stage: BidStage = BidStage.DISCOVERED
    decision: BidDecision | None = None
    decision_rationale: str | None = None
    internal_deadline: datetime | None = None
    expected_bid_cost: Decimal | None = None
    potential_contract_value: Decimal | None = None
    currency: str = "PKR"


class BidStageUpdate(BaseModel):
    stage: BidStage


class BidDecisionUpdate(BaseModel):
    decision: BidDecision
    decision_rationale: str = Field(..., min_length=5, description="Auditable justification for the bid/no-bid decision")


class TaskCreate(BaseModel):
    title: str
    task_type: TaskType = TaskType.OTHER
    status: TaskStatus = TaskStatus.TODO
    due_at: datetime | None = None
    notes: str | None = None


class TaskUpdate(BaseModel):
    status: TaskStatus | None = None
    notes: str | None = None


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    bid_id: uuid.UUID | None
    task_type: TaskType
    title: str
    status: TaskStatus
    assignee_id: uuid.UUID | None
    due_at: datetime | None
    notes: str | None
    created_at: datetime
    updated_at: datetime


class BidOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    organization_id: uuid.UUID
    tender_id: uuid.UUID
    tender_title: str | None = None
    tender_reference: str | None = None
    stage: BidStage
    decision: BidDecision | None
    decision_rationale: str | None
    decided_by_id: uuid.UUID | None
    decided_at: datetime | None
    decision_review_date: date | None
    owner_id: uuid.UUID | None
    internal_deadline: datetime | None
    expected_bid_cost: Decimal | None
    potential_contract_value: Decimal | None
    currency: str | None
    tasks_count: int = 0
    tasks_completed_count: int = 0
    created_at: datetime
    updated_at: datetime


class PricingLineItemIn(BaseModel):
    item_code: str
    description: str
    quantity: Decimal
    unit: str
    unit_cost: Decimal | None = None
    selling_price: Decimal
    tax_rate_percent: Decimal = Decimal("18.0")  # Default 18% standard GST


class PricingLineItemOut(BaseModel):
    item_code: str
    description: str
    quantity: Decimal
    unit: str
    unit_cost: Decimal | None = None
    selling_price: Decimal
    tax_rate_percent: Decimal
    net_total: Decimal
    tax_amount: Decimal
    gross_total: Decimal


class PricingScheduleOut(BaseModel):
    currency: str
    items: list[PricingLineItemOut]
    subtotal_net: Decimal
    total_tax: Decimal
    grand_total: Decimal
    bid_security_rate_percent: Decimal = Decimal("2.0")  # 2% standard bid bond
    bid_security_amount: Decimal
