from pydantic import BaseModel
from typing import Optional
from datetime import date


class IncomeCreate(BaseModel):
    name: str
    amount: float
    category: str
    date: date
    comment: Optional[str] = None


class IncomeUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    date: Optional[date] = None
    comment: Optional[str] = None


class IncomeRead(BaseModel):
    id: int
    name: str
    amount: float
    category: str
    date: date
    comment: Optional[str]

    class Config:
        from_attributes = True