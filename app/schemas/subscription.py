from pydantic import BaseModel
from typing import Optional
from datetime import date


class SubscriptionCreate(BaseModel):
    name: str
    cost: float
    billing_cycle: str
    next_payment_date: date


class SubscriptionUpdate(BaseModel):
    name: Optional[str] = None
    cost: Optional[float] = None
    billing_cycle: Optional[str] = None
    next_payment_date: Optional[date] = None


class SubscriptionRead(BaseModel):
    id: int
    name: str
    cost: float
    billing_cycle: str
    next_payment_date: date
    monthly_equivalent: float
    status: str
    is_paid: bool   #
    last_paid_date: Optional[date] = None  

    class Config:
        from_attributes = True