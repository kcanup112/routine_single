"""
Database module - redirects to SaaS database configuration
This file maintains backward compatibility with existing imports
"""
from app.core.database_saas import (
    engine,
    SessionLocal,
    Base,
    get_db,
    create_tenant_schema,
    set_tenant_context,
    init_database
)

__all__ = [
    'engine',
    'SessionLocal',
    'Base',
    'get_db',
    'create_tenant_schema',
    'set_tenant_context',
    'init_database'
]
