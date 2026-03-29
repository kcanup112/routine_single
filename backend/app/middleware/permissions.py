"""
Permission middleware to restrict system administrator access
System admin (tenant_id=78, subdomain='system') can only access admin routes
"""
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from typing import Optional

# Routes accessible to system administrator
SYSTEM_ADMIN_ALLOWED_ROUTES = [
    "/api/admin",           # All admin routes
    "/api/tenants",         # Tenant management
    "/auth",                # Authentication
    "/docs",                # API documentation
    "/openapi.json",        # OpenAPI spec
    "/api/users",           # User management
    "/",                    # Root
    "/favicon.ico"
]

# Routes that require tenant context (blocked for system admin)
TENANT_SPECIFIC_ROUTES = [
    "/departments",
    "/programmes",
    "/semesters",
    "/classes",
    "/teachers",
    "/subjects",
    "/schedules",
    "/semester_subjects",
    "/rooms",
    "/days",
    "/shifts",
    "/periods",
    "/teacher_subjects",
    "/class_routines",
    "/api/calendar"
]


def get_cors_headers(request: Request) -> dict:
    """Get CORS headers based on request origin"""
    origin = request.headers.get("origin", "")
    # Allow any localhost subdomain
    if origin and ("localhost" in origin or "127.0.0.1" in origin):
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    return {}


def is_route_allowed_for_system_admin(path: str) -> bool:
    """
    Check if route is allowed for system administrator
    
    Args:
        path: Request URL path
        
    Returns:
        True if route is allowed, False otherwise
    """
    # Block tenant-specific routes FIRST (most specific check)
    for blocked_route in TENANT_SPECIFIC_ROUTES:
        if path.startswith(blocked_route):
            return False
    
    # Allow explicitly permitted routes
    for allowed_route in SYSTEM_ADMIN_ALLOWED_ROUTES:
        if path.startswith(allowed_route):
            return True
    
    # Block other unknown routes by default for system admin
    return False


async def system_admin_permission_middleware(request: Request, call_next):
    """
    Middleware to enforce system admin access restrictions
    System admin should only access admin panel, not routine management
    
    This middleware runs BEFORE tenant_context_middleware to catch blocked routes early
    """
    # Skip for OPTIONS requests
    if request.method == "OPTIONS":
        return await call_next(request)
    
    # Get user from Authorization header if present
    auth_header = request.headers.get("Authorization")
    subdomain_header = request.headers.get("X-Tenant-Subdomain")
    path = request.url.path
    
    print(f"[PERMISSION] Path: {path}, Subdomain: {subdomain_header}")
    
    # Only apply restrictions if subdomain is 'system'
    if subdomain_header == 'system' and auth_header:
        print(f"[PERMISSION] System admin detected, checking path: {path}")
        
        # Check if route is allowed
        if not is_route_allowed_for_system_admin(path):
            print(f"[PERMISSION] BLOCKING system admin access to: {path}")
            cors_headers = get_cors_headers(request)
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "detail": "System administrator cannot access routine management endpoints. Access restricted to tenant management only."
                },
                headers=cors_headers
            )
        else:
            print(f"[PERMISSION] ALLOWING system admin access to: {path}")
    
    # Continue processing request
    response = await call_next(request)
    return response
