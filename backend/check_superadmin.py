"""
Check and optionally create superadmin user.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database_saas import SessionLocal, engine, Base
from app.models.models import User
from app.auth.password import get_password_hash, verify_password

TARGET_EMAIL = "anupkc@kec.edu.np"
TARGET_PASSWORD = "admin123"
TARGET_NAME = "Anup KC"
TARGET_ROLE = "admin"

def main():
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("=" * 50)
        print("SUPERADMIN STATUS CHECK")
        print("=" * 50)

        # List all users
        all_users = db.query(User).all()
        print(f"Total users in DB: {len(all_users)}")
        for u in all_users:
            print(f"  - {u.email} | role={u.role} | active={u.is_active}")

        print()
        user = db.query(User).filter(User.email == TARGET_EMAIL).first()

        if user:
            print(f"[FOUND] User: {user.email}")
            print(f"  Name  : {user.full_name}")
            print(f"  Role  : {user.role}")
            print(f"  Active: {user.is_active}")
            pw_ok = verify_password(TARGET_PASSWORD, user.password_hash)
            print(f"  Password '{TARGET_PASSWORD}' matches: {pw_ok}")

            if not pw_ok:
                print(f"\nResetting password to '{TARGET_PASSWORD}'...")
                user.password_hash = get_password_hash(TARGET_PASSWORD)
                db.commit()
                print("  Password reset successfully.")

            if user.role != TARGET_ROLE:
                print(f"\nUpdating role from '{user.role}' to '{TARGET_ROLE}'...")
                user.role = TARGET_ROLE
                db.commit()
                print("  Role updated.")

            if not user.is_active:
                print("\nActivating user...")
                user.is_active = True
                db.commit()
                print("  User activated.")
        else:
            print(f"[NOT FOUND] Creating superadmin: {TARGET_EMAIL}")
            new_user = User(
                email=TARGET_EMAIL,
                full_name=TARGET_NAME,
                password_hash=get_password_hash(TARGET_PASSWORD),
                role=TARGET_ROLE,
                is_active=True,
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            print(f"  [OK] Created: {new_user.email} (id={new_user.id})")
            print(f"  Role    : {new_user.role}")
            print(f"  Password: {TARGET_PASSWORD}")

        print("\n" + "=" * 50)
        print("DONE")
        print("=" * 50)
    finally:
        db.close()

if __name__ == "__main__":
    main()
