from sqlmodel import Session, select
from app.models.subscription import Subscription
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

class SubscriptionRepository:

    def __init__(self, db: Session):
        self.db = db

    def create(self, subscription: Subscription) -> Subscription:
        try:
            self.db.add(subscription)
            self.db.commit()
            self.db.refresh(subscription)
            return subscription
        except Exception as e:
            logger.error(f"Error creating subscription: {e}")
            self.db.rollback()
            raise

    def get_by_user(self, user_id: int) -> List[Subscription]:
        return self.db.exec(
            select(Subscription).where(Subscription.user_id == user_id)
        ).all()

    def get_by_id(self, subscription_id: int) -> Optional[Subscription]:
        return self.db.get(Subscription, subscription_id)

    def delete(self, subscription: Subscription):
        try:
            self.db.delete(subscription)
            self.db.commit()
        except Exception as e:
            logger.error(f"Error deleting subscription: {e}")
            self.db.rollback()
            raise

    def update(self, subscription: Subscription) -> Subscription:
        try:
            self.db.merge(subscription)   
            self.db.commit()
            self.db.refresh(subscription)
            return subscription
        except Exception as e:
            self.db.rollback()
            raise
