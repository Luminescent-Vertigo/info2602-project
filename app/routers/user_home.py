from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi import status
from app.dependencies.session import SessionDep
from app.dependencies.auth import AuthDep, IsUserLoggedIn, get_current_user, is_admin
from . import router, templates

@router.get("/dashboard", response_class=HTMLResponse)
async def user_home_view(
    request: Request,
    user: AuthDep,
    db: SessionDep
):
    return templates.TemplateResponse(
        request=request,
        name="dashboard.html",
        context={
            "request": request,
            "user": user,
        }
    )

@router.post("/toggle-theme")
async def toggle_theme(
    user: AuthDep,
    db: SessionDep
):
    user.theme = "dark" if user.theme == "light" else "light"

    db.add(user)
    db.commit()

    return {"status": "ok"}