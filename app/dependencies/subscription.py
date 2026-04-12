from typing import Annotated
from fastapi import Depends
from app.dependencies.session import SessionDep
from app.repositories.subscription import SubscriptionRepository
from app.repositories.expense import ExpenseRepository
from app.services.subscription_service import SubscriptionService


def get_subscription_service(db: SessionDep) -> SubscriptionService:
    subscription_repo = SubscriptionRepository(db)
    expense_repo = ExpenseRepository(db)

    return SubscriptionService(subscription_repo, expense_repo)

SubscriptionServiceDep = Annotated[SubscriptionService, Depends(get_subscription_service)]