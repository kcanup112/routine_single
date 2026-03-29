"""
Migration script to add new columns to the classes table
Run this script to update the database schema without losing data
"""

import sqlite3
import sys
from pathlib import Path

# Add parent directory to path to import from app
sys.path.insert(0, str(Path(__file__).parent.parent))

# Database path
DB_PATH = Path(__file__).parent.parent / "kec_routine.db"

def migrate():
    print(f"Connecting to database: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(classes)")
        columns = [row[1] for row in cursor.fetchall()]
        print(f"Current columns in classes table: {columns}")
        
        # Add department_id column if it doesn't exist
        if 'department_id' not in columns:
            print("Adding department_id column...")
            cursor.execute("ALTER TABLE classes ADD COLUMN department_id INTEGER")
            print("✓ Added department_id column")
        else:
            print("✓ department_id column already exists")
        
        # Add room_no column if it doesn't exist
        if 'room_no' not in columns:
            print("Adding room_no column...")
            cursor.execute("ALTER TABLE classes ADD COLUMN room_no VARCHAR")
            print("✓ Added room_no column")
        else:
            print("✓ room_no column already exists")
        
        # Add effective_date column if it doesn't exist
        if 'effective_date' not in columns:
            print("Adding effective_date column...")
            cursor.execute("ALTER TABLE classes ADD COLUMN effective_date VARCHAR")
            print("✓ Added effective_date column")
        else:
            print("✓ effective_date column already exists")
        
        # Make section NOT NULL if needed (this requires recreating the table)
        # For now, we'll just update NULL values to empty string
        print("Updating NULL section values...")
        cursor.execute("UPDATE classes SET section = '' WHERE section IS NULL")
        
        conn.commit()
        print("\n✅ Migration completed successfully!")
        print("You can now restart the backend server.")
        
    except Exception as e:
        print(f"\n❌ Error during migration: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
