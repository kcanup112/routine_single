"""
Notification service.
- Stores every notification in the DB (in-app notifications — works over HTTP).
- Also sends Web Push to subscribed browsers (requires HTTPS / localhost).
"""
import json
import logging
from typing import Optional

from sqlalchemy.orm import Session
from pywebpush import webpush, WebPushException

from app.core.config_saas import settings
from app.core.database_saas import SessionLocal
from app.models.models import PushSubscription, InAppNotification

logger = logging.getLogger(__name__)


def _get_vapid_claims():
    return {"sub": settings.VAPID_CLAIM_EMAIL}


def save_subscription(db: Session, user_id: Optional[int], subscription_info: dict):
    """Save or update a push subscription. Upserts by endpoint."""
    endpoint = subscription_info["endpoint"]
    keys = subscription_info.get("keys", {})

    existing = db.query(PushSubscription).filter(
        PushSubscription.endpoint == endpoint
    ).first()

    if existing:
        existing.p256dh = keys["p256dh"]
        existing.auth = keys["auth"]
        existing.user_id = user_id
    else:
        sub = PushSubscription(
            user_id=user_id,
            endpoint=endpoint,
            p256dh=keys["p256dh"],
            auth=keys["auth"],
        )
        db.add(sub)

    db.commit()


def remove_subscription(db: Session, endpoint: str):
    """Delete a push subscription by endpoint."""
    db.query(PushSubscription).filter(
        PushSubscription.endpoint == endpoint
    ).delete()
    db.commit()


def get_in_app_notifications(db: Session, since: Optional[str] = None, limit: int = 30):
    """Return recent in-app notifications, optionally filtered by timestamp."""
    query = db.query(InAppNotification).order_by(InAppNotification.created_at.desc())
    if since:
        from datetime import datetime
        try:
            since_dt = datetime.fromisoformat(since)
            query = query.filter(InAppNotification.created_at > since_dt)
        except ValueError:
            pass
    return query.limit(limit).all()


def send_push_to_all(
    title: str,
    body: str,
    url: str = "/dashboard",
    tag: str = "general",
):
    """
    1. Store an in-app notification (works for all clients, HTTP or HTTPS).
    2. Send a Web Push to every active subscription (HTTPS/localhost only).
    Creates its own DB session so it works safely from BackgroundTasks.
    """
    db = SessionLocal()
    try:
        # ---- Always store in-app notification ----
        notification = InAppNotification(
            title=title, body=body, url=url, tag=tag,
        )
        db.add(notification)
        db.commit()
        logger.info("In-app notification stored: id=%s", notification.id)

        # ---- Web Push (best-effort) ----
        if not settings.VAPID_PRIVATE_KEY:
            return

        subscriptions = db.query(PushSubscription).all()
        if not subscriptions:
            return

        payload = json.dumps({
            "title": title,
            "body": body,
            "url": url,
            "tag": tag,
        })

        stale_ids = []

        for sub in subscriptions:
            subscription_info = {
                "endpoint": sub.endpoint,
                "keys": {
                    "p256dh": sub.p256dh,
                    "auth": sub.auth,
                },
            }
            try:
                webpush(
                    subscription_info=subscription_info,
                    data=payload,
                    vapid_private_key=settings.VAPID_PRIVATE_KEY,
                    vapid_claims=_get_vapid_claims(),
                )
                logger.info("Push sent to subscription %s", sub.id)
            except WebPushException as e:
                if hasattr(e, "response") and e.response is not None and e.response.status_code == 410:
                    stale_ids.append(sub.id)
                    logger.info("Removing stale push subscription %s", sub.id)
                else:
                    logger.error("Push failed for subscription %s: %s", sub.id, e)
            except Exception as e:
                logger.error("Unexpected push error for subscription %s: %s", sub.id, e)

        if stale_ids:
            db.query(PushSubscription).filter(PushSubscription.id.in_(stale_ids)).delete(
                synchronize_session=False
            )
            db.commit()
    except Exception as e:
        logger.error("send_push_to_all failed: %s", e)
    finally:
        db.close()
