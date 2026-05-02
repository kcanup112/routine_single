from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.core.config_saas import settings
from app.core.database_saas import get_db
from app.auth.dependencies import require_read_access, require_write_access
from app.models.models import User
from app.services.notification_service import (
    save_subscription, remove_subscription, get_in_app_notifications,
    send_push_to_all,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])


# ---------- Schemas ----------

class PushSubscriptionRequest(BaseModel):
    endpoint: str
    keys: dict  # {"p256dh": "...", "auth": "..."}


class UnsubscribeRequest(BaseModel):
    endpoint: str


class InAppNotificationOut(BaseModel):
    id: int
    title: str
    body: Optional[str] = None
    url: Optional[str] = None
    tag: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Web Push endpoints ----------

@router.get("/vapid-public-key")
def get_vapid_public_key():
    """Return the VAPID public key so the frontend can subscribe to push."""
    if not settings.VAPID_PUBLIC_KEY:
        raise HTTPException(status_code=503, detail="Push notifications not configured")
    return {"publicKey": settings.VAPID_PUBLIC_KEY}


@router.post("/subscribe")
def subscribe(
    request: PushSubscriptionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_read_access),
):
    """Save a push subscription for the current user's device."""
    subscription_info = {
        "endpoint": request.endpoint,
        "keys": request.keys,
    }
    save_subscription(db, current_user.id, subscription_info)
    return {"message": "Subscribed successfully"}


@router.delete("/unsubscribe")
def unsubscribe(
    request: UnsubscribeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_read_access),
):
    """Remove a push subscription."""
    remove_subscription(db, request.endpoint)
    return {"message": "Unsubscribed successfully"}


# ---------- Broadcast (admin sends custom notice) ----------

class BroadcastRequest(BaseModel):
    title: str
    body: Optional[str] = ""


@router.post("/broadcast")
def broadcast_notice(
    request: BroadcastRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_write_access),
):
    """Admin sends a custom notice to all users."""
    background_tasks.add_task(
        send_push_to_all,
        title=request.title,
        body=request.body or "",
        url="/dashboard",
        tag="notice",
    )
    return {"message": "Notice sent"}


# ---------- In-app notification endpoints (work over HTTP) ----------

@router.get("/in-app", response_model=List[InAppNotificationOut])
def list_in_app_notifications(
    since: Optional[str] = Query(None, description="ISO timestamp — return only newer notifications"),
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_read_access),
):
    """Return recent in-app notifications. Use `since` param for polling."""
    return get_in_app_notifications(db, since=since, limit=limit)


@router.delete("/in-app/{notification_id}")
def delete_in_app_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_read_access),
):
    """Delete a single in-app notification."""
    from app.models.models import InAppNotification
    row = db.query(InAppNotification).filter(InAppNotification.id == notification_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(row)
    db.commit()
    return {"message": "Deleted"}
