"""
Multi-tenant middleware for schema-based isolation
Extracts tenant from subdomain or header and sets PostgreSQL search_path
"""
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from typing import Optional
from urllib.parse import urlparse
import re

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

def extract_subdomain(host: str, base_domain: str = "localhost") -> Optional[str]:
    """
    Extract subdomain from host header
    Examples:
        kec.localhost:3000 -> kec
        kec.yourapp.com -> kec
        localhost:3000 -> None
        yourapp.com -> None
    """
    if not host:
        return None
    
    # Remove port if present
    host = host.split(':')[0]
    
    # Split by dots
    parts = host.split('.')
    
    # If we have at least a subdomain (e.g., kec.localhost or kec.yourapp.com)
    if len(parts) >= 2:
        # Check if it's not www or direct domain
        subdomain = parts[0]
        if subdomain not in ['www', 'api', '']:
            # Validate subdomain format
            if re.match(r'^[a-z0-9-]+$', subdomain):
                return subdomain
    
    return None

async def get_tenant_from_request(request: Request, db_session):
    """
    Get tenant from request (subdomain or header)
    Priority: X-Tenant-Subdomain header > subdomain from host
    """
    # Debug logging
    print(f"[TENANT] Request path: {request.url.path}")
    print(f"[TENANT] Request method: {request.method}")
    print(f"[TENANT] Headers: {dict(request.headers)}")
    
    # Check header first (useful for API calls)
    subdomain = request.headers.get("X-Tenant-Subdomain")
    print(f"[TENANT] X-Tenant-Subdomain header: {subdomain}")
    
    # If not in header, extract from host
    if not subdomain:
        host = request.headers.get("host", "")
        print(f"[TENANT] Host header: {host}")
        subdomain = extract_subdomain(host)
        print(f"[TENANT] Extracted subdomain: {subdomain}")

    # Fall back to Origin/Referer (handles frontend running on subdomain.localhost hitting backend on localhost)
    if not subdomain:
        origin_header = request.headers.get("origin") or request.headers.get("referer")
        print(f"[TENANT] Origin/Referer header: {origin_header}")
        if origin_header:
            try:
                parsed = urlparse(origin_header)
                host_from_origin = parsed.hostname or ""
                print(f"[TENANT] Host from origin: {host_from_origin}")
                subdomain = extract_subdomain(host_from_origin)
                print(f"[TENANT] Extracted subdomain from origin: {subdomain}")
            except Exception as exc:
                print(f"[TENANT] Failed to parse origin header: {exc}")
    
    if not subdomain:
        # For development, allow tenant-less access to public endpoints
        # All other endpoints REQUIRE tenant context
        if request.url.path.startswith("/api/tenants") or \
           request.url.path.startswith("/api/health") or \
           request.url.path.startswith("/api/admin") or \
           request.url.path.startswith("/api/users") or \
           request.url.path.startswith("/auth") or \
           request.url.path.startswith("/docs") or \
           request.url.path.startswith("/openapi.json") or \
           request.url.path == "/favicon.ico" or \
           request.url.path == "/":
            return None
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant subdomain not found. Use subdomain or X-Tenant-Subdomain header."
        )
    
    # Query tenant from database
    from app.models.models_saas import Tenant
    
    tenant = db_session.query(Tenant).filter(
        Tenant.subdomain == subdomain,
        Tenant.deleted_at.is_(None)
    ).first()
    
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tenant '{subdomain}' not found or inactive"
        )
    
    # Check tenant status
    if tenant.status not in ['active', 'trial']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Tenant account is {tenant.status}. Please contact support."
        )
    
    return tenant

def set_tenant_schema(db_session, schema_name: str):
    """
    Set PostgreSQL search_path to tenant schema
    This ensures all queries run in the tenant's isolated schema
    """
    # Set search_path to tenant schema, with public as fallback
    # Quote schema name to allow hyphens and other special characters
    db_session.execute(text(f'SET search_path TO "{schema_name}", public'))
    db_session.commit()

async def tenant_context_middleware(request: Request, call_next):
    """
    Middleware to establish tenant context for each request
    Sets the appropriate PostgreSQL schema based on tenant
    """
    # Skip middleware for CORS preflight OPTIONS requests
    if request.method == "OPTIONS":
        return await call_next(request)
    
    # Skip middleware for static files and docs
    if request.url.path.startswith("/static") or \
       request.url.path.startswith("/docs") or \
       request.url.path == "/openapi.json":
        return await call_next(request)
    
    # Get database session
    from app.core.database_saas import SessionLocal, _tenant_schema_ctx
    db = SessionLocal()
    
    ctx_token = None
    try:
        # Get tenant from request
        tenant = await get_tenant_from_request(request, db)
        
        if tenant:
            # Set tenant schema context using ContextVar
            ctx_token = _tenant_schema_ctx.set(tenant.schema_name)
            
            # Set PostgreSQL search_path to tenant schema
            set_tenant_schema(db, tenant.schema_name)
            
            # Store tenant info in request state for use in route handlers
            request.state.tenant = tenant
            request.state.tenant_id = tenant.id
            request.state.schema_name = tenant.schema_name
        else:
            # Public endpoints (signup, health check, etc.)
            request.state.tenant = None
            ctx_token = _tenant_schema_ctx.set(None)
        
        # Process request
        response = await call_next(request)
        
        return response
        
    except HTTPException as http_exc:
        db.close()
        # Return JSONResponse with CORS headers for HTTP exceptions
        cors_headers = get_cors_headers(request)
        return JSONResponse(
            status_code=http_exc.status_code,
            content={"detail": http_exc.detail},
            headers=cors_headers
        )
    except Exception as e:
        db.close()
        # Return JSONResponse with CORS headers for other exceptions
        cors_headers = get_cors_headers(request)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": f"Tenant context error: {str(e)}"},
            headers=cors_headers
        )
    finally:
        # Close database session
        if db:
            db.close()
        # Clear context variable
        if ctx_token is not None:
            _tenant_schema_ctx.reset(ctx_token)
        else:
            _tenant_schema_ctx.set(None)
