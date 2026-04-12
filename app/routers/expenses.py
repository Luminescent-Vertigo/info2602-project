from fastapi import APIRouter, Request, Depends, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from datetime import date
from typing import Optional

from app.dependencies import AuthDep, ExpenseServiceDep
from app.services.expense_service import ExpenseService

from . import router, templates

# =========================
# PAGE ROUTES
# =========================

# Expenses page
@router.get("/expenses", response_class=HTMLResponse)
def expenses_page(request: Request, user: AuthDep, service: ExpenseServiceDep):
    expenses = service.get_user_expenses(user.id)
    return templates.TemplateResponse(
        request=request,
        name="expenses.html",
        context={
            "request": request, 
            "user": user,
            "expenses": expenses
        }
    )


# Add Expense page
@router.get("/expenses/add", response_class=HTMLResponse)
def add_expense_page(request: Request, user: AuthDep):
    return templates.TemplateResponse(
        request=request,
        name="add_expense.html",
        context={
            "request": request, 
            "user": user
        }
    )


# Handle Add Expense form submission
@router.post("/expenses/add")
def create_expense_form(
    request: Request,
    user: AuthDep,
    service: ExpenseServiceDep,
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
                name="add_expense.html",
                context={
                    "request": request,
                    "user": user,
                    "error": "Please specify a category."
                }
            )
        category = custom_category.strip()

    # Optional: normalize category text
    category = category.title()

    # Create expense
    service.create_expense(user.id, {
        "name": name,
        "amount": amount,
        "category": category,
        "date": date,
        "comment": comment
    })

    return RedirectResponse("/expenses", status_code=303)

# =========================
# API ROUTES
# =========================

# Get Expenses
@router.get("/api/expenses")
def get_expenses(
    user: AuthDep,
    service: ExpenseServiceDep,
    category: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    expenses = service.get_user_expenses(user.id)

    if category:
        expenses = [e for e in expenses if e.category == category]

    if start_date:
        expenses = [e for e in expenses if e.date >= start_date]

    if end_date:
        expenses = [e for e in expenses if e.date <= end_date]

    return expenses


# Update Expense
@router.put("/api/expenses/{expense_id}")
def update_expense(
    expense_id: int,
    user: AuthDep,
    service: ExpenseServiceDep,
    name: Optional[str] = Form(None),
    amount: Optional[float] = Form(None),
    category: Optional[str] = Form(None),
    date: Optional[date] = Form(None),
    comment: Optional[str] = Form(None)
):
    return service.update_expense(expense_id, {
        "name": name,
        "amount": amount,
        "category": category,
        "date": date,
        "comment": comment
    })

# Delete Expense
@router.delete("/api/expenses/{expense_id}")
def delete_expense(
    expense_id: int,
    user: AuthDep,
    service: ExpenseServiceDep
):
    service.delete_expense(expense_id)
    return {"message": "deleted"}



# =========================
# ANALYTICS ROUTES (FOR CHARTS)
# =========================

# Total Spending
@router.get("/api/expenses/summary")
def get_total_expenses(
    user: AuthDep,
    service: ExpenseServiceDep
):
    total = service.get_total_expenses(user.id)
    return {"total": total}


# Category Breakdown (for pie chart)
@router.get("/api/expenses/category-breakdown")
def category_breakdown(
    user: AuthDep,
    service: ExpenseServiceDep
):
    return service.get_category_breakdown(user.id)


# Monthly Expenses (for line/bar chart)
@router.get("/api/expenses/monthly")
def monthly_expenses(
    user: AuthDep,
    service: ExpenseServiceDep
):
    return service.get_monthly_expenses(user.id)