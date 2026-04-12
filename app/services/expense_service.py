from app.models.expense import Expense

class ExpenseService:

    def __init__(self, expense_repo):
        self.expense_repo = expense_repo

    def create_expense(self, user_id: int, data: dict):
        expense = Expense(**data, user_id=user_id)
        return self.expense_repo.create(expense)

    def get_user_expenses(self, user_id: int):
        return self.expense_repo.get_by_user(user_id)

    def delete_expense(self, expense_id: int):
        expense = self.expense_repo.get_by_id(expense_id)
        if not expense:
            raise Exception("Expense not found")
        self.expense_repo.delete(expense)

    def update_expense(self, expense_id: int, data: dict):
        expense = self.expense_repo.get_by_id(expense_id)
        if not expense:
            raise Exception("Expense not found")

        allowed_fields = ["name", "amount", "category", "date", "comment"]

        for field in allowed_fields:
            if field in data and data[field] is not None:
                setattr(expense, field, data[field])

        return self.expense_repo.update(expense)

    def get_total_expenses(self, user_id: int):
        expenses = self.expense_repo.get_by_user(user_id)
        return sum(e.amount for e in expenses)

    def get_category_breakdown(self, user_id: int):
        return self.expense_repo.get_category_breakdown(user_id)

    def get_monthly_expenses(self, user_id: int):
        return self.expense_repo.get_monthly_expenses(user_id)