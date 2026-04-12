from typing import Annotated
from fastapi import Depends
from app.dependencies.session import SessionDep
from app.repositories.income import IncomeRepository
from app.services.income_service import IncomeService


def get_income_service(db: SessionDep) -> IncomeService:
    repo = IncomeRepository(db)
    return IncomeService(repo)


IncomeServiceDep = Annotated[IncomeService, Depends(get_income_service)]