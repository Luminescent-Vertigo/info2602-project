from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from app.dependencies import AuthDep
from app.dependencies.dashboard import DashboardServiceDep
from . import router, templates

# ===== API ROUTE =====
@router.get("/api/dashboard")
def get_dashboard(user: AuthDep, service: DashboardServiceDep):
    return service.get_dashboard_data(user.id)