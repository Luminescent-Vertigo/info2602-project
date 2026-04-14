from fastapi import APIRouter, Request, Depends

from schemas.ai import ChatRequest
from services.ai_service import generate_ai_response

from app.dependencies import AuthDep
from app.dependencies.income import get_income_service
from app.dependencies.expense import get_expense_service
from app.dependencies.subscription import get_subscription_service

import chromadb
from openai import OpenAI

from . import router, templates


# =========================
# AI PAGE
# =========================
@router.get("/ai")
async def ai_page(request: Request, user: AuthDep):
    return templates.TemplateResponse(
        request=request,
        name="ai_assistant.html",
        context={
            "request": request,
            "user": user
        }
    )

# =========================
# AI CHAT (LANGCHAIN)
# =========================
@router.post("/ai/chat")
async def chat(
    req: ChatRequest,
    user: AuthDep,
    income_service = Depends(get_income_service),
    expense_service = Depends(get_expense_service),
    subscription_service = Depends(get_subscription_service),
):

    ai_response = await generate_ai_response(
        user=user, # Pass the entire user object here
        message=req.message,
        current_page=req.current_page,
        income_service=income_service,
        expense_service=expense_service,
        subscription_service=subscription_service
    )


    return {"response": ai_response}


# =========================
# AI SUMMARY (FOR FRONTEND CARDS)
# =========================
@router.get("/api/ai/summary")
def ai_summary(
    user: AuthDep,
    income_service = Depends(get_income_service),
    expense_service = Depends(get_expense_service),
    subscription_service = Depends(get_subscription_service),
):

    incomes = income_service.get_user_income(user.id)
    expenses = expense_service.get_user_expenses(user.id)
    subscriptions = subscription_service.get_user_subscriptions(user.id)

    total_income = sum(i.amount for i in incomes)
    total_expenses = sum(e.amount for e in expenses)
    balance = total_income - total_expenses

    total_subs = sum(s.monthly_equivalent for s in subscriptions)

    alerts = []

    if total_income > 0 and total_expenses > total_income:
        alerts.append("Overspending detected")

    if total_income > 0 and total_expenses / total_income > 0.8:
        alerts.append("Spending is above 80% of income")

    if total_income > 0 and total_subs > total_income * 0.2:
        alerts.append("Subscriptions exceed 20% of income")

    return {
        "income": total_income,
        "expenses": total_expenses,
        "balance": balance,
        "subscriptions": total_subs,
        "subs_ratio": round((total_subs / total_income) * 100, 1) if total_income else 0,
        "alerts": alerts
    }