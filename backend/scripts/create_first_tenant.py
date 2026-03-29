"""
Create first tenant and initialize schema
Run this script after database is initialized
"""
import sys
import os
from datetime import datetime, timedelta
from passlib.context import CryptContext

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database_saas import SessionLocal, create_tenant_schema
from app.models.models_saas import Tenant, User
from sqlalchemy import text

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_first_tenant():
    """
    Create the first tenant (KEC) and admin user
    """
    db = SessionLocal()
    
    try:
        # Check if tenant already exists
        existing = db.query(Tenant).filter(Tenant.subdomain == 'kec').first()
        if existing:
            print("Tenant 'kec' already exists!")
            return
        
        # Create tenant
        tenant = Tenant(
            name="Kantipur Engineering College",
            subdomain="kec",
            schema_name="kec",
            admin_email="admin@kec.edu.np",
            admin_name="Admin User",
            phone="+977-1-4382888",
            address="Dhapakhel, Lalitpur",
            city="Lalitpur",
            state="Bagmati",
            country="Nepal",
            plan="premium",  # Start with premium plan
            status="active",
            trial_ends_at=datetime.now() + timedelta(days=14),
            max_teachers=100,
            max_students=2000,
            max_classes=50,
            settings={
                "working_days": [0, 1, 2, 3, 4, 5],  # Sunday to Friday
                "weekend": [5, 6],  # Friday, Saturday
                "time_zone": "Asia/Kathmandu",
                "locale": "en-US",
                "calendar_type": "ad"
            }
        )
        
        db.add(tenant)
        db.commit()
        db.refresh(tenant)
        
        print(f"✓ Created tenant: {tenant.name} (subdomain: {tenant.subdomain})")
        
        # Create tenant schema
        create_tenant_schema(db, tenant.schema_name)
        print(f"✓ Created schema: {tenant.schema_name}")
        
        # Create admin user
        admin_password = "admin123"  # Change this in production!
        admin_user = User(
            tenant_id=tenant.id,
            email="admin@kec.edu.np",
            password_hash=pwd_context.hash(admin_password),
            full_name="Admin User",
            role="admin",
            is_active=True,
            is_verified=True,
            email_verified_at=datetime.now()
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print(f"✓ Created admin user: {admin_user.email}")
        print(f"  Password: {admin_password}")
        print(f"\n✓ Tenant setup complete!")
        print(f"  Subdomain: {tenant.subdomain}")
        print(f"  Access URL: http://{tenant.subdomain}.localhost:3000")
        print(f"  Admin Email: {admin_user.email}")
        print(f"  Admin Password: {admin_password}")
        
    except Exception as e:
        db.rollback()
        print(f"Error creating tenant: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_first_tenant()
