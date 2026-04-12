from datetime import date
from dateutil.relativedelta import relativedelta
from app.models.subscription import Subscription
from app.models.expense import Expense

class SubscriptionService:

    def __init__(self, subscription_repo, expense_repo):
        self.subscription_repo = subscription_repo
        self.expense_repo = expense_repo

    def _calculate_monthly(self, cost, billing_cycle):
        return cost / 12 if billing_cycle == "yearly" else cost

    def create_subscription(self, user_id: int, data: dict):
        data["monthly_equivalent"] = self._calculate_monthly(
            data["cost"], data["billing_cycle"]
        )

        subscription = Subscription(**data, user_id=user_id)
        return self.subscription_repo.create(subscription)

    def get_user_subscriptions(self, user_id: int):
        return self.subscription_repo.get_by_user(user_id)

    def delete_subscription(self, subscription_id: int):
        sub = self.subscription_repo.get_by_id(subscription_id)
        if not sub:
            raise Exception("Subscription not found")
        self.subscription_repo.delete(sub)

    def update_subscription(self, subscription_id: int, data: dict):
        sub = self.subscription_repo.get_by_id(subscription_id)
        if not sub:
            raise Exception("Subscription not found")

        for key, value in data.items():
            if value is not None:
                setattr(sub, key, value)

        sub.monthly_equivalent = self._calculate_monthly(sub.cost, sub.billing_cycle)
        return self.subscription_repo.update(sub)

    # STATUS ENGINE
    def update_statuses(self, user_id: int):
        subs = self.subscription_repo.get_by_user(user_id)
        today = date.today()

        for sub in subs:

            # preserve paid state
            if sub.status == "paid":
                continue

            if sub.next_payment_date < today:
                sub.status = "overdue"
            elif (sub.next_payment_date - today).days <= 7:
                sub.status = "due"
            else:
                sub.status = "active"

            self.subscription_repo.update(sub)

        return subs

    def get_monthly_projection(self, user_id: int):
        subs = self.subscription_repo.get_by_user(user_id)

        return [
            ("Monthly", sum(s.monthly_equivalent for s in subs))
        ]
    
    def pay_subscription(self, subscription_id: int):
        sub = self.subscription_repo.get_by_id(subscription_id)

        if not sub:
            raise ValueError("Subscription not found")

        # ======================
        # 1. UPDATE SUBSCRIPTION
        # ======================
        sub.is_paid = True
        sub.last_paid_date = date.today()
        sub.status = "paid"

        if sub.billing_cycle == "monthly":
            sub.next_payment_date += relativedelta(months=1)
        else:
            sub.next_payment_date += relativedelta(years=1)

        self.subscription_repo.update(sub)

        # ======================
        # 2. CREATE EXPENSE
        # ======================
        expense = Expense(
            user_id=sub.user_id,
            name=sub.name,
            amount=sub.cost,
            category="Subscription",
            date=date.today(),
            comment=f"Auto-generated from {sub.name}"
        )

        self.expense_repo.create(expense)

        return sub