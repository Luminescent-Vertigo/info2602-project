from collections import defaultdict
from datetime import datetime


class AnalyticsService:

    def __init__(self, income_service, expense_service, budget_service, subscription_service):
        self.income_service = income_service
        self.expense_service = expense_service
        self.budget_service = budget_service
        self.subscription_service = subscription_service

    # =========================
    # FILTERS (ROBUST)
    # =========================
    def _apply_filters(self, items, month=None, start=None, end=None):
        filtered = []

        start_date = datetime.strptime(start, "%Y-%m-%d").date() if start else None
        end_date = datetime.strptime(end, "%Y-%m-%d").date() if end else None

        for item in items:
            d = item.date

            # PRIORITY: date range overrides month
            if start_date and end_date:
                if not (start_date <= d <= end_date):
                    continue

            elif month:
                if d.strftime("%m") != month:
                    continue

            filtered.append(item)

        return filtered

    # =========================
    # GROUP BY MONTH
    # =========================
    def _group_by_month(self, items):
        data = defaultdict(float)

        for item in items:
            key = item.date.strftime("%Y-%m")
            data[key] += item.amount

        return dict(data)

    # =========================
    # GROUP BY WEEK
    # =========================
    def _group_by_week(self, items):
        data = defaultdict(float)

        for item in items:
            year, week, _ = item.date.isocalendar()
            #key = f"{year}-W{week}"
            key = item.date.strftime("%b %d")
            data[key] += item.amount

        return dict(data)

    # =========================
    # INSIGHTS
    # =========================
    def _generate_insights(self, total_income, total_expenses, net,
                           category_raw, monthly_expenses, budgets, subscriptions):

        insights = []

        insights.append(
            f"Income: ${round(total_income)}, Expenses: ${round(total_expenses)}, Net: ${round(net)}"
        )

        if total_income > 0:
            ratio = (total_expenses / total_income) * 100
            if ratio > 80:
                insights.append("High spending (>80% income)")
            elif ratio < 40:
                insights.append("Strong savings behavior")

        total_cat = sum(v for _, v in category_raw)

        if total_cat > 0:
            top = max(category_raw, key=lambda x: x[1])
            percent = (top[1] / total_cat) * 100
            if percent > 50:
                insights.append(f"High spending in {top[0]} ({round(percent)}%)")

        if len(monthly_expenses) >= 2:
            change = ((monthly_expenses[-1] - monthly_expenses[-2]) / max(monthly_expenses[-2], 1)) * 100
            insights.append(f"Spending change: {round(change)}%")

        for b in budgets:
            if b["status"] == "exceeded":
                insights.append(f"Budget exceeded: {b.get('name', 'category')}")

        if subscriptions:
            total_sub = sum(s.monthly_equivalent for s in subscriptions)
            insights.append(f"Subscriptions: ${round(total_sub)}")

        return insights[:6]

    # =========================
    # MAIN
    # =========================
    def get_analytics_data(self, user_id: int, month=None, start=None, end=None):

        incomes = self.income_service.get_user_income(user_id)
        expenses = self.expense_service.get_user_expenses(user_id)

        budgets = self.budget_service.get_budget_status(user_id)
        subscriptions = self.subscription_service.get_user_subscriptions(user_id)

        incomes_f = self._apply_filters(incomes, month, start, end)
        expenses_f = self._apply_filters(expenses, month, start, end)

        # =========================
        # EMPTY SAFE STATE
        # =========================
        if not expenses_f:
            return {
                "summary": {
                    "total_income": 0,
                    "total_expenses": 0,
                    "net": 0,
                    "burn_rate": 0,
                    "subscriptions": 0
                },
                "charts": {
                    "monthly": {"categories": [], "income": [], "expenses": [], "net": []},
                    "weekly": {"categories": [], "data": []},
                    "category_pie": []
                },
                "insights": ["No data for selected date range"]
            } 
                    

        # =========================
        # TOTALS
        # =========================
        total_income = sum(i.amount for i in incomes_f)
        total_expenses = sum(e.amount for e in expenses_f)
        net = total_income - total_expenses

        # =========================
        # MONTHLY
        # =========================
        income_month = self._group_by_month(incomes_f)
        expense_month = self._group_by_month(expenses_f)

        all_months = sorted(set(income_month) | set(expense_month))

        monthly_income = [income_month.get(m, 0) for m in all_months]
        monthly_expenses = [expense_month.get(m, 0) for m in all_months]
        monthly_net = [i - e for i, e in zip(monthly_income, monthly_expenses)]

        # =========================
        # WEEKLY (FIXED SAFETY)
        # =========================
        week_map = self._group_by_week(expenses_f)

        weeks = sorted(week_map.keys())
        weekly_values = [week_map[w] for w in weeks]

        if not weeks:
            weeks = ["No data"]
            weekly_values = [0]

        # =========================
        # BURN RATE (FIXED)
        # =========================
        if expenses_f:
            dates = [e.date for e in expenses_f]

            if len(dates) >= 2:
                days = (max(dates) - min(dates)).days + 1
            else:
                days = 1

            burn_rate = total_expenses / days
        else:
            burn_rate = 0

        # =========================
        # CATEGORY PIE
        # =========================
        category_map = defaultdict(float)

        for e in expenses_f:
            category_map[e.category] += e.amount

        category_pie = [{"name": k, "y": float(v)} for k, v in category_map.items()]

        # =========================
        # SUBSCRIPTIONS
        # =========================
        monthly_subscriptions = sum(s.monthly_equivalent for s in subscriptions)

        # =========================
        # INSIGHTS
        # =========================
        insights = self._generate_insights(
            total_income,
            total_expenses,
            net,
            list(category_map.items()),
            monthly_expenses,
            budgets,
            subscriptions
        )

        return {
            "summary": {
                "total_income": total_income,
                "total_expenses": total_expenses,
                "net": net,
                "burn_rate": round(burn_rate, 2),
                "subscriptions": round(monthly_subscriptions, 2)
            },
            "charts": {
                "monthly": {
                    "categories": all_months,
                    "income": monthly_income,
                    "expenses": monthly_expenses,
                    "net": monthly_net
                },
                "weekly": {
                    "categories": weeks,
                    "data": weekly_values
                },
                "category_pie": category_pie
            },
            "insights": insights
        }