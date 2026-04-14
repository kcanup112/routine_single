"""
Setup script for single-tenant Routine Scheduler.
Creates the initial admin user.

Usage:
    python -m scripts.setup_admin

Or with environment variables:
    ADMIN_EMAIL=admin@school.edu ADMIN_PASSWORD=SecurePass123 python -m scripts.setup_admin
"""
import os
import sys
import getpass

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database_saas import SessionLocal, engine, Base
from app.models.models import User
from app.auth.password import get_password_hash


def create_admin():
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Check if admin already exists
        existing = db.query(User).filter(User.role == 'admin').first()
        if existing:
            print(f"Admin user already exists: {existing.email}")
            overwrite = input("Create another admin? (y/N): ").strip().lower()
            if overwrite != 'y':
                return

        # Get credentials from env or prompt
        email = os.environ.get('ADMIN_EMAIL')
        password = os.environ.get('ADMIN_PASSWORD')
        full_name = os.environ.get('ADMIN_NAME')

        if not email:
            email = input("Admin email: ").strip()
        if not full_name:
            full_name = input("Admin full name: ").strip()
        if not password:
            password = getpass.getpass("Admin password (min 8 chars): ")
            if len(password) < 8:
                print("Error: Password must be at least 8 characters.")
                return

        # Check email uniqueness
        if db.query(User).filter(User.email == email).first():
            print(f"Error: User with email '{email}' already exists.")
            return

        admin = User(
            email=email,
            full_name=full_name,
            password_hash=get_password_hash(password),
            role='admin',
            is_active=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print(f"Admin user created successfully: {admin.email} (id={admin.id})")
    finally:
        db.close()


if __name__ == '__main__':
    create_admin()
