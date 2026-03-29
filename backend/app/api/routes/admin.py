"""
Admin API Routes for System Administrator
Tenant management, subscription control, and system-wide operations
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text, func, or_
from typing import List, Optional
from datetime import datetime, timedelta
from app.core.database_saas import get_db
from app.models import models_saas
from app.auth.dependencies import get_superadmin
from app.schemas import schemas_admin
from app.services import admin_service

router = APIRouter(prefix="/admin", tags=["system-admin"])


# ============ TENANT MANAGEMENT ============

@router.get("/tenants", response_model=List[schemas_admin.TenantListItem])
def list_tenants(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = Query(None, description="Filter by status: active, trial, suspended, cancelled"),
    plan: Optional[str] = Query(None, description="Filter by plan: trial, basic, standard, premium"),
    search: Optional[str] = Query(None, description="Search by name, subdomain, or email"),
    db: Session = Depends(get_db),
    current_user: models_saas.User = Depends(get_superadmin)
):
    """
    List all tenants with filtering and pagination
    Superadmin only
    """
    return admin_service.get_tenants_list(db, skip, limit, status, plan, search)


@router.get("/tenants/{tenant_id}", response_model=schemas_admin.TenantDetail)
def get_tenant_details(
    tenant_id: int,
    db: Session = Depends(get_db),
    current_user: models_saas.User = Depends(get_superadmin)
):
    """
    Get detailed information about a specific tenant
    Includes usage statistics and subscription status
    """
    tenant = db.query(models_saas.Tenant).filter(
        models_saas.Tenant.id == tenant_id,
        models_saas.Tenant.deleted_at.is_(None)
    ).first()
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Get usage statistics
    stats = admin_service.get_tenant_usage_stats(db, tenant)
    
    # Get subscription info
    subscription = db.query(models_saas.Subscription).filter(
        models_saas.Subscription.tenant_id == tenant_id
    ).order_by(models_saas.Subscription.created_at.desc()).first()
    
    return schemas_admin.TenantDetail(
        id=tenant.id,
        name=tenant.name,
        subdomain=tenant.subdomain,
        schema_name=tenant.schema_name,
        admin_email=tenant.admin_email,
        admin_name=tenant.admin_name,
        phone=tenant.phone,
        address=tenant.address,
        city=tenant.city,
        state=tenant.state,
        country=tenant.country,
        plan=tenant.plan,
        status=tenant.status,
        trial_ends_at=tenant.trial_ends_at,
        max_teachers=tenant.max_teachers,
        max_students=tenant.max_students,
        max_classes=tenant.max_classes,
        settings=tenant.settings or {},
        created_at=tenant.created_at,
        updated_at=tenant.updated_at,
        usage_stats=stats,
        subscription=subscription
    )


@router.put("/tenants/{tenant_id}/status")
def update_tenant_status(
    tenant_id: int,
    status_update: schemas_admin.TenantStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models_saas.User = Depends(get_superadmin)
):
    """
    Activate, suspend, or cancel tenant services
    Records action in audit logs
    """
    tenant = admin_service.update_tenant_status(
        db, tenant_id, status_update.status, status_update.reason, current_user.id
    )
    
    return {
        "success": True,
        "message": f"Tenant status updated to {status_update.status}",
        "tenant": {
            "id": tenant.id,
            "subdomain": tenant.subdomain,
            "status": tenant.status
        }
    }


@router.put("/tenants/{tenant_id}/plan")
def update_tenant_plan(
    tenant_id: int,
    plan_update: schemas_admin.TenantPlanUpdate,
    db: Session = Depends(get_db),
    current_user: models_saas.User = Depends(get_superadmin)
):
    """
    Upgrade or downgrade tenant subscription plan
    Automatically adjusts limits based on plan
    """
    tenant = admin_service.update_tenant_plan(
        db, tenant_id, plan_update.plan, current_user.id
    )
    
    return {
        "success": True,
        "message": f"Tenant plan updated to {plan_update.plan}",
        "tenant": {
            "id": tenant.id,
            "subdomain": tenant.subdomain,
            "plan": tenant.plan,
            "max_teachers": tenant.max_teachers,
            "max_students": tenant.max_students,
            "max_classes": tenant.max_classes
        }
    }


@router.put("/tenants/{tenant_id}/limits")
def update_tenant_limits(
    tenant_id: int,
    limits: schemas_admin.TenantLimitsUpdate,
    db: Session = Depends(get_db),
    current_user: models_saas.User = Depends(get_superadmin)
):
    """
    Manually adjust tenant resource limits
    """
    tenant = db.query(models_saas.Tenant).filter(
        models_saas.Tenant.id == tenant_id,
        models_saas.Tenant.deleted_at.is_(None)
    ).first()
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    if limits.max_teachers is not None:
        tenant.max_teachers = limits.max_teachers
    if limits.max_students is not None:
        tenant.max_students = limits.max_students
    if limits.max_classes is not None:
        tenant.max_classes = limits.max_classes
    
    tenant.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(tenant)
    
    # Log the action
    admin_service.create_audit_log(
        db, tenant.id, current_user.id,
        "tenant_limits_updated",
        f"Updated limits: teachers={limits.max_teachers}, students={limits.max_students}, classes={limits.max_classes}"
    )
    
    return {
        "success": True,
        "message": "Tenant limits updated",
        "limits": {
            "max_teachers": tenant.max_teachers,
            "max_students": tenant.max_students,
            "max_classes": tenant.max_classes
        }
    }


@router.post("/tenants/{tenant_id}/extend-trial")
def extend_trial(
    tenant_id: int,
    extension: schemas_admin.TrialExtension,
    db: Session = Depends(get_db),
    current_user: models_saas.User = Depends(get_superadmin)
):
    """
    Extend trial period for a tenant
    """
    tenant = db.query(models_saas.Tenant).filter(
        models_saas.Tenant.id == tenant_id,
        models_saas.Tenant.deleted_at.is_(None)
    ).first()
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Calculate new trial end date
    if tenant.trial_ends_at and tenant.trial_ends_at > datetime.utcnow():
        # Extend from current trial end
        new_trial_end = tenant.trial_ends_at + timedelta(days=extension.days)
    else:
        # Extend from now
        new_trial_end = datetime.utcnow() + timedelta(days=extension.days)
    
    tenant.trial_ends_at = new_trial_end
    tenant.status = 'trial'
    tenant.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(tenant)
    
    # Log the action
    admin_service.create_audit_log(
        db, tenant.id, current_user.id,
        "trial_extended",
        f"Trial extended by {extension.days} days. New end date: {new_trial_end.strftime('%Y-%m-%d')}"
    )
    
    return {
        "success": True,
        "message": f"Trial extended by {extension.days} days",
        "trial_ends_at": new_trial_end
    }


@router.delete("/tenants/{tenant_id}")
def delete_tenant(
    tenant_id: int,
    permanent: bool = Query(False, description="Permanently delete (cannot be undone)"),
    db: Session = Depends(get_db),
    current_user: models_saas.User = Depends(get_superadmin)
):
    """
    Soft delete or permanently delete a tenant
    WARNING: Permanent deletion removes all data and cannot be undone
    """
    tenant = db.query(models_saas.Tenant).filter(
        models_saas.Tenant.id == tenant_id
    ).first()
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    if permanent:
        # Permanent deletion - drop schema and delete record
        try:
            db.execute(text(f'DROP SCHEMA IF EXISTS "{tenant.schema_name}" CASCADE'))
            db.delete(tenant)
            db.commit()
            
            return {
                "success": True,
                "message": f"Tenant '{tenant.subdomain}' permanently deleted",
                "permanent": True
            }
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to delete tenant: {str(e)}")
    else:
        # Soft delete - mark as deleted but preserve data
        tenant.deleted_at = datetime.utcnow()
        tenant.status = 'cancelled'
        db.commit()
        
        # Log the action
        admin_service.create_audit_log(
            db, tenant.id, current_user.id,
            "tenant_deleted",
            f"Tenant soft deleted by admin"
        )
        
        return {
            "success": True,
            "message": f"Tenant '{tenant.subdomain}' soft deleted (data preserved)",
            "permanent": False
        }


# ============ AUDIT LOGS ============

@router.get("/tenants/{tenant_id}/audit-logs")
def get_tenant_audit_logs(
    tenant_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models_saas.User = Depends(get_superadmin)
):
    """
    Get audit logs for a specific tenant
    """
    logs = db.query(models_saas.AuditLog).filter(
        models_saas.AuditLog.tenant_id == tenant_id
    ).order_by(models_saas.AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": db.query(models_saas.AuditLog).filter(
            models_saas.AuditLog.tenant_id == tenant_id
        ).count(),
        "logs": logs
    }


# ============ SYSTEM ANALYTICS ============

@router.get("/analytics/dashboard")
def get_system_analytics(
    db: Session = Depends(get_db),
    current_user: models_saas.User = Depends(get_superadmin)
):
    """
    Get system-wide analytics for admin dashboard
    """
    return admin_service.get_system_dashboard_stats(db)


@router.get("/analytics/tenant-usage")
def get_all_tenants_usage(
    db: Session = Depends(get_db),
    current_user: models_saas.User = Depends(get_superadmin)
):
    """
    Get resource usage statistics for all tenants
    """
    tenants = db.query(models_saas.Tenant).filter(
        models_saas.Tenant.deleted_at.is_(None)
    ).all()
    
    usage_data = []
    for tenant in tenants:
        stats = admin_service.get_tenant_usage_stats(db, tenant)
        usage_data.append({
            "tenant_id": tenant.id,
            "subdomain": tenant.subdomain,
            "plan": tenant.plan,
            "usage": stats
        })
    
    return usage_data


@router.get("/analytics/revenue")
def get_revenue_analytics(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: models_saas.User = Depends(get_superadmin)
):
    """
    Get revenue analytics by plan and payment gateway
    """
    query = db.query(models_saas.PaymentTransaction).filter(
        models_saas.PaymentTransaction.status == 'completed'
    )
    
    if start_date:
        query = query.filter(models_saas.PaymentTransaction.created_at >= start_date)
    if end_date:
        query = query.filter(models_saas.PaymentTransaction.created_at <= end_date)
    
    transactions = query.all()
    
    # Aggregate by plan and gateway
    total_revenue = sum(float(t.amount) for t in transactions)
    by_gateway = {}
    
    for transaction in transactions:
        gateway = transaction.payment_gateway
        if gateway not in by_gateway:
            by_gateway[gateway] = 0
        by_gateway[gateway] += float(transaction.amount)
    
    return {
        "total_revenue": total_revenue,
        "currency": "NPR",
        "transaction_count": len(transactions),
        "by_gateway": by_gateway,
        "period": {
            "start": start_date,
            "end": end_date
        }
    }
