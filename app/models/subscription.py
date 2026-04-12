from sqlmodel import Field, SQLModel
from typing import Optional
from datetime import date

class Subscription(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    user_id: int = Field(foreign_key="user.id", index=True)

    name: str
    cost: float
    billing_cycle: str  # monthly | yearly
    next_payment_date: date
    start_date: date = Field(default_factory=date.today)

    monthly_equivalent: float = Field(default=0)
    status: str = Field(default="active")

    is_paid: bool = Field(default=False)
    last_paid_date: Optional[date] = None
    