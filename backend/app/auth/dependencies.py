"""Authentication and authorization dependencies for FastAPI routes"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database_saas import get_db
from app.models import models_saas
from app.auth.jwt import decode_access_token

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> models_saas.User:
    """
    Get the current authenticated user from JWT token
    
    Args:
        credentials: HTTP Bearer token from request header
        db: Database session
        
    Returns:
        User object if authenticated
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(models_saas.User).filter(models_saas.User.id == int(user_id)).first()
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


def get_superadmin(current_user: models_saas.User = Depends(get_current_user)) -> models_saas.User:
    """
    Require superadmin role
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        User object if superadmin
        
    Raises:
        HTTPException: If user is not a superadmin
    """
    if current_user.role != 'super_admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    return current_user


def get_admin_or_above(current_user: models_saas.User = Depends(get_current_user)) -> models_saas.User:
    """
    Require admin or superadmin role
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        User object if admin or superadmin
        
    Raises:
        HTTPException: If user is not admin or superadmin
    """
    if current_user.role not in ['super_admin', 'admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def get_any_authenticated(current_user: models_saas.User = Depends(get_current_user)) -> models_saas.User:
    """
    Require any authenticated user
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        User object
    """
    return current_user
