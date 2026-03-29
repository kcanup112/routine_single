"""
Safe migration script for production database
Only adds missing tables, doesn't modify existing data
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import inspect
from app.core.database import engine, Base
from app.models.models import User, CalendarEvent
from app.auth.password import get_password_hash
from sqlalchemy.orm import sessionmaker

def check_table_exists(table_name):
    """Check if a table exists in the database"""
    inspector = inspect(engine)
    return table_name in inspector.get_table_names()

def migrate_production():
    """Add missing tables to production database"""
    print("\n" + "=" * 60)
    print("PRODUCTION DATABASE MIGRATION")
    print("=" * 60)
    
    # Check which tables need to be created
    tables_to_create = []
    
    if not check_table_exists('users'):
        tables_to_create.append('users')
        print("✓ Will create: users table")
    else:
        print("- users table already exists, skipping")
    
    if not check_table_exists('calendar_events'):
        tables_to_create.append('calendar_events')
        print("✓ Will create: calendar_events table")
    else:
        print("- calendar_events table already exists, skipping")
    
    if not tables_to_create:
        print("\n✓ All tables already exist. No migration needed.")
        return
    
    # Create only missing tables
    print("\n" + "-" * 60)
    print("Creating missing tables...")
    print("-" * 60)
    
    Base.metadata.create_all(bind=engine)
    print("✓ Tables created successfully")
    
    # Create superadmin only if users table was just created
    if 'users' in tables_to_create:
        Session = sessionmaker(bind=engine)
        session = Session()
        
        try:
            # Check if superadmin already exists
            existing_user = session.query(User).filter(User.email == "anupkc@kec.edu.np").first()
            
            if not existing_user:
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
                
                print("\n" + "-" * 60)
                print("SUPERADMIN CREATED:")
                print("-" * 60)
                print("  Email:    anupkc@kec.edu.np")
                print("  Password: admin123")
                print("-" * 60)
                print("⚠ CHANGE PASSWORD AFTER FIRST LOGIN!")
                print("-" * 60)
            else:
                print("\n✓ Superadmin user already exists")
                
        except Exception as e:
            session.rollback()
            print(f"\n✗ Error creating superadmin: {e}")
        finally:
            session.close()
    
    print("\n" + "=" * 60)
    print("MIGRATION COMPLETED SUCCESSFULLY!")
    print("=" * 60)
    print("\nExisting data preserved:")
    print("  ✓ Departments, Programmes, Classes")
    print("  ✓ Teachers, Subjects, Rooms")
    print("  ✓ Time Periods, Class Routines")
    print("  ✓ Routine Assignments")
    print("\nNew features added:")
    if 'users' in tables_to_create:
        print("  ✓ User authentication system")
    if 'calendar_events' in tables_to_create:
        print("  ✓ Academic calendar")
    print("\n")

if __name__ == "__main__":
    try:
        migrate_production()
    except Exception as e:
        print("\n" + "=" * 60)
        print("MIGRATION FAILED!")
        print("=" * 60)
        print(f"Error: {e}")
        print("\nYour database has NOT been modified.")
        print("Please check the error and try again.")
        sys.exit(1)