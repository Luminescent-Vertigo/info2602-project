from fastapi import APIRouter, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from datetime import date
from typing import Optional
from app.schemas.subscription import SubscriptionRead
from app.models.expense import Expense
from app.dependencies import AuthDep, SubscriptionServiceDep, ExpenseServiceDep
from dateutil.relativedelta import relativedelta
from datetime import date
from fastapi.templating import Jinja2Templates
from . import router, templates


# =========================
# PAGE ROUTES
# =========================

@router.get("/subscriptions", response_class=HTMLResponse)
def subscriptions_page(request: Request, user: AuthDep, service: SubscriptionServiceDep):
    service.update_statuses(user.id)

    subscriptions = service.get_user_subscriptions(user.id)

    return templates.TemplateResponse(
        request=request,
        name="subscriptions.html",
        context={
            "request": request,
            "user": user,
            "subscriptions": subscriptions
        }
    )


@router.get("/subscriptions/add", response_class=HTMLResponse)
def add_subscription_page(request: Request, user: AuthDep):
    return templates.TemplateResponse(
        request=request,
        name="add_subscription.html",
        context={
            "request": request,
            "user": user
        }
    )


@router.post("/subscriptions/add")
def create_subscription(
    request: Request,
    user: AuthDep,
    service: SubscriptionServiceDep,
    name: str = Form(...),
    cost: float = Form(...),
    billing_cycle: str = Form(...),
    next_payment_date: date = Form(...)
):
    # -----------------------
    # MONTHLY EQUIVALENT
    # -----------------------
    if billing_cycle == "monthly":
        monthly_equivalent = cost
    else:
        monthly_equivalent = cost / 12

    # -----------------------
    # STATUS CALCULATION
    # -----------------------
    today = date.today()
    days_diff = (next_payment_date - today).days

    if days_diff < 0:
        status = "overdue"
    elif days_diff <= 7:
        status = "due"
    else:
        status = "active"

    # -----------------------
    # SAVE
    # -----------------------
    service.create_subscription(user.id, {
        "name": name,
        "cost": cost,
        "billing_cycle": billing_cycle,
        "next_payment_date": next_payment_date,
        "monthly_equivalent": monthly_equivalent,
        "status": status
    })

    return RedirectResponse("/subscriptions", status_code=303)


# =========================
# API ROUTES
# =========================

@router.get("/api/subscriptions")
def get_subscriptions(
    user: AuthDep,
    service: SubscriptionServiceDep,
    status: Optional[str] = None
):
    service.update_statuses(user.id)

    subs = service.get_user_subscriptions(user.id)

    if status:
        subs = [s for s in subs if s.status == status]

    #return subs
    return [SubscriptionRead.model_validate(s) for s in subs]


@router.put("/api/subscriptions/{subscription_id}")
def update_subscription(
    subscription_id: int,
    user: AuthDep,
    service: SubscriptionServiceDep,
    name: Optional[str] = Form(None),
    cost: Optional[float] = Form(None),
    billing_cycle: Optional[str] = Form(None),
    next_payment_date: Optional[date] = Form(None),
):
    return service.update_subscription(subscription_id, {
        "name": name,
        "cost": cost,
        "billing_cycle": billing_cycle,
        "next_payment_date": next_payment_date
    })


@router.delete("/api/subscriptions/{subscription_id}")
def delete_subscription(
    subscription_id: int,
    user: AuthDep,
    service: SubscriptionServiceDep
):
    service.delete_subscription(subscription_id)
    return {"message": "deleted"}


@router.post("/api/subscriptions/{subscription_id}/pay")
def mark_as_paid(subscription_id: int, service: SubscriptionServiceDep, user: AuthDep):

    sub = service.subscription_repo.get_by_id(subscription_id)

    if not sub:
        return {"error": "not found"}

    # mark as paid TEMPORARILY
    # sub.status = "paid"
    sub.last_paid_date = date.today()

    # move next payment forward
    if sub.billing_cycle == "monthly":
        sub.next_payment_date += relativedelta(months=1)
    else:
        sub.next_payment_date += relativedelta(years=1)

    # IMPORTANT: reset back to active immediately
    sub.status = "active"

    service.subscription_repo.update(sub)

    # create expense
    expense = Expense(
        user_id=sub.user_id,
        name=sub.name,
        amount=sub.cost,
        category="Subscription",
        date=date.today(),
        comment="Auto-generated from subscription payment"
    )

    service.expense_repo.create(expense)

    return {"message": "Payment successful"}
 

# =========================
# ANALYTICS ROUTES
# =========================

# Total Monthly Cost
@router.get("/api/subscriptions/summary")
def get_total_monthly(
    user: AuthDep,
    service: SubscriptionServiceDep
):
    total = service.get_total_monthly_cost(user.id)
    return {"total": total}

