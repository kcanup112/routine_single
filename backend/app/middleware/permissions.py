"""
Permission middleware to restrict system administrator and viewer access
System admin (tenant_id=78, subdomain='system') can only access admin routes
Viewer users can only access read-only routine/calendar endpoints
"""
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from typing import Optional
from app.auth.jwt import decode_access_token

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

# Routes that viewer role can access (GET only)
VIEWER_ALLOWED_ROUTES = [
    "/class_routines",
    "/class-routines",
    "/schedules",
    "/api/calendar",
    "/auth/me",
    "/auth/change-password",
    "/teachers",
    "/classes",
    "/days",
    "/periods",
    "/shifts",
    "/departments",
    "/programmes",
    "/semesters",
    "/rooms",
    "/subjects",
    "/semester",
    "/teacher-subjects",
    "/teacher_subjects",
    "/api/users",
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
    Middleware to enforce system admin and viewer access restrictions
    System admin should only access admin panel, not routine management
    Viewers can only access GET on routine/calendar/lookup routes
    
    This middleware runs BEFORE tenant_context_middleware to catch blocked routes early
    """
    # Skip for OPTIONS requests
    if request.method == "OPTIONS":
        return await call_next(request)
    
    # Get user from Authorization header if present
    auth_header = request.headers.get("Authorization")
    subdomain_header = request.headers.get("X-Tenant-Subdomain")
    path = request.url.path
    
    # Only apply restrictions if subdomain is 'system'
    if subdomain_header == 'system' and auth_header:
        # Check if route is allowed
        if not is_route_allowed_for_system_admin(path):
            cors_headers = get_cors_headers(request)
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "detail": "System administrator cannot access routine management endpoints. Access restricted to tenant management only."
                },
                headers=cors_headers
            )
    
    # Viewer role restriction — decode JWT to check role
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1]
        payload = decode_access_token(token)
        if payload and payload.get("role") == "viewer":
            # Viewers can only use GET (and POST for change-password)
            if request.method not in ("GET", "HEAD", "OPTIONS"):
                # Allow POST on change-password only
                if not (request.method == "POST" and path == "/auth/change-password"):
                    cors_headers = get_cors_headers(request)
                    return JSONResponse(
                        status_code=status.HTTP_403_FORBIDDEN,
                        content={
                            "detail": "View-only access. You do not have permission to modify data."
                        },
                        headers=cors_headers
                    )
            
            # For GET requests, check the route is in viewer allowed list
            allowed = False
            for route in VIEWER_ALLOWED_ROUTES:
                if path.startswith(route):
                    allowed = True
                    break
            
            # Also allow docs/openapi for convenience
            if path in ("/", "/docs", "/openapi.json", "/favicon.ico"):
                allowed = True
            
            if not allowed:
                cors_headers = get_cors_headers(request)
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={
                        "detail": "View-only access. This resource is not available for your role."
                    },
                    headers=cors_headers
                )
    
    # Continue processing request
    response = await call_next(request)
    return response
