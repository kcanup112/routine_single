"""
Database module — backward compatibility with existing imports
"""
from app.core.database_saas import (
    engine,
    SessionLocal,
    Base,
    get_db,
    init_database,
)

__all__ = [
    'engine',
    'SessionLocal',
    'Base',
    'get_db',
    'init_database',
]
