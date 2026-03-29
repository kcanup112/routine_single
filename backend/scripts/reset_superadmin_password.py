"""
Reset superadmin password
"""
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config_saas import Settings
from app.models.models_saas import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
settings = Settings()

def reset_password():
    """Reset superadmin password"""
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        # Find the user
        user = db.query(User).filter(User.email == "anupkc_1@hotmail.com").first()
        
        if not user:
            print("User not found!")
            return
        
        print(f"Found user: {user.email}")
        print(f"Name: {user.full_name}")
        print(f"Role: {user.role}")
        
        # Reset password to admin123
        new_password = "admin123"
        user.password_hash = pwd_context.hash(new_password)
        db.commit()
        
        print(f"\n✓ Password reset successfully!")
        print(f"Email: {user.email}")
        print(f"Password: {new_password}")
        
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    reset_password()
