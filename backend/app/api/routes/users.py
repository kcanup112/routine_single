"""User management endpoints (org admin and superadmin)"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import List, Optional

from app.core.database_saas import get_db
from app.models.models_saas import User
from app.auth.password import get_password_hash
from app.auth.dependencies import get_superadmin, get_admin_or_above

router = APIRouter(prefix="/users", tags=["User Management"])


class UserCreate(BaseModel):
    """Create user request schema"""
    email: EmailStr
    full_name: str
    password: str
    role: str  # 'admin' or 'viewer' (org admin); 'super_admin' allowed only for super_admin
    tenant_id: Optional[int] = None  # Only super_admin can specify; org admin uses own tenant


class UserUpdate(BaseModel):
    """Update user request schema"""
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    """User response schema"""
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    tenant_id: int
    created_at: datetime
    last_login_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


@router.post("/", response_model=UserResponse)
def create_user(
    user_data: UserCreate,
    current_user: User = Depends(get_admin_or_above),
    db: Session = Depends(get_db)
):
    """
    Create a new user.
    - Super admin: can create any role in any tenant
    - Org admin: can only create 'admin' or 'viewer' in own tenant
    """
    # Determine target tenant
    if current_user.role == 'super_admin':
        target_tenant_id = user_data.tenant_id or current_user.tenant_id
        allowed_roles = ['super_admin', 'admin', 'viewer']
    else:
        # Org admin — force own tenant, prevent privilege escalation
        target_tenant_id = current_user.tenant_id
        allowed_roles = ['admin', 'viewer']

    if user_data.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Role must be one of: {', '.join(allowed_roles)}"
        )
    
    # Check if email already exists within the target tenant
    existing_user = db.query(User).filter(
        User.email == user_data.email,
        User.tenant_id == target_tenant_id
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered in this organization"
        )
    
    # Create new user
    new_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        password_hash=get_password_hash(user_data.password),
        role=user_data.role,
        tenant_id=target_tenant_id,
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.get("/", response_model=List[UserResponse])
def list_users(
    current_user: User = Depends(get_admin_or_above),
    db: Session = Depends(get_db)
):
    """
    Get users.
    - Super admin: all users
    - Org admin: only users in own tenant
    """
    query = db.query(User)
    if current_user.role != 'super_admin':
        query = query.filter(User.tenant_id == current_user.tenant_id)
    users = query.order_by(User.created_at.desc()).all()
    return users


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    current_user: User = Depends(get_admin_or_above),
    db: Session = Depends(get_db)
):
    """
    Get user by ID.
    - Org admin: only users in own tenant
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Org admin can only see users in their own tenant
    if current_user.role != 'super_admin' and user.tenant_id != current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: User = Depends(get_admin_or_above),
    db: Session = Depends(get_db)
):
    """
    Update user information.
    - Super admin: any user
    - Org admin: only users in own tenant, cannot set super_admin role
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Tenant scoping for org admin
    if current_user.role != 'super_admin' and user.tenant_id != current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Update fields if provided
    if user_data.full_name is not None:
        user.full_name = user_data.full_name
    
    if user_data.role is not None:
        if current_user.role == 'super_admin':
            allowed_roles = ['super_admin', 'admin', 'viewer']
        else:
            allowed_roles = ['admin', 'viewer']
        
        if user_data.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Role must be one of: {', '.join(allowed_roles)}"
            )
        user.role = user_data.role
    
    if user_data.is_active is not None:
        user.is_active = user_data.is_active
    
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    
    return user


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    current_user: User = Depends(get_admin_or_above),
    db: Session = Depends(get_db)
):
    """
    Delete a user.
    - Super admin: any user
    - Org admin: only users in own tenant
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Tenant scoping
    if current_user.role != 'super_admin' and user.tenant_id != current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Prevent deleting yourself
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}


@router.post("/{user_id}/reset-password")
def reset_user_password(
    user_id: int,
    new_password: str,
    current_user: User = Depends(get_admin_or_above),
    db: Session = Depends(get_db)
):
    """
    Reset a user's password.
    - Super admin: any user
    - Org admin: only users in own tenant
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Tenant scoping
    if current_user.role != 'super_admin' and user.tenant_id != current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    user.password_hash = get_password_hash(new_password)
    user.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Password reset successfully"}
