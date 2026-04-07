"""Authentication endpoints for login and password management"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.core.database_saas import get_db
from app.models.models_saas import User, Tenant
from app.auth.password import verify_password, get_password_hash
from app.auth.jwt import create_access_token
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    """Login request schema"""
    email: EmailStr
    password: str


class UserInfo(BaseModel):
    """User information response schema"""
    id: int
    email: str
    full_name: str
    role: str
    tenant_subdomain: str
    tenant_name: str
    institution_type: Optional[str] = "engineering"


class LoginResponse(BaseModel):
    """Login response schema"""
    access_token: str
    token_type: str
    user: UserInfo


class ChangePasswordRequest(BaseModel):
    """Change password request schema"""
    old_password: str
    new_password: str


@router.post("/login", response_model=LoginResponse)
def login(
    credentials: LoginRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Authenticate user and return JWT token
    
    Args:
        credentials: Email and password
        db: Database session
        
    Returns:
        Access token and user information
        
    Raises:
        HTTPException: If credentials are invalid or user is inactive
    """
    tenant = getattr(request.state, "tenant", None)
    if tenant is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant context required for login. Use tenant subdomain.",
        )

    # Authenticate user only within the current tenant context.
    user = db.query(User).filter(
        User.email == credentials.email,
        User.tenant_id == tenant.id,
    ).first()
    
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Update last login timestamp
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create access token with user information
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "role": user.role,
            "tenant_id": user.tenant_id,
            "tenant_subdomain": tenant.subdomain,
        }
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "tenant_subdomain": tenant.subdomain,
            "tenant_name": tenant.name,
            "institution_type": (tenant.settings or {}).get("institution_type", "engineering")
        }
    }


@router.get("/me", response_model=UserInfo)
def get_current_user_info(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Get current authenticated user information
    
    Args:
        current_user: Current authenticated user from JWT token
        db: Database session
        
    Returns:
        User information
    """
    # Fetch tenant information
    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Tenant not found for user"
        )
    
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "tenant_subdomain": tenant.subdomain,
        "tenant_name": tenant.name,
        "institution_type": (tenant.settings or {}).get("institution_type", "engineering")
    }


@router.post("/change-password")
def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change current user's password
    
    Args:
        request: Old and new passwords
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Success message
        
    Raises:
        HTTPException: If old password is incorrect
    """
    # Verify old password
    if not verify_password(request.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password"
        )
    
    # Update password
    current_user.password_hash = get_password_hash(request.new_password)
    current_user.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Password changed successfully"}
