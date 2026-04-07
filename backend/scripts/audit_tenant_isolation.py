"""
Tenant Isolation Audit Script

Runs read-only multi-tenant isolation checks directly against PostgreSQL.
Exit code:
  0 -> no critical failures
  1 -> one or more critical failures
"""

import json
import os
import sys
from datetime import datetime, timezone

import psycopg2
from psycopg2.extras import RealDictCursor

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


def run_audit(conn):
    checks = []

    def add_check(name, status, message, details=None):
        checks.append(
            {
                "name": name,
                "status": status,
                "message": message,
                "details": details or {},
            }
        )

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """
            SELECT id, subdomain, schema_name
            FROM public.tenants
            WHERE deleted_at IS NULL
            ORDER BY id
            """
        )
        tenants = cur.fetchall()

        add_check(
            "tenant_count",
            "pass" if tenants else "warn",
            f"Found {len(tenants)} active tenant(s)",
        )

        # 1) Registry uniqueness checks
        cur.execute(
            """
            SELECT lower(subdomain) AS subdomain, COUNT(*) AS cnt
            FROM public.tenants
            WHERE deleted_at IS NULL
            GROUP BY lower(subdomain)
            HAVING COUNT(*) > 1
            ORDER BY cnt DESC, subdomain
            """
        )
        dup_subdomains = cur.fetchall()
        if dup_subdomains:
            add_check(
                "duplicate_tenant_subdomains",
                "fail",
                "Duplicate active tenant subdomains found",
                {"rows": dup_subdomains},
            )
        else:
            add_check("duplicate_tenant_subdomains", "pass", "No duplicate active tenant subdomains")

        cur.execute(
            """
            SELECT schema_name, COUNT(*) AS cnt
            FROM public.tenants
            WHERE deleted_at IS NULL
            GROUP BY schema_name
            HAVING COUNT(*) > 1
            ORDER BY cnt DESC, schema_name
            """
        )
        dup_schema_names = cur.fetchall()
        if dup_schema_names:
            add_check(
                "duplicate_tenant_schema_names",
                "fail",
                "Duplicate schema_name values found in active tenants",
                {"rows": dup_schema_names},
            )
        else:
            add_check("duplicate_tenant_schema_names", "pass", "No duplicate active tenant schema names")

        # 2) User -> Tenant linkage checks
        cur.execute(
            """
            SELECT COUNT(*) AS cnt
            FROM public.users u
            LEFT JOIN public.tenants t ON t.id = u.tenant_id
            WHERE u.deleted_at IS NULL
              AND t.id IS NULL
            """
        )
        orphan_users = cur.fetchone()["cnt"] or 0
        if orphan_users > 0:
            add_check(
                "orphan_users",
                "fail",
                f"Found {orphan_users} user(s) referencing missing tenants",
                {"count": orphan_users},
            )
        else:
            add_check("orphan_users", "pass", "No orphan users found")

        cur.execute(
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
        duplicate_user_emails = cur.fetchall()
        if duplicate_user_emails:
            add_check(
                "cross_tenant_duplicate_emails",
                "warn",
                "Some emails exist in multiple tenants; ensure login remains tenant-scoped",
                {"rows": duplicate_user_emails[:100]},
            )
        else:
            add_check("cross_tenant_duplicate_emails", "pass", "No duplicate user emails across tenants")

        # 3) Per-tenant schema/table integrity
        missing_schemas = []
        tenants_with_missing_tables = []

        for tenant in tenants:
            cur.execute(
                """
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.schemata
                    WHERE schema_name = %s
                ) AS exists
                """,
                (tenant["schema_name"],),
            )
            schema_exists = cur.fetchone()["exists"]

            if not schema_exists:
                missing_schemas.append(tenant["schema_name"])
                continue

            missing_tables = []
            for table_name in TENANT_CORE_TABLES:
                cur.execute(
                    """
                    SELECT EXISTS (
                        SELECT 1
                        FROM information_schema.tables
                        WHERE table_schema = %s
                          AND table_name = %s
                    ) AS exists
                    """,
                    (tenant["schema_name"], table_name),
                )
                table_exists = cur.fetchone()["exists"]
                if not table_exists:
                    missing_tables.append(table_name)

            if missing_tables:
                tenants_with_missing_tables.append(
                    {
                        "tenant_id": tenant["id"],
                        "subdomain": tenant["subdomain"],
                        "schema_name": tenant["schema_name"],
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

        # 4) Public schema contamination check
        contaminated_public_tables = []
        for table_name in TENANT_CORE_TABLES:
            cur.execute(
                """
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = %s
                ) AS exists
                """,
                (table_name,),
            )
            table_exists = cur.fetchone()["exists"]
            if not table_exists:
                continue

            cur.execute(f'SELECT COUNT(*) AS cnt FROM public."{table_name}"')
            row_count = cur.fetchone()["cnt"] or 0
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
        "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "summary": {
            "passed": pass_count,
            "warnings": warn_count,
            "failed": fail_count,
            "overall": "fail" if fail_count else ("warn" if warn_count else "pass"),
        },
        "checks": checks,
    }


def main():
    db_url = (
        os.getenv("AUDIT_DATABASE_URL")
        or os.getenv("DATABASE_URL")
        or "postgresql://kec_admin:kec_routine_2024_secure@localhost:5432/kec_routine_saas"
    )

    try:
        conn = psycopg2.connect(db_url)
    except Exception as exc:
        print(json.dumps({"error": f"Database connection failed: {exc}"}, indent=2))
        return 1

    try:
        report = run_audit(conn)
    finally:
        conn.close()

    print(json.dumps(report, indent=2, default=str))
    return 1 if report["summary"]["failed"] > 0 else 0


if __name__ == "__main__":
    raise SystemExit(main())
