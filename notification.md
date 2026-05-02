# Push & In-App Notification System — Implementation Guide

> **Purpose**: Complete reference for the notification system implemented in the single-tenant KEC Routine Scheduler. Use this document to replicate the feature into the multi-tenant SaaS version.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [Database Schema](#3-database-schema)
4. [Backend Implementation](#4-backend-implementation)
   - 4.1 [Configuration (VAPID Keys)](#41-configuration-vapid-keys)
   - 4.2 [SQLAlchemy Models](#42-sqlalchemy-models)
   - 4.3 [Notification Service](#43-notification-service)
   - 4.4 [API Routes](#44-api-routes)
   - 4.5 [Notification Triggers in Other Routes](#45-notification-triggers-in-other-routes)
   - 4.6 [Route Registration](#46-route-registration)
5. [Frontend Implementation](#5-frontend-implementation)
   - 5.1 [Notification Service (JS)](#51-notification-service-js)
   - 5.2 [Service Worker (sw-push.js)](#52-service-worker-sw-pushjs)
   - 5.3 [NotificationBell Component](#53-notificationbell-component)
   - 5.4 [BroadcastNotice Admin Page](#54-broadcastnotice-admin-page)
   - 5.5 [Vite PWA Configuration](#55-vite-pwa-configuration)
   - 5.6 [Layout Integration](#56-layout-integration)
   - 5.7 [App Routing](#57-app-routing)
   - 5.8 [Vite Dev Proxy](#58-vite-dev-proxy)
6. [Setup & Migration Scripts](#6-setup--migration-scripts)
7. [API Endpoints Reference](#7-api-endpoints-reference)
8. [Notification Flow Diagrams](#8-notification-flow-diagrams)
9. [Multi-Tenant Migration Notes](#9-multi-tenant-migration-notes)
10. [Environment Variables](#10-environment-variables)
11. [Dependencies](#11-dependencies)

---

## 1. Architecture Overview

The system uses a **dual notification strategy**:

| Channel | Transport | Works On | Use Case |
|---------|-----------|----------|----------|
| **In-App Notifications** | HTTP polling (20s) | HTTP & HTTPS | Primary — always works |
| **Web Push Notifications** | Web Push API + VAPID | HTTPS / localhost only | Desktop push — best effort |

**Key Design Decisions:**
- Every notification is **always** stored in the `in_app_notifications` database table (guaranteed delivery via polling).
- Web Push is sent **best-effort** — if it fails, users still see the notification in the bell icon.
- Push delivery runs in a **FastAPI BackgroundTask** so it doesn't block the HTTP response.
- Stale push subscriptions (HTTP 410 from push service) are **automatically cleaned up**.

```
┌──────────────────────────────────────────────────────────────────┐
│                     ADMIN / SYSTEM ACTION                       │
│  - Save/Update/Delete Class Routine                             │
│  - Create/Update/Delete Calendar Event                          │
│  - Send Custom Broadcast Notice                                 │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
          ┌──────────────────────────────┐
          │  Backend Route Handler       │
          │  background_tasks.add_task(  │
          │    send_push_to_all, ...     │
          │  )                           │
          └─────────────┬────────────────┘
                        │  (runs async after response)
           ┌────────────┴────────────┐
           │                         │
           ▼                         ▼
┌────────────────────┐   ┌──────────────────────────┐
│  Store In-App      │   │  Send Web Push           │
│  Notification      │   │  (pywebpush + VAPID)     │
│  in DB             │   │                          │
│                    │   │  For each subscription:  │
│  in_app_           │   │  - Build payload (JSON)  │
│  notifications     │   │  - Sign with VAPID key   │
│  table             │   │  - POST to push service  │
│                    │   │  - Clean stale (410)      │
└────────────────────┘   └──────────┬───────────────┘
           │                        │
           ▼                        ▼
┌────────────────────┐   ┌──────────────────────────┐
│  Frontend Polling  │   │  Browser Service Worker  │
│  (20s interval)    │   │  (sw-push.js)            │
│                    │   │                          │
│  NotificationBell  │   │  push event →            │
│  GET /in-app       │   │  showNotification()      │
│  → Badge + Toast   │   │                          │
│                    │   │  notificationclick →      │
│                    │   │  navigate to URL          │
└────────────────────┘   └──────────────────────────┘
```

---

## 2. Technology Stack

### Backend
| Package | Version | Purpose |
|---------|---------|---------|
| `pywebpush` | 2.0.1 | Send Web Push notifications signed with VAPID |
| `cryptography` | (transitive) | Generate VAPID ECDSA key pairs |
| `FastAPI` | — | BackgroundTasks for async push delivery |
| `SQLAlchemy` | — | ORM for push_subscriptions & in_app_notifications |

### Frontend
| Package | Version | Purpose |
|---------|---------|---------|
| `vite-plugin-pwa` | ^1.2.0 | PWA support + service worker generation |
| `workbox-precaching` | ^7.4.0 | Service worker precaching |
| `axios` | — | HTTP client for notification API calls |
| `@mui/material` | — | NotificationBell UI components |

---

## 3. Database Schema

### Table: `push_subscriptions`

Stores Web Push API subscriptions per device/browser.

```sql
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,  -- nullable
    endpoint    TEXT    NOT NULL UNIQUE,       -- Push service URL (unique per device)
    p256dh      TEXT    NOT NULL,              -- ECDH public key for payload encryption
    auth        VARCHAR(255) NOT NULL,         -- Auth secret for push service
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_push_subscriptions_endpoint
    ON push_subscriptions (endpoint);
```

### Table: `in_app_notifications`

Stores all notifications for HTTP-based polling. Broadcast to all users (not per-user in this single-tenant design).

```sql
CREATE TABLE IF NOT EXISTS in_app_notifications (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,        -- Notification headline
    body        TEXT,                          -- Optional detail text
    url         VARCHAR(500),                 -- Deep link (e.g. /dashboard/calendar)
    tag         VARCHAR(100),                 -- Category: routine-change, calendar-event, notice
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_in_app_notifications_created_at
    ON in_app_notifications (created_at);
```

---

## 4. Backend Implementation

### 4.1 Configuration (VAPID Keys)

**File: `backend/app/core/config_saas.py`** — Add these fields to Settings:

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # ... existing settings ...

    # Web Push (VAPID)
    VAPID_PUBLIC_KEY: str = ""
    VAPID_PRIVATE_KEY: str = ""
    VAPID_CLAIM_EMAIL: str = "mailto:admin@kec.edu.np"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

**Generate VAPID Keys** — Run once, paste output into `.env`:

```python
# File: backend/scripts/generate_vapid_keys.py

from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
import base64


def main():
    private_key = ec.generate_private_key(ec.SECP256R1())

    raw_pub = private_key.public_key().public_bytes(
        Encoding.X962, PublicFormat.UncompressedPoint
    )
    pub_b64 = base64.urlsafe_b64encode(raw_pub).rstrip(b"=").decode()

    raw_priv = private_key.private_numbers().private_value.to_bytes(32, "big")
    priv_b64 = base64.urlsafe_b64encode(raw_priv).rstrip(b"=").decode()

    print("=" * 60)
    print("VAPID Keys Generated — add these to your .env file:")
    print("=" * 60)
    print()
    print(f"VAPID_PUBLIC_KEY={pub_b64}")
    print(f"VAPID_PRIVATE_KEY={priv_b64}")
    print()
    print("=" * 60)


if __name__ == "__main__":
    main()
```

### 4.2 SQLAlchemy Models

**File: `backend/app/models/models.py`** — Add these two models:

```python
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

class PushSubscription(Base):
    """Web Push API subscriptions for push notifications"""
    __tablename__ = "push_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    endpoint = Column(Text, unique=True, nullable=False, index=True)
    p256dh = Column(Text, nullable=False)
    auth = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User")


class InAppNotification(Base):
    """In-app notifications — works over HTTP without Push API"""
    __tablename__ = "in_app_notifications"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    body = Column(Text)
    url = Column(String(500))
    tag = Column(String(100))
    created_at = Column(DateTime, server_default=func.now(), index=True)
```

### 4.3 Notification Service

**File: `backend/app/services/notification_service.py`**

This is the core logic. Two responsibilities:
1. Store every notification in `in_app_notifications` (HTTP-based, always works)
2. Send Web Push to all subscribed browsers (best-effort, HTTPS only)

```python
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
                # HTTP 410 = subscription expired/unsubscribed → remove it
                if hasattr(e, "response") and e.response is not None and e.response.status_code == 410:
                    stale_ids.append(sub.id)
                    logger.info("Removing stale push subscription %s", sub.id)
                else:
                    logger.error("Push failed for subscription %s: %s", sub.id, e)
            except Exception as e:
                logger.error("Unexpected push error for subscription %s: %s", sub.id, e)

        # Clean up stale subscriptions in one batch
        if stale_ids:
            db.query(PushSubscription).filter(PushSubscription.id.in_(stale_ids)).delete(
                synchronize_session=False
            )
            db.commit()
    except Exception as e:
        logger.error("send_push_to_all failed: %s", e)
    finally:
        db.close()
```

**Key Details:**
- `send_push_to_all()` creates its **own DB session** (`SessionLocal()`) because it runs in a FastAPI `BackgroundTask` (separate thread/context from the request session).
- Stale subscriptions (HTTP 410 from push services like FCM/Mozilla) are removed automatically.
- The function is designed to **never raise** — all errors are logged and swallowed to avoid crashing the background worker.

### 4.4 API Routes

**File: `backend/app/api/routes/notifications.py`**

```python
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


# ---------- Schemas (inline — no separate schema file needed) ----------

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


class BroadcastRequest(BaseModel):
    title: str
    body: Optional[str] = ""


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


# ---------- In-app notification endpoints ----------

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
```

### 4.5 Notification Triggers in Other Routes

Notifications are triggered from existing routes using `BackgroundTasks`. The pattern is:

```python
from app.services.notification_service import send_push_to_all

@router.post("/some-action/")
def some_action(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_write_access),
):
    # ... do the actual work ...

    # Fire-and-forget notification
    background_tasks.add_task(
        send_push_to_all,
        title="Action Title",
        body="Description of what happened",
        url="/dashboard/relevant-page",
        tag="category-tag",
    )
    return {"message": "Done"}
```

#### Triggers in `backend/app/api/routes/class_routines.py`:

| Action | Title | Body | URL | Tag |
|--------|-------|------|-----|-----|
| Save routine | `"Routine Updated"` | `"Class routine updated for {class_name}"` | `/dashboard/class-routine` | `routine-change` |
| Delete routine | `"Routine Deleted"` | `"Class routine deleted for {class_name}"` | `/dashboard/class-routine` | `routine-change` |
| Generate routine | `"Routines Generated"` | `"Routines auto-generated for {n} class(es)"` | `/dashboard/class-routine` | `routine-change` |

#### Triggers in `backend/app/api/routes/calendar.py`:

| Action | Title | Body | URL | Tag |
|--------|-------|------|-----|-----|
| Create event | `"New Calendar Event"` | `"{title} — {start_date}"` | `/dashboard/calendar` | `calendar-event` |
| Update event | `"Calendar Event Updated"` | `"{title} has been updated"` | `/dashboard/calendar` | `calendar-event` |
| Delete event | `"Calendar Event Cancelled"` | `"{title} has been removed"` | `/dashboard/calendar` | `calendar-event` |

#### Triggers in `backend/app/api/routes/notifications.py`:

| Action | Title | Body | URL | Tag |
|--------|-------|------|-----|-----|
| Broadcast | User-provided | User-provided | `/dashboard` | `notice` |

### 4.6 Route Registration

**File: `backend/app/main_saas.py`** — Register the notifications router:

```python
from app.api.routes import (
    # ... other route modules ...,
    notifications
)

# Register with no extra prefix (routes already have /notifications prefix)
app.include_router(notifications.router, prefix="")
```

---

## 5. Frontend Implementation

### 5.1 Notification Service (JS)

**File: `frontend/src/services/notificationService.js`**

Provides helper functions for both push subscriptions and in-app notification polling.

```javascript
import api from './api'

/**
 * Convert a base64url-encoded VAPID public key to a Uint8Array
 * required by PushManager.subscribe().
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// ─── Push API helpers (only work on localhost / HTTPS) ───

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export async function getExistingSubscription() {
  if (!('serviceWorker' in navigator)) return null
  const registration = await navigator.serviceWorker.getRegistration()
  if (!registration) return null
  return registration.pushManager.getSubscription()
}

export async function isSubscribed() {
  if (!isPushSupported()) return false
  try {
    const sub = await getExistingSubscription()
    return !!sub
  } catch {
    return false
  }
}

export async function subscribeToPush() {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported on this connection (requires HTTPS)')
  }

  // 1. Request browser permission
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Notification permission denied. Please allow notifications in your browser settings.')
  }

  // 2. Fetch VAPID public key from backend
  const { data } = await api.get('/notifications/vapid-public-key')
  const applicationServerKey = urlBase64ToUint8Array(data.publicKey)

  // 3. Get or register service worker
  let registration
  try {
    registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Service worker not ready. Try refreshing the page.')), 5000)
      ),
    ])
  } catch {
    registration = await navigator.serviceWorker.register('/sw-push.js')
    await new Promise(resolve => setTimeout(resolve, 1000))
    registration = await navigator.serviceWorker.ready
  }

  // 4. Subscribe to push via PushManager
  let subscription
  try {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    })
  } catch (pushErr) {
    if (pushErr.name === 'NotAllowedError') {
      throw new Error('Push permission denied. Please allow notifications and try again.')
    }
    throw new Error('Push registration failed: ' + (pushErr.message || pushErr.name))
  }

  // 5. Send subscription to backend
  const subJson = subscription.toJSON()
  await api.post('/notifications/subscribe', {
    endpoint: subJson.endpoint,
    keys: subJson.keys,
  })

  return subscription
}

export async function unsubscribeFromPush() {
  const subscription = await getExistingSubscription()
  if (!subscription) return

  // Remove from backend first
  await api.delete('/notifications/unsubscribe', {
    data: { endpoint: subscription.endpoint },
  })

  // Then unsubscribe locally
  await subscription.unsubscribe()
}

// ─── In-app notifications (work over HTTP on any network) ───

export async function fetchInAppNotifications(since = null, limit = 30) {
  const params = { limit }
  if (since) params.since = since
  const { data } = await api.get('/notifications/in-app', { params })
  return data
}
```

### 5.2 Service Worker (sw-push.js)

**File: `frontend/public/sw-push.js`**

Placed in `public/` so it's served at the root URL (`/sw-push.js`). In production, it's imported into the Workbox-generated SW via `importScripts`. In dev mode, it registers directly.

```javascript
// Activate immediately — don't wait for old SW to die
self.addEventListener('install', (event) => {
  console.log('[sw-push] Installing...')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('[sw-push] Activated')
  event.waitUntil(self.clients.claim())
})

// Handle incoming push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch (e) {
    data = { title: 'KEC Routine Scheduler', body: event.data.text() }
  }

  const title = data.title || 'KEC Routine Scheduler'
  const options = {
    body: data.body || '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: data.tag || 'general',     // Groups notifications of same tag
    renotify: true,                 // Re-alert even if same tag exists
    data: {
      url: data.url || '/dashboard',
    },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// Handle notification click — open or focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // If the app is already open, focus it and navigate
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin)) {
            client.navigate(targetUrl)
            return client.focus()
          }
        }
        // Otherwise open a new window
        return clients.openWindow(targetUrl)
      })
  )
})
```

### 5.3 NotificationBell Component

**File: `frontend/src/components/NotificationBell.jsx`**

A bell icon in the AppBar that:
- Polls `/notifications/in-app` every 20 seconds
- Shows unread count badge
- Shows toast on new notifications
- Has a toggle switch to enable/disable desktop push
- Tracks "last read" timestamp in `localStorage`

```javascript
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  IconButton, Badge, Popover, List, ListItem, ListItemText,
  Typography, Box, Divider, Tooltip, Snackbar, Alert, Switch, FormControlLabel,
} from '@mui/material'
import {
  Notifications as NotificationsIcon,
  NotificationsNone as NotificationsNoneIcon,
  Circle as CircleIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import {
  fetchInAppNotifications, isPushSupported,
  isSubscribed as checkPushSubscribed,
  subscribeToPush, unsubscribeFromPush,
} from '../services/notificationService'
import api from '../services/api'

const POLL_INTERVAL = 20_000  // 20 seconds
const LAST_READ_KEY = 'kec_notif_last_read'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [anchorEl, setAnchorEl] = useState(null)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const [newToast, setNewToast] = useState(null)
  const lastReadRef = useRef(localStorage.getItem(LAST_READ_KEY) || new Date(0).toISOString())
  const prevCountRef = useRef(0)
  const open = Boolean(anchorEl)

  // Fetch notifications from backend
  const loadNotifications = useCallback(async () => {
    try {
      const data = await fetchInAppNotifications(null, 30)
      setNotifications(data)

      // Count unread (notifications newer than last-read timestamp)
      const lastRead = lastReadRef.current
      const unread = data.filter((n) => n.created_at > lastRead).length
      setUnreadCount(unread)

      // Show toast if new notifications arrived since last poll
      if (unread > prevCountRef.current && prevCountRef.current >= 0 && data.length > 0) {
        const newest = data[0]
        setNewToast({ title: newest.title, body: newest.body })
      }
      prevCountRef.current = unread
    } catch {
      // Silently fail — user might not be authenticated yet
    }
  }, [])

  // Poll every 20 seconds
  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [loadNotifications])

  // Check initial push subscription status
  useEffect(() => {
    if (isPushSupported()) {
      checkPushSubscribed().then(setPushEnabled).catch(() => {})
    }
  }, [])

  // Mark all as read when panel opens
  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget)
    const now = new Date().toISOString()
    lastReadRef.current = now
    localStorage.setItem(LAST_READ_KEY, now)
    setUnreadCount(0)
    prevCountRef.current = 0
  }

  const handleClose = () => setAnchorEl(null)

  // Toggle desktop push on/off
  const handleTogglePush = async () => {
    if (pushLoading) return
    setPushLoading(true)
    try {
      if (pushEnabled) {
        await unsubscribeFromPush()
        setPushEnabled(false)
        setSnackbar({ open: true, message: 'Desktop push notifications disabled', severity: 'info' })
      } else {
        await subscribeToPush()
        setPushEnabled(true)
        setSnackbar({ open: true, message: 'Desktop push notifications enabled!', severity: 'success' })
      }
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || 'Failed to toggle push notifications'
      setSnackbar({ open: true, message: msg, severity: 'error' })
    } finally {
      setPushLoading(false)
    }
  }

  // ... renders bell icon with Badge, Popover with notification list,
  //     each item has delete button, and shows push toggle switch in header
}
```

**Unread Tracking Logic:**
- `lastReadRef` stores the ISO timestamp of when the user last opened the notification panel
- Persisted in `localStorage` under key `kec_notif_last_read`
- Any notification with `created_at > lastRead` is considered unread
- Opening the panel sets `lastRead = now` and resets the badge

### 5.4 BroadcastNotice Admin Page

**File: `frontend/src/pages/BroadcastNotice.jsx`**

Admin-only page to send custom broadcast notices. Provides a form (title + optional body) and shows recent notice history.

```javascript
// Route: /dashboard/broadcast (admin-only)
// Calls: POST /notifications/broadcast { title, body }
// Also loads: GET /notifications/in-app?limit=50 for history

export default function BroadcastNotice() {
  // Form state: title, body
  // Sends POST /notifications/broadcast
  // Shows history by fetching GET /notifications/in-app
  // Each history item shows title, body, tag chip, and relative time
}
```

### 5.5 Vite PWA Configuration

**File: `frontend/vite.config.js`** — Key notification-related config:

```javascript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      manifest: {
        name: 'KEC Routine Scheduler',
        short_name: 'Routine',
        // ... icons, theme_color, etc.
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg,woff2}'],
        importScripts: ['/sw-push.js'],  // ← CRITICAL: imports custom push handlers
        runtimeCaching: [
          // ... font caching ...
          {
            urlPattern: /\/(api|notifications)\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
    }),
  ],
})
```

**Important:** The `importScripts: ['/sw-push.js']` line is what makes the Workbox-generated service worker import the custom push event handlers.

### 5.6 Layout Integration

**File: `frontend/src/components/Layout.jsx`**

The `NotificationBell` is rendered in the top-right of the AppBar, visible to all authenticated users:

```jsx
import NotificationBell from './NotificationBell'

// Inside the AppBar Toolbar:
{isAuthenticated && (
  <>
    <NotificationBell />
    {/* ... other toolbar items ... */}
  </>
)}
```

### 5.7 App Routing

**File: `frontend/src/App.jsx`**

```jsx
const BroadcastNotice = lazy(() => import('./pages/BroadcastNotice'))

// Inside Routes, under the dashboard layout:
<Route path="broadcast" element={
  <ProtectedRoute roles={['admin']}>
    <BroadcastNotice />
  </ProtectedRoute>
} />
```

The broadcast page is only accessible to admin users at `/dashboard/broadcast`.

### 5.8 Vite Dev Proxy

**File: `frontend/vite.config.js`** — Proxy notification API calls in development:

```javascript
server: {
  proxy: {
    '/notifications': {
      target: 'http://127.0.0.1:8000',
      changeOrigin: true,
    },
    // ... other API proxies ...
  },
}
```

---

## 6. Setup & Migration Scripts

### Create In-App Notifications Table

**File: `backend/scripts/create_notification_tables.py`**

```bash
cd backend
python -m scripts.create_notification_tables
```

```python
"""Create in_app_notifications table."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database_saas import engine
from sqlalchemy import text

def main():
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS in_app_notifications (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                body TEXT,
                url VARCHAR(500),
                tag VARCHAR(100),
                created_at TIMESTAMP DEFAULT NOW()
            )
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_in_app_notifications_created_at
            ON in_app_notifications (created_at)
        """))
        conn.commit()
        print("in_app_notifications table created successfully")

if __name__ == "__main__":
    main()
```

### Create Push Subscriptions Table

**File: `backend/scripts/create_push_subscriptions_table.py`**

```bash
cd backend
python -m scripts.create_push_subscriptions_table
```

```python
from app.core.database import engine, Base
from app.models.models import PushSubscription

def create_push_subscriptions_table():
    print("Creating push_subscriptions table...")
    PushSubscription.__table__.create(bind=engine, checkfirst=True)
    print("push_subscriptions table created successfully!")

if __name__ == "__main__":
    create_push_subscriptions_table()
```

### Generate VAPID Keys

```bash
cd backend
python scripts/generate_vapid_keys.py
```

Copy the output into your `.env` file.

---

## 7. API Endpoints Reference

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| `GET` | `/notifications/vapid-public-key` | Read | Returns VAPID public key for push subscription |
| `POST` | `/notifications/subscribe` | Read | Registers a browser push subscription |
| `DELETE` | `/notifications/unsubscribe` | Read | Removes a browser push subscription |
| `POST` | `/notifications/broadcast` | Write (Admin) | Sends a custom notice to all users |
| `GET` | `/notifications/in-app` | Read | Lists in-app notifications (supports `?since=ISO&limit=N`) |
| `DELETE` | `/notifications/in-app/{id}` | Read | Deletes a single in-app notification |

### Request/Response Examples

#### Subscribe to Push
```http
POST /notifications/subscribe
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "BNcR...",
    "auth": "tBH..."
  }
}

→ 200 {"message": "Subscribed successfully"}
```

#### Send Broadcast
```http
POST /notifications/broadcast
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "title": "Class Cancelled Tomorrow",
  "body": "All Thursday classes are cancelled due to exam preparation."
}

→ 200 {"message": "Notice sent"}
```

#### Poll In-App Notifications
```http
GET /notifications/in-app?limit=30&since=2025-05-01T10:00:00
Authorization: Bearer <jwt>

→ 200 [
  {
    "id": 42,
    "title": "Routine Updated",
    "body": "Class routine updated for BEI 7th Sem",
    "url": "/dashboard/class-routine",
    "tag": "routine-change",
    "created_at": "2025-05-01T12:30:00"
  }
]
```

---

## 8. Notification Flow Diagrams

### Flow 1: Admin Saves a Routine (automatic notification)

```
Admin clicks "Save Routine"
    │
    ▼
POST /class-routines/save/
    │
    ├── Save routine entries to DB
    │
    ├── background_tasks.add_task(send_push_to_all, ...)
    │
    └── Return 200 immediately
         │
         ▼  (background)
    send_push_to_all()
         │
         ├── INSERT into in_app_notifications
         │
         └── For each push_subscription:
              └── webpush(subscription, payload, vapid_key)
                   │
                   ├── Success → logged
                   ├── 410 Gone → subscription deleted
                   └── Other error → logged, continue
```

### Flow 2: User Enables Push Notifications

```
User toggles "Push" switch in NotificationBell
    │
    ▼
subscribeToPush()
    │
    ├── Notification.requestPermission() → "granted"
    │
    ├── GET /notifications/vapid-public-key → { publicKey }
    │
    ├── navigator.serviceWorker.ready
    │
    ├── pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })
    │       → returns PushSubscription { endpoint, keys: { p256dh, auth } }
    │
    └── POST /notifications/subscribe { endpoint, keys }
         │
         └── Backend upserts into push_subscriptions table
```

### Flow 3: Push Notification Delivery

```
Backend sends webpush()
    │
    ▼
Push Service (FCM / Mozilla Push)
    │
    ▼
Browser Service Worker (sw-push.js)
    │
    ├── 'push' event fires
    │   └── self.registration.showNotification(title, options)
    │
    └── User clicks notification
        └── 'notificationclick' event
            └── client.navigate(targetUrl) or clients.openWindow(targetUrl)
```

### Flow 4: In-App Notification Polling

```
NotificationBell component mounts
    │
    ├── loadNotifications() immediately
    │   └── GET /notifications/in-app?limit=30
    │       └── Compare each notification.created_at > lastRead
    │           └── Count unread → Badge number
    │
    └── setInterval(loadNotifications, 20_000)
         │
         └── On each poll:
              ├── Update notification list
              ├── If new unread > previous unread count
              │   └── Show toast with newest notification
              └── Update badge count
```

---

## 9. Multi-Tenant Migration Notes

When porting to the multi-tenant SaaS version, these are the key changes needed:

### 9.1 Database Tables — Per-Tenant Schema

Both tables must be created in **each tenant's schema**, not the public schema:

```sql
-- Run in tenant schema context:
SET search_path TO tenant_<slug>;

CREATE TABLE IF NOT EXISTS push_subscriptions ( ... );
CREATE TABLE IF NOT EXISTS in_app_notifications ( ... );
```

Add these to the tenant schema template (`init-scripts/02-tenant-schema-template.sql`).

### 9.2 Notification Service — Tenant-Aware Sessions

`send_push_to_all()` currently creates its own `SessionLocal()`. In multi-tenant, it needs to:

1. Accept a `tenant_id` or `schema_name` parameter
2. Create a session bound to the correct tenant schema
3. Only query subscriptions from that tenant's schema

```python
def send_push_to_all(
    tenant_schema: str,  # NEW: tenant schema name
    title: str,
    body: str,
    url: str = "/dashboard",
    tag: str = "general",
):
    db = get_tenant_session(tenant_schema)  # Use tenant-scoped session
    try:
        # ... same logic but operates on tenant schema ...
    finally:
        db.close()
```

### 9.3 Route Handlers — Pass Tenant Context

Each route handler that triggers `send_push_to_all` needs to pass the tenant context:

```python
background_tasks.add_task(
    send_push_to_all,
    tenant_schema=current_tenant.schema_name,  # NEW
    title="Routine Updated",
    body=f"Class routine updated for {class_name}",
    url="/dashboard/class-routine",
    tag="routine-change",
)
```

### 9.4 Push Subscriptions — Per-User Per-Tenant

In multi-tenant, a user might exist in multiple tenants. The `push_subscriptions` table is per-tenant-schema, so the same browser endpoint could be registered in multiple tenant schemas. This is fine — the subscription is per-device-per-tenant.

### 9.5 In-App Notifications — Tenant Isolation

In-app notifications are stored per-tenant-schema, so polling `GET /notifications/in-app` automatically returns only the current tenant's notifications (via schema-scoped DB session).

### 9.6 VAPID Keys — Shared or Per-Tenant

VAPID keys can be **shared across all tenants** (one key pair in environment) or **per-tenant** (stored in tenant config). Shared is simpler and recommended — the VAPID key identifies your server to push services, not individual tenants.

### 9.7 Frontend — No Changes Needed

The frontend notification code doesn't need changes for multi-tenant. The API base URL is already tenant-scoped by the backend middleware/routing.

### 9.8 Migration Script for Existing Tenants

Create a migration script that adds the notification tables to all existing tenant schemas:

```python
def migrate_notifications_to_all_tenants():
    tenants = get_all_tenants()
    for tenant in tenants:
        with tenant_schema_connection(tenant.schema_name) as conn:
            conn.execute(text("CREATE TABLE IF NOT EXISTS push_subscriptions (...)"))
            conn.execute(text("CREATE TABLE IF NOT EXISTS in_app_notifications (...)"))
            conn.commit()
        print(f"Notification tables created for tenant: {tenant.name}")
```

---

## 10. Environment Variables

Add these to your `.env` file:

```env
# ===================================================================
# WEB PUSH NOTIFICATIONS (VAPID)
# ===================================================================
# Generate keys: python scripts/generate_vapid_keys.py
VAPID_PUBLIC_KEY=<your-generated-public-key>
VAPID_PRIVATE_KEY=<your-generated-private-key>
VAPID_CLAIM_EMAIL=mailto:admin@yourdomain.com
```

- `VAPID_PUBLIC_KEY`: Base64url-encoded ECDSA P-256 public key (shared with frontend)
- `VAPID_PRIVATE_KEY`: Base64url-encoded ECDSA P-256 private key (server-side only, never expose)
- `VAPID_CLAIM_EMAIL`: Contact email for push service operators (RFC 8292 requirement)

---

## 11. Dependencies

### Backend (`requirements.txt`)

```
pywebpush==2.0.1
cryptography>=41.0.0   # For VAPID key generation (transitive dep of pywebpush)
```

Install: `pip install pywebpush`

### Frontend (`package.json`)

```json
{
  "devDependencies": {
    "vite-plugin-pwa": "^1.2.0",
    "workbox-precaching": "^7.4.0"
  }
}
```

Install: `npm install -D vite-plugin-pwa workbox-precaching`

> **Note:** No `web-push` npm package is needed on the frontend. The Web Push API is a **browser-native API** — the frontend uses `navigator.serviceWorker` and `PushManager` directly. The `pywebpush` package on the backend handles the server-side push message signing and delivery.

---

## File Summary

| File | Purpose |
|------|---------|
| `backend/app/core/config_saas.py` | VAPID key configuration |
| `backend/app/models/models.py` | PushSubscription & InAppNotification models |
| `backend/app/services/notification_service.py` | Core notification logic (store + push) |
| `backend/app/api/routes/notifications.py` | API endpoints (subscribe, unsubscribe, broadcast, in-app) |
| `backend/app/api/routes/class_routines.py` | Triggers notifications on routine changes |
| `backend/app/api/routes/calendar.py` | Triggers notifications on calendar changes |
| `backend/app/main_saas.py` | Registers notification router |
| `backend/scripts/generate_vapid_keys.py` | One-time VAPID key generation |
| `backend/scripts/create_notification_tables.py` | Creates in_app_notifications table |
| `backend/scripts/create_push_subscriptions_table.py` | Creates push_subscriptions table |
| `frontend/src/services/notificationService.js` | Push subscription + in-app polling helpers |
| `frontend/src/components/NotificationBell.jsx` | Bell icon with badge, popover, push toggle |
| `frontend/src/pages/BroadcastNotice.jsx` | Admin page to send custom notices |
| `frontend/public/sw-push.js` | Service worker push & click handlers |
| `frontend/vite.config.js` | PWA config with importScripts for push SW |
| `frontend/src/components/Layout.jsx` | Renders NotificationBell in AppBar |
| `frontend/src/App.jsx` | Registers /dashboard/broadcast route |
| `.env` | VAPID keys environment variables |
