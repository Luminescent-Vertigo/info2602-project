from app.models.income import Income

class IncomeService:

    def __init__(self, income_repo):
        self.income_repo = income_repo

    def create_income(self, user_id: int, data: dict):
        income = Income(**data, user_id=user_id)
        return self.income_repo.create(income)

    def get_user_income(self, user_id: int):
        return self.income_repo.get_by_user(user_id)

    def delete_income(self, income_id: int):
        income = self.income_repo.get_by_id(income_id)
        if not income:
            raise Exception("Income not found")
        self.income_repo.delete(income)

    def update_income(self, income_id: int, data: dict):
        income = self.income_repo.get_by_id(income_id)
        if not income:
            raise Exception("Income not found")

        allowed_fields = ["name", "amount", "category", "date", "comment"]

        for field in allowed_fields:
            if field in data and data[field] is not None:
                setattr(income, field, data[field])

        return self.income_repo.update(income)

    def get_total_income(self, user_id: int):
        incomes = self.income_repo.get_by_user(user_id)
        return sum(i.amount for i in incomes)
    
    def get_category_breakdown(self, user_id: int):
        incomes = self.income_repo.get_by_user(user_id)
        result = {}

        for i in incomes:
            result[i.category] = result.get(i.category, 0) + i.amount

        return [{"category": k, "total": v} for k, v in result.items()]
    
    def get_monthly_income(self, user_id: int):
        incomes = self.income_repo.get_by_user(user_id)
        result = {}

        for i in incomes:
            key = i.date.strftime("%Y-%m")
            result[key] = result.get(key, 0) + i.amount

        return list(result.items())   