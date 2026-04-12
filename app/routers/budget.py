from fastapi import APIRouter, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from typing import Optional
from datetime import date
from app.dependencies import AuthDep
from app.dependencies.budget import BudgetServiceDep
from fastapi.templating import Jinja2Templates

from . import router, templates


# =========================
# PAGE ROUTE
# =========================

@router.get("/budgets", response_class=HTMLResponse)
def budgets_page(request: Request, user: AuthDep):
    return templates.TemplateResponse(
        request=request,
        name="budgets.html",
        context={
            "request": request,
            "user": user
        }
    )


# =========================
# CREATE (MODAL FORM)
# =========================

@router.post("/budgets/add")
def create_budget(
    user: AuthDep,
    service: BudgetServiceDep,
    name: str = Form(...),
    category: str = Form(...),
    category_other: Optional[str] = Form(None),
    limit_amount: float = Form(...),
    start_date: date = Form(...),
    end_date: date = Form(...)
):
    if category == "Other" and category_other:
        category = category_other

    if start_date > end_date:
        raise Exception("Start date cannot be after end date")

    service.create_budget(user.id, {
        "name": name,
        "category": category,
        "limit_amount": limit_amount,
        "start_date": start_date,
        "end_date": end_date
    })

    return RedirectResponse("/budgets", status_code=303)

# =========================
# API ROUTES
# =========================

@router.get("/api/budgets")
def get_budgets(user: AuthDep, service: BudgetServiceDep):
    return service.get_budget_status(user.id)


@router.put("/api/budgets/{budget_id}")
def update_budget(
    budget_id: int,
    user: AuthDep,
    service: BudgetServiceDep,
    name: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    limit_amount: Optional[float] = Form(None),
    start_date: Optional[date] = Form(None),
    end_date: Optional[date] = Form(None)
):
    return service.update_budget(budget_id, {
        "name": name,
        "category": category,
        "limit_amount": limit_amount,
        "start_date": start_date,
        "end_date": end_date
    })


@router.delete("/api/budgets/{budget_id}")
def delete_budget(
    budget_id: int,
    user: AuthDep,
    service: BudgetServiceDep
):
    service.delete_budget(budget_id)
    return {"message": "deleted"}