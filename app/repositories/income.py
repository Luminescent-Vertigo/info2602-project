from sqlmodel import Session, select, func
from app.models.income import Income
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

class IncomeRepository:

    def __init__(self, db: Session):
        self.db = db

    def create(self, income: Income) -> Income:
        try:
            self.db.add(income)
            self.db.commit()
            self.db.refresh(income)
            return income
        except Exception as e:
            logger.error(f"Error creating income: {e}")
            self.db.rollback()
            raise

    def get_by_user(self, user_id: int) -> List[Income]:
        return self.db.exec(
            select(Income).where(Income.user_id == user_id)
        ).all()

    def get_by_id(self, income_id: int) -> Optional[Income]:
        return self.db.get(Income, income_id)

    def delete(self, income: Income):
        try:
            self.db.delete(income)
            self.db.commit()
        except Exception as e:
            logger.error(f"Error deleting income: {e}")
            self.db.rollback()
            raise

    def update(self, income: Income) -> Income:
        try:
            self.db.add(income)
            self.db.commit()
            self.db.refresh(income)
            return income
        except Exception as e:
            logger.error(f"Error updating income: {e}")
            self.db.rollback()
            raise