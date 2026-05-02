"""Create in_app_notifications table."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database_saas import engine
from sqlalchemy import text

def main():
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS in_app_notifications (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                body TEXT,
                url VARCHAR(500),
                tag VARCHAR(100),
                created_at TIMESTAMP DEFAULT NOW()
            )
        """))
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS ix_in_app_notifications_created_at
            ON in_app_notifications (created_at)
        """))
        conn.commit()
        print("in_app_notifications table created successfully")

if __name__ == "__main__":
    main()
