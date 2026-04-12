"""
Redis caching layer for frequently accessed data.
Caches tenant lookups (per-request) and user lookups (per-request auth).
Falls back to no-cache gracefully if Redis is unavailable.
"""
import json
import logging
from typing import Optional

from app.core.config_saas import settings

logger = logging.getLogger(__name__)

_redis_client = None
_redis_available = None


def _get_redis():
    """Lazy-initialize Redis client. Returns None if unavailable."""
    global _redis_client, _redis_available
    if _redis_available is False:
        return None
    if _redis_client is not None:
        return _redis_client
    try:
        import redis
        _redis_client = redis.Redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=1,
        )
        _redis_client.ping()
        _redis_available = True
        logger.info("Redis cache connected")
        return _redis_client
    except Exception:
        _redis_available = False
        logger.warning("Redis unavailable — caching disabled")
        return None


def cache_get(key: str) -> Optional[str]:
    """Get a value from cache. Returns None on miss or error."""
    r = _get_redis()
    if r is None:
        return None
    try:
        return r.get(key)
    except Exception:
        return None


def cache_set(key: str, value: str, ttl: int = 3600):
    """Set a value in cache with TTL (seconds). Silently ignores errors."""
    r = _get_redis()
    if r is None:
        return
    try:
        r.setex(key, ttl, value)
    except Exception:
        pass


def cache_delete(key: str):
    """Delete a key from cache. Silently ignores errors."""
    r = _get_redis()
    if r is None:
        return
    try:
        r.delete(key)
    except Exception:
        pass


def cache_delete_pattern(pattern: str):
    """Delete all keys matching a pattern. Silently ignores errors."""
    r = _get_redis()
    if r is None:
        return
    try:
        keys = r.keys(pattern)
        if keys:
            r.delete(*keys)
    except Exception:
        pass


# ── Tenant cache helpers ──

def get_cached_tenant(subdomain: str) -> Optional[dict]:
    """Get tenant dict from cache by subdomain."""
    raw = cache_get(f"tenant:{subdomain}")
    if raw:
        try:
            return json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            pass
    return None


def set_cached_tenant(subdomain: str, tenant_dict: dict, ttl: int = 3600):
    """Cache a tenant dict by subdomain (1 hour default)."""
    cache_set(f"tenant:{subdomain}", json.dumps(tenant_dict), ttl)


def invalidate_tenant_cache(subdomain: str):
    """Invalidate cached tenant on update."""
    cache_delete(f"tenant:{subdomain}")


# ── User cache helpers ──

def get_cached_user(user_id: int) -> Optional[dict]:
    """Get user dict from cache by ID."""
    raw = cache_get(f"user:{user_id}")
    if raw:
        try:
            return json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            pass
    return None


def set_cached_user(user_id: int, user_dict: dict, ttl: int = 1800):
    """Cache a user dict by ID (30 min default)."""
    cache_set(f"user:{user_id}", json.dumps(user_dict), ttl)


def invalidate_user_cache(user_id: int):
    """Invalidate cached user on update/logout."""
    cache_delete(f"user:{user_id}")
