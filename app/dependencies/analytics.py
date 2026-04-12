from typing import Annotated
from fastapi import Depends

from app.services.analytics_service import AnalyticsService
from app.services.income_service import IncomeService
from app.services.expense_service import ExpenseService
from app.services.subscription_service import SubscriptionService
from app.services.budget_service import BudgetService

from app.dependencies.income import get_income_service
from app.dependencies.expense import get_expense_service
from app.dependencies.subscription import get_subscription_service
from app.dependencies.budget import get_budget_service


def get_analytics_service(
    income_service: IncomeService = Depends(get_income_service),
    expense_service: ExpenseService = Depends(get_expense_service),
    budget_service: BudgetService = Depends(get_budget_service),   # ✅ ADD THIS
    subscription_service: SubscriptionService = Depends(get_subscription_service),
):
    return AnalyticsService(
        income_service,
        expense_service,
        budget_service,        
        subscription_service
    )


AnalyticsServiceDep = Annotated[AnalyticsService, Depends(get_analytics_service)]
