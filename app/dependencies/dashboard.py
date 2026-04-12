from typing import Annotated
from fastapi import Depends

from app.dependencies.session import SessionDep
from app.services.dashboard_service import DashboardService
from app.services.income_service import IncomeService
from app.services.expense_service import ExpenseService
from app.services.budget_service import BudgetService

from app.dependencies.income import get_income_service
from app.dependencies.expense import get_expense_service
from app.dependencies.budget import get_budget_service


def get_dashboard_service(
    income_service: IncomeService = Depends(get_income_service),
    expense_service: ExpenseService = Depends(get_expense_service),
    budget_service: BudgetService = Depends(get_budget_service),
):
    return DashboardService(income_service, expense_service, budget_service)


DashboardServiceDep = Annotated[DashboardService, Depends(get_dashboard_service)]