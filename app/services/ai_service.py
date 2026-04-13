from langchain_core.runnables import RunnableLambda
import httpx
from app.config import get_settings

settings = get_settings()


# =========================
# CALL CUSTOM AI API
# =========================
async def call_ai_api(input_data):
    url = settings.ai_base_url.rstrip("/") + "/api/v1/chat/completions"

    payload = {
        "model": settings.model_name,
        "messages": input_data["messages"],
        "temperature": 0
    }

    headers = {
        "Authorization": f"Bearer {settings.ai_api_key}",
        "Content-Type": "application/json"
    }

    try:
        async with httpx.AsyncClient() as client:
            res = await client.post(url, json=payload, headers=headers)

        print("AI STATUS:", res.status_code)
        print("AI RESPONSE:", res.text)

        data = res.json()

        return data["choices"][0]["message"]["content"]

    except Exception as e:
        print("AI ERROR:", str(e))
        return "AI service is currently unavailable."


# =========================
# LANGCHAIN WRAPPER
# =========================
llm = RunnableLambda(call_ai_api)


# =========================
# MAIN FUNCTION
# =========================
async def generate_ai_response(
    user_id: int,
    message: str,
    income_service,
    expense_service,
    subscription_service
):

    incomes = income_service.get_user_income(user_id)
    expenses = expense_service.get_user_expenses(user_id)
    subscriptions = subscription_service.get_user_subscriptions(user_id)

    total_income = sum(i.amount for i in incomes)
    total_expenses = sum(e.amount for e in expenses)
    total_subs = sum(s.monthly_equivalent for s in subscriptions)

    balance = total_income - total_expenses

    context = f"""
You are a personal finance assistant.

Income: {total_income}
Expenses: {total_expenses}
Subscriptions: {total_subs}
Balance: {balance}

Give short practical advice.
"""

    result = await llm.ainvoke({
        "messages": [
            {"role": "system", "content": context},
            {"role": "user", "content": message}
        ]
    })

    return result

""" from langchain_openai import ChatOpenAI
from app.config import get_settings

from app.dependencies.income import get_income_service
from app.dependencies.expense import get_expense_service
from app.dependencies.subscription import get_subscription_service

settings = get_settings()

print("AI BASE URL:", settings.ai_base_url)
print("MODEL:", settings.model_name)

from langchain_openai import OpenAI
from app.config import get_settings

settings = get_settings()

llm = ChatOpenAI(
    model=settings.model_name,
    api_key=settings.ai_api_key,
    base_url="https://ai-gen.sundaebytestt.com/v1",
    temperature=0,
)

async def generate_ai_response(
    user_id: int,
    message: str,
    income_service,
    expense_service,
    subscription_service
):

    incomes = income_service.get_user_income(user_id)
    expenses = expense_service.get_user_expenses(user_id)
    subscriptions = subscription_service.get_user_subscriptions(user_id)

    total_income = sum(i.amount for i in incomes)
    total_expenses = sum(e.amount for e in expenses)
    total_subs = sum(s.monthly_equivalent for s in subscriptions)

    balance = total_income - total_expenses

    alerts = []

    if total_expenses > total_income:
        alerts.append("User is overspending")

    if total_subs > total_income * 0.2:
        alerts.append("High subscription cost")

    if total_income > 0 and total_expenses / total_income > 0.8:
        alerts.append("Spending is very high")

    alerts_text = ", ".join(alerts) if alerts else "No major alerts"

    context = f"""
""" You are a personal finance assistant.

    USER FINANCIAL DATA:
    - Income: {total_income}
    - Expenses: {total_expenses}
    - Subscriptions: {total_subs}
    - Balance: {balance}
    - Alerts: {alerts_text}

    TASK:
    - Explain the user's financial situation
    - Give simple advice
    - Be concise and practical
    """"""
    response = await llm.ainvoke([
        {"role": "system", "content": context},
        {"role": "user", "content": message}
    ])

    return response.content """