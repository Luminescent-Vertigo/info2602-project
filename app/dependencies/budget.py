from typing import Annotated
from fastapi import Depends

from app.dependencies.session import SessionDep
from app.repositories.budget import BudgetRepository
from app.repositories.expense import ExpenseRepository
from app.services.budget_service import BudgetService


def get_budget_service(db: SessionDep) -> BudgetService:
    budget_repo = BudgetRepository(db)
    expense_repo = ExpenseRepository(db)

    return BudgetService(budget_repo, expense_repo)


BudgetServiceDep = Annotated[BudgetService, Depends(get_budget_service)]