from fastapi import APIRouter, Request, Depends, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from datetime import date
from typing import Optional

from app.dependencies import AuthDep, IncomeServiceDep
from app.services.income_service import IncomeService

from . import router, templates

# =========================
# PAGE ROUTES
# =========================

# Income page
@router.get("/income", response_class=HTMLResponse)
def income_page(request: Request, user: AuthDep, service: IncomeServiceDep):
    income = service.get_user_income(user.id)
    return templates.TemplateResponse(
        request=request,
        name="income.html",
        context={
            "request": request, 
            "user": user,
            "income": income
        }
    )


# Add Income page
@router.get("/income/add", response_class=HTMLResponse)
def add_income_page(request: Request, user: AuthDep):
    return templates.TemplateResponse(
        request=request,
        name="add_income.html",
        context={
            "request": request, 
            "user": user
        }
    )


# Handle Add Income form submission
@router.post("/income/add")
def create_income_form(
    request: Request,
    user: AuthDep,
    service: IncomeServiceDep,
    name: str = Form(...),
    amount: float = Form(...),
    category: str = Form(...),
    date: date = Form(...),
    comment: Optional[str] = Form(None),
    custom_category: Optional[str] = Form(None)
):
    # Handle "Other" category
    if category == "Other":
        if not custom_category or not custom_category.strip():
            return templates.TemplateResponse(
                request=request,
                name="add_income.html",
                context={
                    "request": request,
                    "user": user,
                    "error": "Please specify a category."
                }
            )
        category = custom_category.strip()

    # Optional: normalize category text
    category = category.title()

    # Create income
    service.create_income(user.id, {
        "name": name,
        "amount": amount,
        "category": category,
        "date": date,
        "comment": comment
    })

    return RedirectResponse("/income", status_code=303)


# =========================
# API ROUTES
# =========================

# Get Income
@router.get("/api/income")
def get_income(
    user: AuthDep,
    service: IncomeServiceDep,
    category: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    income = service.get_user_income(user.id)

    if category:
        income = [e for e in income if e.category == category]

    if start_date:
        income = [e for e in income if e.date >= start_date]

    if end_date:
        income = [e for e in income if e.date <= end_date]

    return income


# Update Income
@router.put("/api/income/{income_id}")
def update_income(
    income_id: int,
    user: AuthDep,
    service: IncomeServiceDep,
    name: Optional[str] = Form(None),
    amount: Optional[float] = Form(None),
    category: Optional[str] = Form(None),
    date: Optional[date] = Form(None),
    comment: Optional[str] = Form(None)
):
    return service.update_income(income_id, {
        "name": name,
        "amount": amount,
        "category": category,
        "date": date,
        "comment": comment
    })


# Delete Income
@router.delete("/api/income/{income_id}")
def delete_income(
    income_id: int,
    user: AuthDep,
    service: IncomeServiceDep
):
    service.delete_income(income_id)
    return {"message": "deleted"}



# =========================
# ANALYTICS ROUTES (FOR CHARTS)
# =========================

# Total Spending
@router.get("/api/income/summary")
def get_total_income(
    user: AuthDep,
    service: IncomeServiceDep
):
    total = service.get_total_income(user.id)
    return {"total": total}


# Category Breakdown (for pie chart)
@router.get("/api/income/category-breakdown")
def category_breakdown(
    user: AuthDep,
    service: IncomeServiceDep
):
    return service.get_category_breakdown(user.id)


# Monthly Income (for line/bar chart)
@router.get("/api/income/monthly")
def monthly_income(
    user: AuthDep,
    service: IncomeServiceDep
):
    return service.get_monthly_income(user.id)