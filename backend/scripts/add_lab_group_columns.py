"""
Add group, lab_room, and lab_group_id columns to class_routine_entries table
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import sqlite3

def add_columns():
    """Add new columns for multi-subject lab sessions"""
    conn = sqlite3.connect('kec_routine.db')
    cursor = conn.cursor()
    
    try:
        # Check existing columns
        cursor.execute("PRAGMA table_info(class_routine_entries)")
        columns = [column[1] for column in cursor.fetchall()]
        print(f"Existing columns: {columns}")
        
        # Add group column
        if 'group' not in columns:
            print("Adding 'group' column...")
            cursor.execute("""
                ALTER TABLE class_routine_entries 
                ADD COLUMN "group" TEXT
            """)
            print("✓ Added 'group' column")
        else:
            print("✓ Column 'group' already exists")
        
        # Add lab_room column
        if 'lab_room' not in columns:
            print("Adding 'lab_room' column...")
            cursor.execute("""
                ALTER TABLE class_routine_entries 
                ADD COLUMN lab_room TEXT
            """)
            print("✓ Added 'lab_room' column")
        else:
            print("✓ Column 'lab_room' already exists")
        
        # Add lab_group_id column
        if 'lab_group_id' not in columns:
            print("Adding 'lab_group_id' column...")
            cursor.execute("""
                ALTER TABLE class_routine_entries 
                ADD COLUMN lab_group_id TEXT
            """)
            print("✓ Added 'lab_group_id' column")
        else:
            print("✓ Column 'lab_group_id' already exists")
        
        conn.commit()
        print("\n✅ Migration completed successfully!")
        
    except Exception as e:
        print(f"✗ Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("Running migration to add lab group columns...\n")
    add_columns()
