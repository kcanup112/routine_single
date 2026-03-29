"""
Migration script to add assist_teacher_3_id column to class_routine_entries table
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings

def add_assist_teacher_3_column():
    # Create database engine
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # Check if column already exists
        result = conn.execute(text(
            "SELECT COUNT(*) as count FROM pragma_table_info('class_routine_entries') "
            "WHERE name='assist_teacher_3_id'"
        ))
        count = result.fetchone()[0]
        
        if count == 0:
            print("Adding assist_teacher_3_id column...")
            conn.execute(text(
                "ALTER TABLE class_routine_entries "
                "ADD COLUMN assist_teacher_3_id INTEGER "
                "REFERENCES teachers(id)"
            ))
            conn.commit()
            print("✓ Column assist_teacher_3_id added successfully!")
        else:
            print("Column assist_teacher_3_id already exists.")
    
    engine.dispose()

if __name__ == "__main__":
    print("Starting migration: Add assist_teacher_3_id to class_routine_entries")
    add_assist_teacher_3_column()
    print("Migration completed!")
