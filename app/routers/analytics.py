from fastapi import Request
from fastapi.responses import HTMLResponse

from app.dependencies import AuthDep
from app.dependencies.analytics import AnalyticsServiceDep

from . import router, templates


# =========================
# PAGE ROUTE
# =========================
@router.get("/analytics", response_class=HTMLResponse)
def analytics_page(request: Request, user: AuthDep):
    return templates.TemplateResponse(
        request=request,
        name="analytics.html",
        context={
            "request": request,
            "user": user
        }
    )


# =========================
# API ROUTE
# =========================

@router.get("/api/analytics")
def get_analytics_data(
    user: AuthDep,
    service: AnalyticsServiceDep,
    month: str = None,
    start: str = None,
    end: str = None
):
    return service.get_analytics_data(user.id, month, start, end)
