"""
Pydantic schemas for System Admin API
"""
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any, List
from datetime import datetime


# ============ TENANT SCHEMAS ============

class TenantListItem(BaseModel):
    """Tenant list item for admin panel"""
    id: int
    name: str
    subdomain: str
    admin_email: EmailStr
    plan: str
    status: str
    trial_ends_at: Optional[datetime] = None
    created_at: datetime
    user_count: int = 0
    
    class Config:
        from_attributes = True


class UsageStats(BaseModel):
    """Resource usage statistics"""
    teachers_count: int = 0
    students_count: int = 0
    classes_count: int = 0
    departments_count: int = 0
    subjects_count: int = 0
    teachers_limit: int
    students_limit: int
    classes_limit: int
    teachers_usage_percent: float = 0.0
    students_usage_percent: float = 0.0
    classes_usage_percent: float = 0.0


class TenantDetail(BaseModel):
    """Detailed tenant information"""
    id: int
    name: str
    subdomain: str
    schema_name: str
    admin_email: EmailStr
    admin_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: str
    plan: str
    status: str
    trial_ends_at: Optional[datetime] = None
    max_teachers: int
    max_students: int
    max_classes: int
    settings: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    usage_stats: UsageStats
    subscription: Optional[Any] = None
    
    class Config:
        from_attributes = True


class TenantStatusUpdate(BaseModel):
    """Update tenant status"""
    status: str  # active, suspended, cancelled
    reason: Optional[str] = None


class TenantPlanUpdate(BaseModel):
    """Update tenant plan"""
    plan: str  # trial, basic, standard, premium


class TenantLimitsUpdate(BaseModel):
    """Update tenant resource limits"""
    max_teachers: Optional[int] = None
    max_students: Optional[int] = None
    max_classes: Optional[int] = None


class TrialExtension(BaseModel):
    """Extend trial period"""
    days: int  # Number of days to extend


# ============ ANALYTICS SCHEMAS ============

class SystemDashboardStats(BaseModel):
    """System-wide statistics"""
    total_tenants: int
    active_tenants: int
    trial_tenants: int
    suspended_tenants: int
    total_users: int
    tenants_by_plan: Dict[str, int]
    growth_this_month: int
    revenue_this_month: float
    

class RevenueStats(BaseModel):
    """Revenue analytics"""
    total_revenue: float
    currency: str
    transaction_count: int
    by_gateway: Dict[str, float]
