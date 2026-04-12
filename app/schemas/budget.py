from pydantic import BaseModel

class BudgetCreate(BaseModel):
    name: str
    category: str
    limit_amount: float


class BudgetRead(BaseModel):
    id: int
    name: str
    category: str
    limit_amount: float
    spent: float
    remaining: float
    percentage: float
    status: str
    status_icon: str