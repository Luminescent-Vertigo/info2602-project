from sqlmodel import Session, select
from app.models.budget import Budget
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

class BudgetRepository:

    def __init__(self, db: Session):
        self.db = db

    def create(self, budget: Budget) -> Budget:
        try:
            self.db.add(budget)
            self.db.commit()
            self.db.refresh(budget)
            return budget
        except Exception as e:
            logger.error(f"Error creating budget: {e}")
            self.db.rollback()
            raise

    def get_by_user(self, user_id: int) -> List[Budget]:
        return self.db.exec(
            select(Budget).where(Budget.user_id == user_id)
        ).all()

    def get_by_id(self, budget_id: int) -> Optional[Budget]:
        return self.db.get(Budget, budget_id)

    def delete(self, budget: Budget):
        try:
            self.db.delete(budget)
            self.db.commit()
        except Exception as e:
            logger.error(f"Error deleting budget: {e}")
            self.db.rollback()
            raise

    def update(self, budget: Budget) -> Budget:
        try:
            self.db.merge(budget)
            self.db.commit()
            self.db.refresh(budget)
            return budget
        except Exception as e:
            logger.error(f"Error updating budget: {e}")
            self.db.rollback()
            raise