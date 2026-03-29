"""
Admin Service Layer
Business logic for system admin operations
"""
from sqlalchemy.orm import Session
from sqlalchemy import text, func, or_
from typing import Optional, List
from datetime import datetime, timedelta
from app.models import models_saas
from app.schemas import schemas_admin


# ============ PLAN CONFIGURATIONS ============

PLAN_LIMITS = {
    'trial': {
        'max_teachers': 10,
        'max_students': 100,
        'max_classes': 5
    },
    'basic': {
        'max_teachers': 50,
        'max_students': 500,
        'max_classes': 20
    },
    'standard': {
        'max_teachers': 150,
        'max_students': 1500,
        'max_classes': 60
    },
    'premium': {
        'max_teachers': 500,
        'max_students': 5000,
        'max_classes': 200
    }
}


def get_tenants_list(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    plan: Optional[str] = None,
    search: Optional[str] = None
) -> List[schemas_admin.TenantListItem]:
    """
    Get list of tenants with filters
    """
    query = db.query(models_saas.Tenant).filter(
        models_saas.Tenant.deleted_at.is_(None)
    )
    
    # Apply filters
    if status:
        query = query.filter(models_saas.Tenant.status == status)
    if plan:
        query = query.filter(models_saas.Tenant.plan == plan)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                models_saas.Tenant.name.ilike(search_pattern),
                models_saas.Tenant.subdomain.ilike(search_pattern),
                models_saas.Tenant.admin_email.ilike(search_pattern)
            )
        )
    
    tenants = query.order_by(models_saas.Tenant.created_at.desc()).offset(skip).limit(limit).all()
    
    # Add user counts
    result = []
    for tenant in tenants:
        user_count = db.query(models_saas.User).filter(
            models_saas.User.tenant_id == tenant.id,
            models_saas.User.deleted_at.is_(None)
        ).count()
        
        tenant_item = schemas_admin.TenantListItem(
            id=tenant.id,
            name=tenant.name,
            subdomain=tenant.subdomain,
            admin_email=tenant.admin_email,
            plan=tenant.plan,
            status=tenant.status,
            trial_ends_at=tenant.trial_ends_at,
            created_at=tenant.created_at,
            user_count=user_count
        )
        result.append(tenant_item)
    
    return result


def get_tenant_usage_stats(db: Session, tenant: models_saas.Tenant) -> schemas_admin.UsageStats:
    """
    Get resource usage statistics for a tenant
    Queries tenant's schema for counts
    """
    try:
        # Set search path to tenant schema
        db.execute(text(f'SET search_path TO "{tenant.schema_name}", public'))
        
        # Count resources in tenant schema
        teachers_count = db.execute(text("SELECT COUNT(*) FROM teachers WHERE deleted_at IS NULL")).scalar() or 0
        classes_count = db.execute(text("SELECT COUNT(*) FROM classes WHERE deleted_at IS NULL")).scalar() or 0
        departments_count = db.execute(text("SELECT COUNT(*) FROM departments WHERE deleted_at IS NULL")).scalar() or 0
        subjects_count = db.execute(text("SELECT COUNT(*) FROM subjects WHERE deleted_at IS NULL")).scalar() or 0
        
        # Reset search path
        db.execute(text('SET search_path TO public'))
        
        # Calculate usage percentages
        teachers_percent = (teachers_count / tenant.max_teachers * 100) if tenant.max_teachers > 0 else 0
        classes_percent = (classes_count / tenant.max_classes * 100) if tenant.max_classes > 0 else 0
        students_percent = 0  # Students table doesn't exist yet in current schema
        
        return schemas_admin.UsageStats(
            teachers_count=teachers_count,
            students_count=0,
            classes_count=classes_count,
            departments_count=departments_count,
            subjects_count=subjects_count,
            teachers_limit=tenant.max_teachers,
            students_limit=tenant.max_students,
            classes_limit=tenant.max_classes,
            teachers_usage_percent=round(teachers_percent, 2),
            students_usage_percent=0.0,
            classes_usage_percent=round(classes_percent, 2)
        )
    except Exception as e:
        # Reset search path on error
        db.execute(text('SET search_path TO public'))
        print(f"Error getting usage stats: {e}")
        return schemas_admin.UsageStats(
            teachers_limit=tenant.max_teachers,
            students_limit=tenant.max_students,
            classes_limit=tenant.max_classes
        )


def update_tenant_status(
    db: Session,
    tenant_id: int,
    new_status: str,
    reason: Optional[str],
    admin_user_id: int
) -> models_saas.Tenant:
    """
    Update tenant status and log the action
    """
    tenant = db.query(models_saas.Tenant).filter(
        models_saas.Tenant.id == tenant_id,
        models_saas.Tenant.deleted_at.is_(None)
    ).first()
    
    if not tenant:
        raise ValueError("Tenant not found")
    
    old_status = tenant.status
    tenant.status = new_status
    tenant.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(tenant)
    
    # Create audit log
    log_details = f"Status changed from '{old_status}' to '{new_status}'"
    if reason:
        log_details += f". Reason: {reason}"
    
    create_audit_log(
        db, tenant_id, admin_user_id,
        "tenant_status_updated",
        log_details
    )
    
    return tenant


def update_tenant_plan(
    db: Session,
    tenant_id: int,
    new_plan: str,
    admin_user_id: int
) -> models_saas.Tenant:
    """
    Update tenant plan and adjust limits accordingly
    """
    tenant = db.query(models_saas.Tenant).filter(
        models_saas.Tenant.id == tenant_id,
        models_saas.Tenant.deleted_at.is_(None)
    ).first()
    
    if not tenant:
        raise ValueError("Tenant not found")
    
    if new_plan not in PLAN_LIMITS:
        raise ValueError(f"Invalid plan: {new_plan}")
    
    old_plan = tenant.plan
    limits = PLAN_LIMITS[new_plan]
    
    tenant.plan = new_plan
    tenant.max_teachers = limits['max_teachers']
    tenant.max_students = limits['max_students']
    tenant.max_classes = limits['max_classes']
    tenant.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(tenant)
    
    # Create audit log
    create_audit_log(
        db, tenant_id, admin_user_id,
        "tenant_plan_updated",
        f"Plan changed from '{old_plan}' to '{new_plan}'. Limits updated."
    )
    
    return tenant


def create_audit_log(
    db: Session,
    tenant_id: int,
    user_id: int,
    action: str,
    details: str
):
    """
    Create an audit log entry
    """
    log = models_saas.AuditLog(
        tenant_id=tenant_id,
        user_id=user_id,
        action=action,
        details=details,
        ip_address=None,
        created_at=datetime.utcnow()
    )
    db.add(log)
    db.commit()


def get_system_dashboard_stats(db: Session) -> dict:
    """
    Get system-wide statistics for admin dashboard
    """
    total_tenants = db.query(models_saas.Tenant).filter(
        models_saas.Tenant.deleted_at.is_(None)
    ).count()
    
    active_tenants = db.query(models_saas.Tenant).filter(
        models_saas.Tenant.status == 'active',
        models_saas.Tenant.deleted_at.is_(None)
    ).count()
    
    trial_tenants = db.query(models_saas.Tenant).filter(
        models_saas.Tenant.status == 'trial',
        models_saas.Tenant.deleted_at.is_(None)
    ).count()
    
    suspended_tenants = db.query(models_saas.Tenant).filter(
        models_saas.Tenant.status == 'suspended',
        models_saas.Tenant.deleted_at.is_(None)
    ).count()
    
    total_users = db.query(models_saas.User).filter(
        models_saas.User.deleted_at.is_(None)
    ).count()
    
    # Tenants by plan
    tenants_by_plan = {}
    for plan in ['trial', 'basic', 'standard', 'premium']:
        count = db.query(models_saas.Tenant).filter(
            models_saas.Tenant.plan == plan,
            models_saas.Tenant.deleted_at.is_(None)
        ).count()
        tenants_by_plan[plan] = count
    
    # Growth this month
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    growth_this_month = db.query(models_saas.Tenant).filter(
        models_saas.Tenant.created_at >= month_start,
        models_saas.Tenant.deleted_at.is_(None)
    ).count()
    
    # Revenue this month
    revenue_this_month = db.query(func.sum(models_saas.PaymentTransaction.amount)).filter(
        models_saas.PaymentTransaction.created_at >= month_start,
        models_saas.PaymentTransaction.status == 'completed'
    ).scalar() or 0.0
    
    return {
        "total_tenants": total_tenants,
        "active_tenants": active_tenants,
        "trial_tenants": trial_tenants,
        "suspended_tenants": suspended_tenants,
        "total_users": total_users,
        "tenants_by_plan": tenants_by_plan,
        "growth_this_month": growth_this_month,
        "revenue_this_month": float(revenue_this_month)
    }
