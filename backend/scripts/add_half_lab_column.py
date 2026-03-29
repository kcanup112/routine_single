"""
Add is_half_lab column to class_routine_entries table
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine
import sqlite3

def add_half_lab_column():
    """Add is_half_lab column to class_routine_entries table"""
    conn = sqlite3.connect('kec_routine.db')
    cursor = conn.cursor()
    
    try:
        # Check if column already exists
        cursor.execute("PRAGMA table_info(class_routine_entries)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'is_half_lab' not in columns:
            print("Adding is_half_lab column...")
            cursor.execute("""
                ALTER TABLE class_routine_entries 
                ADD COLUMN is_half_lab BOOLEAN DEFAULT 0
            """)
            conn.commit()
            print("✓ Successfully added is_half_lab column")
        else:
            print("✓ Column is_half_lab already exists")
        
    except Exception as e:
        print(f"✗ Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("Adding is_half_lab column to database...")
    add_half_lab_column()
    print("Done!")
