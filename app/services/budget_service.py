from app.models import Budget

class BudgetService:

    def __init__(self, budget_repo, expense_repo):
        self.budget_repo = budget_repo
        self.expense_repo = expense_repo

    def create_budget(self, user_id: int, data: dict):
        budget = Budget(**data, user_id=user_id)
        return self.budget_repo.create(budget)

    def get_user_budgets(self, user_id: int):
        return self.budget_repo.get_by_user(user_id)

    # main ui function
    def get_budget_status(self, user_id: int):
        budgets = self.budget_repo.get_by_user(user_id)
        expenses = self.expense_repo.get_by_user(user_id)

        results = []

        for budget in budgets:

            # sum spent in same category
            spent = sum(
                e.amount for e in expenses
                if e.category.lower() == budget.category.lower()
                and budget.start_date <= e.date <= budget.end_date
            )

            limit = budget.limit_amount

            remaining = limit - spent
            percentage = (spent / limit) * 100 if limit else 0

            # status logic (matches UI spec)
            if percentage < 70:
                status = "safe"
                status_icon = "🟢"
            elif percentage <= 100:
                status = "warning"
                status_icon = "🟡"
            else:
                status = "exceeded"
                status_icon = "🔴"

            results.append({
                "id": budget.id,
                "name": budget.name,
                "category": budget.category,
                "limit_amount": limit,
                "start_date": budget.start_date,
                "end_date": budget.end_date,
                "spent": spent,
                "remaining": remaining,
                "percentage": round(percentage, 2),
                "status": status,
                "status_icon": status_icon
            })

        return results
    
    def update_budget(self, budget_id: int, data: dict):
        budget = self.budget_repo.get_by_id(budget_id)
        if not budget:
            raise Exception("Budget not found")

        for key, value in data.items():
            if value is not None:
                setattr(budget, key, value)

        return self.budget_repo.update(budget)


    def delete_budget(self, budget_id: int):
        budget = self.budget_repo.get_by_id(budget_id)
        if not budget:
            raise Exception("Budget not found")

        self.budget_repo.delete(budget)