"""
Multi-tenant SaaS FastAPI Application
Schema-based isolation for educational institutions
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from app.core.database_saas import engine, Base
from app.core.config_saas import settings
from app.middleware.tenant import tenant_context_middleware
from app.middleware.permissions import system_admin_permission_middleware
import os
import logging

logger = logging.getLogger(__name__)

# Import all models BEFORE create_all so tables are registered with Base
from app.models import models, models_saas  # noqa: F401

# Initialize database (creates public schema tables if not exist)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Routine Scheduler SaaS API",
    description="Multi-tenant API for managing class schedules, teachers, and subjects",
    version="2.0.0",
    redirect_slashes=True
)

# CORS middleware - Allow localhost and any subdomain of localhost on any port (dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
    ],
    # Broad regex: http(s)://<anything>.localhost:<any port>
    allow_origin_regex=r"https?://([a-z0-9-]+\.)?localhost(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Tenant context middleware (schema isolation)
# Registered FIRST but executes SECOND (middleware execute in reverse order)
@app.middleware("http")
async def tenant_middleware(request: Request, call_next):
    return await tenant_context_middleware(request, call_next)

# System admin permission middleware (restrict to tenant management only)
# Registered SECOND so executes FIRST (before tenant middleware)
@app.middleware("http")
async def permission_middleware(request: Request, call_next):
    return await system_admin_permission_middleware(request, call_next)

# Include existing API routers
from app.api.routes import (
    departments, teachers, subjects, schedules, programmes, 
    semesters, semester_subjects, classes, rooms, days, 
    periods, teacher_subjects, class_routines, auth, users, calendar, tenants, shifts, admin, finance
)

# Public routes (no tenant context required)
app.include_router(tenants.router, prefix="/api/tenants", tags=["tenants"])
app.include_router(admin.router, prefix="/api")
app.include_router(auth.router, prefix="")
app.include_router(users.router, prefix="/api")
app.include_router(departments.router, prefix="")
app.include_router(programmes.router, prefix="")
app.include_router(semesters.router, prefix="")
app.include_router(classes.router, prefix="")
app.include_router(teachers.router, prefix="")
app.include_router(subjects.router, prefix="")
app.include_router(schedules.router, prefix="")
app.include_router(semester_subjects.router, prefix="")
app.include_router(rooms.router, prefix="")
app.include_router(days.router, prefix="")
app.include_router(shifts.router, prefix="")
app.include_router(periods.router, prefix="")
app.include_router(teacher_subjects.router, prefix="")
app.include_router(class_routines.router, prefix="")
app.include_router(calendar.router, prefix="/api/calendar", tags=["calendar"])
app.include_router(finance.router, prefix="/finance", tags=["finance"])

@app.get("/")
def root():
    return {
        "message": "Routine Scheduler SaaS API",
        "version": "2.0.0",
        "environment": settings.ENVIRONMENT,
        "docs": "/docs"
    }

@app.get("/api/health")
def health_check():
    """Health check endpoint for Docker and monitoring"""
    return {
        "status": "healthy",
        "version": "2.0.0",
        "database": "connected" if engine else "disconnected"
    }

@app.get("/favicon.ico")
def favicon():
    """Return 204 No Content for favicon requests to avoid 404 errors"""
    return Response(status_code=204)

@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={"detail": "Endpoint not found"}
    )

@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    logger.error(f"Internal server error on {request.url.path}: {exc}")
    error_msg = str(exc) if settings.DEBUG else "Internal server error"
    # Check for common database errors
    if "does not exist" in str(exc) or "UndefinedTable" in str(exc):
        return JSONResponse(
            status_code=503,
            content={"detail": "Tenant schema is not ready yet. Please try again shortly."}
        )
    return JSONResponse(
        status_code=500,
        content={"detail": error_msg}
    )
