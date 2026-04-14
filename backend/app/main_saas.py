"""
Single-tenant FastAPI Application
Routine Scheduler for a single educational institution
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from app.core.database_saas import engine, Base
from app.core.config_saas import settings
import os
import logging
import traceback

logger = logging.getLogger(__name__)

# Import all models BEFORE create_all so tables are registered with Base
from app.models import models  # noqa: F401

# Initialize database (creates tables if not exist, skips existing ones)
Base.metadata.create_all(bind=engine, checkfirst=True)

app = FastAPI(
    title="Routine Scheduler API",
    description="API for managing class schedules, teachers, and subjects",
    version="3.0.0",
    redirect_slashes=True
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {exc}")
    logger.error(traceback.format_exc())
    return JSONResponse(status_code=500, content={"detail": str(exc)})

# Include API routers
from app.api.routes import (
    departments, teachers, subjects, schedules, programmes, 
    semesters, semester_subjects, classes, rooms, days, 
    periods, teacher_subjects, class_routines, auth, users, calendar, shifts, finance
)

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
        "message": "Routine Scheduler API",
        "version": "3.0.0",
        "environment": settings.ENVIRONMENT,
        "docs": "/docs"
    }

@app.get("/api/health")
def health_check():
    """Health check endpoint for Docker and monitoring"""
    return {
        "status": "healthy",
        "version": "3.0.0",
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
    return JSONResponse(
        status_code=500,
        content={"detail": error_msg}
    )
