"""
Tenant Management API Routes
Handles tenant signup, subdomain validation, and tenant operations
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database_saas import get_db
from app.schemas.schemas import (
    TenantSignupRequest,
    TenantSignupResponse,
    TenantResponse,
    SubdomainCheckResponse
)
from app.services.tenant_service import (
    validate_subdomain_format,
    check_subdomain_availability,
    generate_subdomain_suggestions,
    create_tenant_with_schema
)
from app.auth.jwt import create_access_token
from datetime import timedelta
from app.core.config_saas import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/signup", response_model=TenantSignupResponse, status_code=status.HTTP_201_CREATED)
async def signup_tenant(
    signup_data: TenantSignupRequest,
    db: Session = Depends(get_db)
):
    """
    Create a new tenant organization with schema and admin user
    
    This endpoint is PUBLIC and does not require authentication.
    It creates:
    1. Tenant record in public.tenants table
    2. PostgreSQL schema for tenant data isolation
    3. Admin user in public.users table
    4. Default data (days, etc.) in tenant schema
    
    Returns JWT token for immediate login after signup.
    """
    logger.info(f"Signup request for subdomain: {signup_data.subdomain}")
    
    # Validate password strength
    if len(signup_data.admin_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long"
        )
    
    # Create tenant with schema and admin user
    tenant, admin_user, error = create_tenant_with_schema(
        db=db,
        institution_name=signup_data.institution_name,
        subdomain=signup_data.subdomain,
        admin_name=signup_data.admin_name,
        admin_email=signup_data.admin_email,
        admin_password=signup_data.admin_password,
        phone=signup_data.phone,
        city=signup_data.city,
        country=signup_data.country,
        plan=signup_data.plan,
        institution_type=signup_data.institution_type
    )
    
    if error:
        logger.error(f"Signup failed for {signup_data.subdomain}: {error}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error
        )
    
    if not tenant or not admin_user:
        logger.error(f"Signup failed for {signup_data.subdomain}: Unknown error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create tenant account"
        )
    
    # Generate JWT token for auto-login
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": str(admin_user.id),
            "email": admin_user.email,
            "role": admin_user.role
        },
        expires_delta=access_token_expires
    )
    
    logger.info(f"Signup successful for subdomain: {signup_data.subdomain}, admin: {admin_user.email}")
    
    # Prepare response
    tenant_response = TenantResponse(
        id=tenant.id,
        name=tenant.name,
        subdomain=tenant.subdomain,
        schema_name=tenant.schema_name,
        admin_email=tenant.admin_email,
        status=tenant.status,
        plan=tenant.plan,
        institution_type=(tenant.settings or {}).get("institution_type", "engineering"),
        trial_ends_at=tenant.trial_ends_at,
        created_at=tenant.created_at
    )
    
    admin_user_dict = {
        "id": admin_user.id,
        "email": admin_user.email,
        "full_name": admin_user.full_name,
        "role": admin_user.role
    }
    
    return TenantSignupResponse(
        tenant=tenant_response,
        admin_user=admin_user_dict,
        access_token=access_token,
        token_type="bearer",
        message=f"Welcome to {tenant.name}! Your trial account has been created successfully."
    )


@router.get("/check-subdomain", response_model=SubdomainCheckResponse)
async def check_subdomain(
    subdomain: str,
    db: Session = Depends(get_db)
):
    """
    Check if subdomain is available and valid
    
    Returns:
    - available: bool
    - message: string
    - suggestions: list of alternative subdomains if not available
    """
    # Validate format
    is_valid, error_msg = validate_subdomain_format(subdomain)
    
    if not is_valid:
        suggestions = generate_subdomain_suggestions(subdomain, db)
        return SubdomainCheckResponse(
            available=False,
            subdomain=subdomain,
            message=error_msg,
            suggestions=suggestions if suggestions else None
        )
    
    # Check availability
    is_available = check_subdomain_availability(db, subdomain)
    
    if is_available:
        return SubdomainCheckResponse(
            available=True,
            subdomain=subdomain,
            message=f"'{subdomain}' is available!",
            suggestions=None
        )
    else:
        suggestions = generate_subdomain_suggestions(subdomain, db)
        return SubdomainCheckResponse(
            available=False,
            subdomain=subdomain,
            message=f"'{subdomain}' is already taken",
            suggestions=suggestions if suggestions else None
        )


@router.get("/health")
async def tenants_health():
    """Health check endpoint for tenant service"""
    return {
        "status": "healthy",
        "service": "tenant-management",
        "signup_enabled": True
    }
