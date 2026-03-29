"""User management endpoints (superadmin only)"""
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
    role: str  # 'super_admin', 'admin', or 'user'
    tenant_id: int


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
    last_login_at: Optional[datetime]
    
    class Config:
        from_attributes = True


@router.post("/", response_model=UserResponse)
def create_user(
    user_data: UserCreate,
    current_user: User = Depends(get_superadmin),
    db: Session = Depends(get_db)
):
    """
    Create a new user (superadmin only)
    
    Args:
        user_data: New user information
        current_user: Current superadmin user
        db: Database session
        
    Returns:
        Created user information
        
    Raises:
        HTTPException: If email already exists or invalid role
    """
    # Validate role
    if user_data.role not in ['super_admin', 'admin', 'user']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be 'super_admin', 'admin', or 'user'"
        )
    
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    new_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        password_hash=get_password_hash(user_data.password),
        role=user_data.role,
        tenant_id=user_data.tenant_id,
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
    Get all users (admin and above)
    
    Args:
        current_user: Current admin or superadmin user
        db: Database session
        
    Returns:
        List of all users
    """
    users = db.query(User).order_by(User.created_at.desc()).all()
    return users


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    current_user: User = Depends(get_admin_or_above),
    db: Session = Depends(get_db)
):
    """
    Get user by ID (admin and above)
    
    Args:
        user_id: User ID
        current_user: Current admin or superadmin user
        db: Database session
        
    Returns:
        User information
        
    Raises:
        HTTPException: If user not found
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: User = Depends(get_superadmin),
    db: Session = Depends(get_db)
):
    """
    Update user information (superadmin only)
    
    Args:
        user_id: User ID to update
        user_data: Updated user information
        current_user: Current superadmin user
        db: Database session
        
    Returns:
        Updated user information
        
    Raises:
        HTTPException: If user not found or invalid role
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update fields if provided
    if user_data.full_name is not None:
        user.full_name = user_data.full_name
    
    if user_data.role is not None:
        if user_data.role not in ['super_admin', 'admin', 'user']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role"
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
    current_user: User = Depends(get_superadmin),
    db: Session = Depends(get_db)
):
    """
    Delete a user (superadmin only)
    
    Args:
        user_id: User ID to delete
        current_user: Current superadmin user
        db: Database session
        
    Returns:
        Success message
        
    Raises:
        HTTPException: If user not found or trying to delete self
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
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
    current_user: User = Depends(get_superadmin),
    db: Session = Depends(get_db)
):
    """
    Reset a user's password (superadmin only)
    
    Args:
        user_id: User ID
        new_password: New password
        current_user: Current superadmin user
        db: Database session
        
    Returns:
        Success message
        
    Raises:
        HTTPException: If user not found
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.password_hash = get_password_hash(new_password)
    user.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Password reset successfully"}
