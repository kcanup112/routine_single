"""
Middleware package for multi-tenant SaaS
"""
from app.middleware.tenant import tenant_context_middleware

__all__ = ['tenant_context_middleware']
