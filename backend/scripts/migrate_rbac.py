"""
Migration script for Role-Based Access Control (RBAC)

This script:
1. Updates the role CHECK constraint to allow 'viewer' instead of 'user'
2. Updates existing users with role='user' to role='viewer'
3. Adds 'user_id' column to the teachers table in all tenant schemas

Run this script once after deploying the RBAC changes.

Usage:
    cd backend
    python -m scripts.migrate_rbac
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database_saas import SessionLocal
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def migrate():
    db = SessionLocal()
    try:
        # Step 1: Update role CHECK constraint to include 'viewer' instead of 'user'
        try:
            db.execute(text("ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check"))
            db.execute(text(
                "ALTER TABLE public.users ADD CONSTRAINT users_role_check "
                "CHECK (role IN ('super_admin', 'admin', 'viewer'))"
            ))
            logger.info("Updated users_role_check constraint to: super_admin, admin, viewer")
        except Exception as e:
            logger.warning(f"Constraint update skipped (may already be correct): {e}")

        # Step 2: Update role='user' -> role='viewer' in public.users
        result = db.execute(
            text("UPDATE public.users SET role = 'viewer' WHERE role = 'user'")
        )
        logger.info(f"Updated {result.rowcount} users from role='user' to role='viewer'")

        # Step 3: Get all tenant schemas
        schemas = db.execute(
            text("SELECT schema_name FROM public.tenants WHERE deleted_at IS NULL")
        ).fetchall()

        # Step 4: Add user_id column to teachers table in each tenant schema
        for (schema_name,) in schemas:
            try:
                # Check if column already exists
                col_exists = db.execute(text(
                    "SELECT 1 FROM information_schema.columns "
                    "WHERE table_schema = :schema AND table_name = 'teachers' AND column_name = 'user_id'"
                ), {"schema": schema_name}).fetchone()

                if not col_exists:
                    db.execute(text(
                        f'ALTER TABLE "{schema_name}".teachers ADD COLUMN user_id INTEGER'
                    ))
                    logger.info(f"Added user_id column to {schema_name}.teachers")
                else:
                    logger.info(f"Column user_id already exists in {schema_name}.teachers")
            except Exception as e:
                logger.error(f"Error updating schema {schema_name}: {e}")
                continue

        db.commit()
        logger.info("RBAC migration completed successfully!")

    except Exception as e:
        db.rollback()
        logger.error(f"Migration failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    migrate()
