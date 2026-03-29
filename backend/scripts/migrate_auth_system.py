"""
Migration script to add authentication system to KEC Routine Scheduler

This script will:
1. Create the users table
2. Create the initial superadmin user (anupkc@kec.edu.np)
"""
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, engine
from app.models.models import User
from app.auth.password import get_password_hash


def create_auth_tables():
    """Create authentication tables"""
    print("\n" + "=" * 60)
    print("Creating authentication tables...")
    print("=" * 60)
    
    # Create all tables (will only create missing ones)
    Base.metadata.create_all(bind=engine)
    print("✓ Authentication tables created successfully")


def create_superadmin():
    """Create the superadmin user"""
    print("\n" + "=" * 60)
    print("Creating superadmin user...")
    print("=" * 60)
    
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Check if superadmin already exists
        existing_user = session.query(User).filter(User.email == "anupkc@kec.edu.np").first()
        
        if existing_user:
            print("⚠ Superadmin user already exists:")
            print(f"  Email: {existing_user.email}")
            print(f"  Name: {existing_user.full_name}")
            print(f"  Role: {existing_user.role}")
            print(f"  Active: {existing_user.is_active}")
            return
        
        # Create superadmin user
        superadmin = User(
            email="anupkc@kec.edu.np",
            full_name="Anup KC",
            password_hash=get_password_hash("admin123"),
            role="superadmin",
            is_active=True,
            teacher_id=None
        )
        
        session.add(superadmin)
        session.commit()
        
        print("✓ Superadmin user created successfully!")
        print("\n" + "-" * 60)
        print("IMPORTANT - LOGIN CREDENTIALS:")
        print("-" * 60)
        print(f"  Email:    anupkc@kec.edu.np")
        print(f"  Password: admin123")
        print("-" * 60)
        print("⚠ PLEASE CHANGE THIS PASSWORD AFTER FIRST LOGIN!")
        print("-" * 60)
        
    except Exception as e:
        session.rollback()
        print(f"✗ Error creating superadmin: {e}")
        raise
    finally:
        session.close()


def main():
    """Main migration function"""
    print("\n" + "=" * 60)
    print("KEC ROUTINE SCHEDULER - AUTHENTICATION SYSTEM MIGRATION")
    print("=" * 60)
    
    try:
        create_auth_tables()
        create_superadmin()
        
        print("\n" + "=" * 60)
        print("MIGRATION COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print("\nNext steps:")
        print("1. Start the backend server")
        print("2. Login with the credentials above")
        print("3. Change the superadmin password")
        print("4. Create admin and teacher user accounts")
        print("\n")
        
    except Exception as e:
        print("\n" + "=" * 60)
        print("MIGRATION FAILED!")
        print("=" * 60)
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
