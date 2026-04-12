from sqlmodel import Field, SQLModel
from typing import Optional
from datetime import date

class Budget(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    user_id: int = Field(foreign_key="user.id", index=True)
    name: str
    category: str
    limit_amount: float
    start_date: date
    end_date: date