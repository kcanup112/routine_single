"""
Database connection and session management for multi-tenant SaaS
Uses PostgreSQL with schema-based isolation
"""
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from contextvars import ContextVar
from app.core.config_saas import settings

# Create PostgreSQL engine
# Use PgBouncer connection pooling in production
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before using
    pool_size=10,
    max_overflow=20,
    echo=settings.DEBUG  # Log SQL queries in debug mode
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Context variable to store tenant schema for current request
_tenant_schema_ctx: ContextVar[str] = ContextVar('tenant_schema', default=None)

def get_db():
    """
    Dependency for FastAPI routes to get database session
    Usage: db: Session = Depends(get_db)
    
    Automatically sets the tenant schema if available in context
    """
    db = SessionLocal()
    try:
        # Get tenant schema from context variable (set by middleware)
        schema = _tenant_schema_ctx.get()
        if schema:
            # Set search_path for this session
            db.execute(text(f'SET search_path TO "{schema}", public'))
            db.commit()
        yield db
    finally:
        db.close()

def create_tenant_schema(db_session, schema_name: str):
    """
    Create a new schema for a tenant
    Execute tenant schema template SQL
    """
    # Create schema
    db_session.execute(text(f"CREATE SCHEMA IF NOT EXISTS {schema_name}"))
    db_session.commit()
    
    # TODO: Execute tenant schema template SQL
    # This should create all tenant-specific tables (shifts, periods, classes, etc.)
    # Will be implemented when we execute DATABASE_SCHEMA.sql tenant template section
    
    print(f"Created schema: {schema_name}")

def drop_tenant_schema(db_session, schema_name: str):
    """
    Drop a tenant schema (CASCADE)
    Use with caution - deletes all tenant data!
    """
    db_session.execute(text(f"DROP SCHEMA IF EXISTS {schema_name} CASCADE"))
    db_session.commit()
    print(f"Dropped schema: {schema_name}")

def set_tenant_context(db_session, schema_name: str):
    """
    Set search_path to tenant schema
    All subsequent queries will run in this schema
    """
    db_session.execute(text(f'SET search_path TO "{schema_name}", public'))
    db_session.commit()

def init_database():
    """
    Initialize database - create tables in public schema
    Run this once on first deployment
    """
    # Import all models to register them
    from app.models import models_saas
    
    # Create tables in public schema
    Base.metadata.create_all(bind=engine)
    print("Database initialized - public schema tables created")
