from sqlmodel import Field, SQLModel
from typing import Optional
from datetime import date

class Expense(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    user_id: int = Field(foreign_key="user.id", index=True)

    name: str
    amount: float
    category: str
    date: date
    comment: Optional[str] = None