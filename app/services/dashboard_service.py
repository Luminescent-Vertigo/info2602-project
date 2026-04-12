class DashboardService:

    def __init__(self, income_service, expense_service, budget_service):
        self.income_service = income_service
        self.expense_service = expense_service
        self.budget_service = budget_service

    def get_dashboard_data(self, user_id: int):

        # ===== BASIC TOTALS =====
        total_income = self.income_service.get_total_income(user_id)
        total_expenses = self.expense_service.get_total_expenses(user_id)

        remaining_balance = total_income - total_expenses

        # ===== MONTHLY NET CASH FLOW (ordered) =====
        income_monthly = self.income_service.get_monthly_income(user_id)
        expense_monthly = self.expense_service.get_monthly_expenses(user_id)

        income_dict = {m[0]: m[1] for m in income_monthly}
        expense_dict = {m[0]: m[1] for m in expense_monthly}

        all_months = sorted(set(income_dict.keys()) | set(expense_dict.keys()))

        monthly_net = [
            income_dict.get(m, 0) - expense_dict.get(m, 0)
            for m in all_months
        ]

        # ===== ROLLING BURN RATE (LAST 3 MONTHS) =====
        if monthly_net:
            last_n = monthly_net[-3:]  # last 3 months
            burn_rate = -(sum(last_n) / len(last_n))
        else:
            burn_rate = 0


        # ===== PIE CHART =====
        expense_categories_raw = self.expense_service.get_category_breakdown(user_id)

        expense_pie = [
            {"name": c, "y": float(total)}
            for c, total in expense_categories_raw
        ]

        # ===== BAR CHART =====
        income_monthly = self.income_service.get_monthly_income(user_id)
        expense_monthly = self.expense_service.get_monthly_expenses(user_id)

        # Convert to dictionaries
        income_dict = {m[0]: m[1] for m in income_monthly}
        expense_dict = {m[0]: m[1] for m in expense_monthly}

        all_months = sorted(list(set(income_dict.keys()) | set(expense_dict.keys())), key=str)

        categories = list(all_months)
        income_series = [income_dict.get(m, 0) for m in all_months]
        expense_series = [expense_dict.get(m, 0) for m in all_months]

        # ===== ALERTS (CLEAN TEXT) =====
        budgets = self.budget_service.get_budget_status(user_id)

        alerts = [
            f"{b['category']} budget {b['status']}"
            for b in budgets
            if b["status"] in ["warning", "exceeded"]
        ]

        # ===== SMART INSIGHTS ENGINE =====
        insights = []
        priority_insights = []

        # ===== 1. FINANCIAL POSITION (HIGH PRIORITY) =====
        if total_income > 0:
            if total_expenses > total_income:
                deficit = total_expenses - total_income
                priority_insights.append((1, f"You are in a deficit of ${deficit}"))
            elif total_income > total_expenses:
                surplus = total_income - total_expenses
                priority_insights.append((1, f"You are in a surplus of ${surplus}"))
            else:
                priority_insights.append((1, "You are breaking even"))

        # ===== 2. SAVINGS RATE =====
        if total_income > 0:
            savings_rate = (total_income - total_expenses) / total_income
            priority_insights.append((2, f"You saved {round(savings_rate * 100)}% of your income"))

        # ===== 3. TOP SPENDING CATEGORY =====
        if expense_categories_raw:
            highest_category = max(expense_categories_raw, key=lambda x: x[1])
            priority_insights.append(
                (2, f"Top spending category is {highest_category[0]}")
            )

        # ===== 4. MONTHLY TREND (ROLLING BEHAVIOR) =====
        if monthly_net:
            avg_monthly = sum(monthly_net) / len(monthly_net)

            if avg_monthly > 0:
                priority_insights.append(
                    (3, f"On average, you save ${round(avg_monthly)} per month")
                )
            elif avg_monthly < 0:
                priority_insights.append(
                    (3, f"On average, you lose ${round(abs(avg_monthly))} per month")
                )
            else:
                priority_insights.append(
                    (3, "On average, you break even per month")
                )

        # ===== STRUCTURED OUTPUT (NO RANDOM DROPPING) =====
        priority_insights.sort(key=lambda x: x[0])

        high = [t for p, t in priority_insights if p == 1]
        medium = [t for p, t in priority_insights if p == 2]
        low = [t for p, t in priority_insights if p == 3]

        insights = []

        # Always show HIGH priority (critical financial state)
        insights.extend(high)

        # Show up to 2 MEDIUM insights (balance + category)
        insights.extend(medium[:2])

        # Show up to 1 LOW insight (trend)
        insights.extend(low[:1])

        # ===== FINAL RESPONSE =====
        return {
            "summary": {
                "total_income": total_income,
                "total_expenses": total_expenses,
                "remaining_balance": remaining_balance,
                "burn_rate": round(burn_rate, 2)
            },
            "charts": {
                "expense_pie": expense_pie,
                "monthly": {
                    "categories": categories,
                    "income": income_series,
                    "expenses": expense_series
                }
            },
            "alerts": alerts,
            "insights": insights
        }