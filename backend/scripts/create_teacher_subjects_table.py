import sys
from pathlib import Path

# Add the parent directory to the path to import app modules
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import engine
from app.models import models

def create_teacher_subjects_table():
    """Create the teacher_subjects table"""
    try:
        # Create all tables (will only create missing ones)
        models.Base.metadata.create_all(bind=engine)
        print("✓ Successfully created teacher_subjects table")
        print("  This table manages the many-to-many relationship between teachers and subjects")
        
    except Exception as e:
        print(f"Error creating table: {e}")

if __name__ == "__main__":
    print("Creating teacher_subjects table...")
    print("-" * 50)
    create_teacher_subjects_table()
    print("-" * 50)
    print("Migration complete!")
