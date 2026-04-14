"""Authentication and authorization dependencies for FastAPI routes"""
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database_saas import get_db
from app.models.models import User
from app.auth.jwt import decode_access_token
from app.core.cache import get_cached_user, set_cached_user

security = HTTPBearer()


def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get the current authenticated user from JWT token."""
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
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Cache user for subsequent requests
    set_cached_user(user.id, {
        "id": user.id,
        "role": user.role,
        "is_active": user.is_active,
    })
    
    return user


def get_admin_or_above(current_user: User = Depends(get_current_user)) -> User:
    """Require admin role."""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def get_any_authenticated(current_user: User = Depends(get_current_user)) -> User:
    """Require any authenticated user."""
    return current_user


def require_write_access(current_user: User = Depends(get_current_user)) -> User:
    """Require write access — admin only. Viewers are blocked."""
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Write access denied. Admin role required."
        )
    return current_user


def require_read_access(current_user: User = Depends(get_current_user)) -> User:
    """Require read access — any authenticated user (admin, viewer)."""
    return current_user
