from sqlmodel import Session, select, func
from app.models.expense import Expense
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

class ExpenseRepository:

    def __init__(self, db: Session):
        self.db = db

    def create(self, expense: Expense) -> Expense:
        try:
            self.db.add(expense)
            self.db.commit()
            self.db.refresh(expense)
            return expense
        except Exception as e:
            logger.error(f"Error creating expense: {e}")
            self.db.rollback()
            raise

    def get_by_user(self, user_id: int) -> List[Expense]:
        return self.db.exec(
            select(Expense).where(Expense.user_id == user_id)
        ).all()

    def get_by_id(self, expense_id: int) -> Optional[Expense]:
        return self.db.get(Expense, expense_id)

    def delete(self, expense: Expense):
        try:
            self.db.delete(expense)
            self.db.commit()
        except Exception as e:
            logger.error(f"Error deleting expense: {e}")
            self.db.rollback()
            raise

    def update(self, expense: Expense) -> Expense:
        try:
            self.db.add(expense)
            self.db.commit()
            self.db.refresh(expense)
            return expense
        except Exception as e:
            logger.error(f"Error updating expense: {e}")
            self.db.rollback()
            raise

    def get_category_breakdown(self, user_id: int):
        return self.db.exec(
            select(Expense.category, func.sum(Expense.amount))
            .where(Expense.user_id == user_id)
            .group_by(Expense.category)
        ).all()
    
    def get_monthly_expenses(self, user_id: int):
        return self.db.exec(
            select(func.strftime("%Y-%m", Expense.date), func.sum(Expense.amount))
            .where(Expense.user_id == user_id)
            .group_by(func.strftime("%Y-%m", Expense.date))
        ).all()