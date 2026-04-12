from typing import Annotated
from fastapi import Depends
from app.dependencies.session import SessionDep
from app.repositories.expense import ExpenseRepository
from app.services.expense_service import ExpenseService


def get_expense_service(db: SessionDep) -> ExpenseService:
    repo = ExpenseRepository(db)
    return ExpenseService(repo)


ExpenseServiceDep = Annotated[ExpenseService, Depends(get_expense_service)]