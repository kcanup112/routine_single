"""
Migration script: Fix all existing tenant schemas to match ORM models.
Run inside Docker: docker exec kec-routine-backend python migrate_tenant_schemas.py
Or locally:        python migrate_tenant_schemas.py

This script finds every tenant schema and applies ALTER TABLE statements
to add missing columns, widen columns, create missing tables, etc.
"""
import sys
sys.path.insert(0, '.')

from sqlalchemy import text
from app.core.database_saas import SessionLocal
from app.models.models_saas import Tenant

def get_all_tenant_schemas(db):
    """Get list of all active tenant schema names."""
    tenants = db.query(Tenant).filter(Tenant.deleted_at.is_(None)).all()
    return [t.schema_name for t in tenants]


def migrate_schema(db, schema):
    """Apply all column/table fixes for one tenant schema."""
    print(f"\n{'='*60}")
    print(f"Migrating schema: {schema}")
    print(f"{'='*60}")

    stmts = []

    # ── departments ──────────────────────────────────────────
    # ORM: name UNIQUE, code VARCHAR(50) nullable
    # Old SQL: code VARCHAR(20) UNIQUE NOT NULL
    stmts += [
        f'ALTER TABLE "{schema}".departments ALTER COLUMN code DROP NOT NULL',
        f'ALTER TABLE "{schema}".departments ALTER COLUMN code TYPE VARCHAR(50)',
    ]

    # ── programmes ───────────────────────────────────────────
    # ORM: code VARCHAR(50) nullable, duration_years nullable (no default)
    stmts += [
        f'ALTER TABLE "{schema}".programmes ALTER COLUMN code DROP NOT NULL',
        f'ALTER TABLE "{schema}".programmes ALTER COLUMN code TYPE VARCHAR(50)',
    ]

    # ── classes ───────────────────────────────────────────────
    # ORM: section VARCHAR(50), department_id FK
    stmts += [
        f'ALTER TABLE "{schema}".classes ALTER COLUMN section TYPE VARCHAR(50)',
        f'ALTER TABLE "{schema}".classes ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES "{schema}".departments(id)',
    ]

    # ── teachers ─────────────────────────────────────────────
    # ORM: qualification TEXT (was VARCHAR(200))
    stmts += [
        f'ALTER TABLE "{schema}".teachers ALTER COLUMN qualification TYPE TEXT',
    ]

    # ── subjects ─────────────────────────────────────────────
    # ORM: code VARCHAR(50) UNIQUE
    stmts += [
        f'ALTER TABLE "{schema}".subjects ALTER COLUMN code TYPE VARCHAR(50)',
    ]

    # ── teacher_subjects ─────────────────────────────────────
    # ORM has: proficiency_level, preferred, updated_at
    # Old SQL had: can_teach_theory, can_teach_lab, preference_level (no updated_at)
    stmts += [
        f'ALTER TABLE "{schema}".teacher_subjects ADD COLUMN IF NOT EXISTS proficiency_level VARCHAR(50) DEFAULT \'expert\'',
        f'ALTER TABLE "{schema}".teacher_subjects ADD COLUMN IF NOT EXISTS preferred BOOLEAN DEFAULT false',
        f'ALTER TABLE "{schema}".teacher_subjects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    ]

    # ── rooms ────────────────────────────────────────────────
    # ORM: room_number VARCHAR(50) (was VARCHAR(20))
    stmts += [
        f'ALTER TABLE "{schema}".rooms ALTER COLUMN room_number TYPE VARCHAR(50)',
    ]

    # ── days ─────────────────────────────────────────────────
    # ORM: name VARCHAR(50) (was VARCHAR(20))
    stmts += [
        f'ALTER TABLE "{schema}".days ALTER COLUMN name TYPE VARCHAR(50)',
    ]

    # ── class_routines ───────────────────────────────────────
    # ORM: room_no VARCHAR(50) (was VARCHAR(20))
    stmts += [
        f'ALTER TABLE "{schema}".class_routines ALTER COLUMN room_no TYPE VARCHAR(50)',
    ]

    # ── semester_subjects (already fixed in prior session) ───
    # Ensure columns exist
    stmts += [
        f'ALTER TABLE "{schema}".semester_subjects ADD COLUMN IF NOT EXISTS periods_per_week INTEGER DEFAULT 3',
        f'ALTER TABLE "{schema}".semester_subjects ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true',
        f'ALTER TABLE "{schema}".semester_subjects ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        f'ALTER TABLE "{schema}".semester_subjects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        f'ALTER TABLE "{schema}".semester_subjects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP',
    ]

    # ── calendar_events (already fixed in prior session) ─────
    # Ensure columns exist
    stmts += [
        f'ALTER TABLE "{schema}".calendar_events ADD COLUMN IF NOT EXISTS start_time TIME',
        f'ALTER TABLE "{schema}".calendar_events ADD COLUMN IF NOT EXISTS end_time TIME',
        f'ALTER TABLE "{schema}".calendar_events ADD COLUMN IF NOT EXISTS class_id INTEGER REFERENCES "{schema}".classes(id) ON DELETE CASCADE',
        f'ALTER TABLE "{schema}".calendar_events ADD COLUMN IF NOT EXISTS teacher_id INTEGER REFERENCES "{schema}".teachers(id) ON DELETE SET NULL',
        f'ALTER TABLE "{schema}".calendar_events ADD COLUMN IF NOT EXISTS location VARCHAR(255)',
        f'ALTER TABLE "{schema}".calendar_events ADD COLUMN IF NOT EXISTS is_all_day BOOLEAN DEFAULT false',
        f'ALTER TABLE "{schema}".calendar_events ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT \'scheduled\'',
        f'ALTER TABLE "{schema}".calendar_events ADD COLUMN IF NOT EXISTS is_holiday BOOLEAN DEFAULT false',
        f'ALTER TABLE "{schema}".calendar_events ADD COLUMN IF NOT EXISTS color VARCHAR(20)',
    ]

    # ── Missing tables ───────────────────────────────────────
    # position_rates
    stmts += [
        f'CREATE TABLE IF NOT EXISTS "{schema}".position_rates (id SERIAL PRIMARY KEY, position VARCHAR UNIQUE NOT NULL, rate DOUBLE PRECISION NOT NULL)',
    ]

    # teacher_effective_loads
    stmts += [
        f'CREATE TABLE IF NOT EXISTS "{schema}".teacher_effective_loads (id SERIAL PRIMARY KEY, teacher_id INTEGER UNIQUE NOT NULL REFERENCES "{schema}".teachers(id), effective_load DOUBLE PRECISION NOT NULL DEFAULT 20.0, position VARCHAR)',
    ]

    # ── Execute all ──────────────────────────────────────────
    success = 0
    skipped = 0
    for stmt in stmts:
        try:
            db.execute(text(stmt))
            success += 1
        except Exception as e:
            err = str(e)
            # Ignore harmless errors (column already exists, already correct type, etc.)
            if 'already exists' in err or 'DuplicateColumn' in err:
                skipped += 1
            elif 'nothing to alter' in err.lower():
                skipped += 1
            else:
                print(f"  WARN: {stmt[:80]}... -> {err[:120]}")
                skipped += 1

    db.commit()
    print(f"  Done: {success} applied, {skipped} skipped/already-up-to-date")


def main():
    db = SessionLocal()
    try:
        schemas = get_all_tenant_schemas(db)
        if not schemas:
            print("No tenant schemas found.")
            return

        print(f"Found {len(schemas)} tenant schema(s): {schemas}")

        for schema in schemas:
            migrate_schema(db, schema)

        print(f"\n{'='*60}")
        print("Migration complete!")
        print(f"{'='*60}")

    except Exception as e:
        print(f"FATAL: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == '__main__':
    main()
