"""
Admin Service Layer
Business logic for system admin operations
"""
from sqlalchemy.orm import Session
from sqlalchemy import text, func, or_
from typing import Optional, List, Dict, Any
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

TENANT_CORE_TABLES = [
    "departments",
    "programmes",
    "semesters",
    "classes",
    "teachers",
    "subjects",
    "rooms",
    "days",
    "shifts",
    "periods",
    "class_routine_entries",
]


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


def run_tenant_isolation_audit(db: Session) -> Dict[str, Any]:
    """
    Run a system-wide tenant isolation audit.

    The audit is read-only and checks structural risks that can lead to
    cross-tenant data exposure.
    """
    checks: List[Dict[str, Any]] = []

    def add_check(name: str, status: str, message: str, details: Optional[dict] = None):
        checks.append(
            {
                "name": name,
                "status": status,  # pass | warn | fail
                "message": message,
                "details": details or {},
            }
        )

    tenants = db.query(models_saas.Tenant).filter(
        models_saas.Tenant.deleted_at.is_(None)
    ).all()

    add_check(
        "tenant_count",
        "pass" if tenants else "warn",
        f"Found {len(tenants)} active tenant(s)",
    )

    # 1) Registry uniqueness checks
    dup_subdomains = db.execute(
        text(
            """
            SELECT lower(subdomain) AS subdomain, COUNT(*) AS cnt
            FROM public.tenants
            WHERE deleted_at IS NULL
            GROUP BY lower(subdomain)
            HAVING COUNT(*) > 1
            ORDER BY cnt DESC, subdomain
            """
        )
    ).fetchall()
    if dup_subdomains:
        add_check(
            "duplicate_tenant_subdomains",
            "fail",
            "Duplicate active tenant subdomains found",
            {"rows": [dict(r._mapping) for r in dup_subdomains]},
        )
    else:
        add_check("duplicate_tenant_subdomains", "pass", "No duplicate active tenant subdomains")

    dup_schema_names = db.execute(
        text(
            """
            SELECT schema_name, COUNT(*) AS cnt
            FROM public.tenants
            WHERE deleted_at IS NULL
            GROUP BY schema_name
            HAVING COUNT(*) > 1
            ORDER BY cnt DESC, schema_name
            """
        )
    ).fetchall()
    if dup_schema_names:
        add_check(
            "duplicate_tenant_schema_names",
            "fail",
            "Duplicate schema_name values found in active tenants",
            {"rows": [dict(r._mapping) for r in dup_schema_names]},
        )
    else:
        add_check("duplicate_tenant_schema_names", "pass", "No duplicate active tenant schema names")

    # 2) User -> Tenant linkage checks
    orphan_users = db.execute(
        text(
            """
            SELECT COUNT(*) AS cnt
            FROM public.users u
            LEFT JOIN public.tenants t ON t.id = u.tenant_id
            WHERE u.deleted_at IS NULL
              AND t.id IS NULL
            """
        )
    ).scalar() or 0
    if orphan_users > 0:
        add_check(
            "orphan_users",
            "fail",
            f"Found {orphan_users} user(s) referencing missing tenants",
            {"count": orphan_users},
        )
    else:
        add_check("orphan_users", "pass", "No orphan users found")

    duplicate_user_emails = db.execute(
        text(
            """
            SELECT lower(email) AS email, COUNT(DISTINCT tenant_id) AS tenant_count,
                   ARRAY_AGG(DISTINCT tenant_id ORDER BY tenant_id) AS tenant_ids
            FROM public.users
            WHERE deleted_at IS NULL
            GROUP BY lower(email)
            HAVING COUNT(DISTINCT tenant_id) > 1
            ORDER BY tenant_count DESC, email
            """
        )
    ).fetchall()
    if duplicate_user_emails:
        add_check(
            "cross_tenant_duplicate_emails",
            "warn",
            "Some emails exist in multiple tenants; ensure login remains tenant-scoped",
            {"rows": [dict(r._mapping) for r in duplicate_user_emails[:100]]},
        )
    else:
        add_check("cross_tenant_duplicate_emails", "pass", "No duplicate user emails across tenants")

    # 3) Per-tenant schema/table integrity
    missing_schemas: List[str] = []
    tenants_with_missing_tables: List[Dict[str, Any]] = []

    for tenant in tenants:
        schema_exists = db.execute(
            text(
                """
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.schemata
                    WHERE schema_name = :schema_name
                )
                """
            ),
            {"schema_name": tenant.schema_name},
        ).scalar()

        if not schema_exists:
            missing_schemas.append(tenant.schema_name)
            continue

        missing_tables: List[str] = []
        for table_name in TENANT_CORE_TABLES:
            table_exists = db.execute(
                text(
                    """
                    SELECT EXISTS (
                        SELECT 1
                        FROM information_schema.tables
                        WHERE table_schema = :schema_name
                          AND table_name = :table_name
                    )
                    """
                ),
                {"schema_name": tenant.schema_name, "table_name": table_name},
            ).scalar()
            if not table_exists:
                missing_tables.append(table_name)

        if missing_tables:
            tenants_with_missing_tables.append(
                {
                    "tenant_id": tenant.id,
                    "subdomain": tenant.subdomain,
                    "schema_name": tenant.schema_name,
                    "missing_tables": missing_tables,
                }
            )

    if missing_schemas:
        add_check(
            "missing_tenant_schemas",
            "fail",
            "Some active tenants reference missing schemas",
            {"schema_names": missing_schemas},
        )
    else:
        add_check("missing_tenant_schemas", "pass", "All active tenant schemas exist")

    if tenants_with_missing_tables:
        add_check(
            "missing_core_tables",
            "fail",
            "Some tenant schemas are missing required core tables",
            {"tenants": tenants_with_missing_tables},
        )
    else:
        add_check("missing_core_tables", "pass", "All tenant schemas contain required core tables")

    # 4) Public schema contamination check (tenant business tables should be empty)
    contaminated_public_tables: List[Dict[str, Any]] = []
    for table_name in TENANT_CORE_TABLES:
        table_exists = db.execute(
            text(
                """
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = :table_name
                )
                """
            ),
            {"table_name": table_name},
        ).scalar()

        if not table_exists:
            continue

        # table_name is from a fixed allowlist in code, not user input.
        row_count = db.execute(text(f'SELECT COUNT(*) FROM public."{table_name}"')).scalar() or 0
        if row_count > 0:
            contaminated_public_tables.append({"table": table_name, "rows": int(row_count)})

    if contaminated_public_tables:
        add_check(
            "public_schema_contamination",
            "warn",
            "Public schema contains tenant-style business data tables with rows",
            {"tables": contaminated_public_tables},
        )
    else:
        add_check("public_schema_contamination", "pass", "No tenant business data found in public schema")

    pass_count = sum(1 for c in checks if c["status"] == "pass")
    warn_count = sum(1 for c in checks if c["status"] == "warn")
    fail_count = sum(1 for c in checks if c["status"] == "fail")

    return {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "summary": {
            "passed": pass_count,
            "warnings": warn_count,
            "failed": fail_count,
            "overall": "fail" if fail_count else ("warn" if warn_count else "pass"),
        },
        "checks": checks,
    }
