from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.api.routes import departments, teachers, subjects, schedules, programmes, semesters, semester_subjects, classes, rooms, days, periods, teacher_subjects, class_routines, finance, deploy

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="KEC Routine Scheduler API",
    description="API for managing class schedules, teachers, and subjects",
    version="1.0.0",
    redirect_slashes=False
)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://172.16.100.219:3000",
        "*"  # Allow all origins
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(departments.router, prefix="/api")
app.include_router(programmes.router, prefix="/api")
app.include_router(semesters.router, prefix="/api")
app.include_router(classes.router, prefix="/api")
app.include_router(teachers.router, prefix="/api")
app.include_router(subjects.router, prefix="/api")
app.include_router(schedules.router, prefix="/api")
app.include_router(semester_subjects.router, prefix="/api")
app.include_router(rooms.router, prefix="/api")
app.include_router(days.router, prefix="/api")
app.include_router(periods.router, prefix="/api")
app.include_router(teacher_subjects.router, prefix="/api")
app.include_router(class_routines.router, prefix="/api")
app.include_router(finance.router, prefix="/api/finance", tags=["finance"])
app.include_router(deploy.router, prefix="/api/deploy", tags=["deploy"])

@app.get("/")
def root():
    return {
        "message": "KEC Routine Scheduler API",
        "docs": "/docs",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
