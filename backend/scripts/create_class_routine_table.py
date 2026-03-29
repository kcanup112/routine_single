import sys
from pathlib import Path

# Add the parent directory to the path to import app modules
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import engine
from app.models import models

def create_class_routine_table():
    """Create the class_routine_entries table"""
    try:
        # Create all tables (will only create missing ones)
        models.Base.metadata.create_all(bind=engine)
        print("✓ Successfully created class_routine_entries table")
        print("  This table stores routine assignments for each class")
        
    except Exception as e:
        print(f"Error creating table: {e}")

if __name__ == "__main__":
    print("Creating class_routine_entries table...")
    print("-" * 50)
    create_class_routine_table()
    print("-" * 50)
    print("Migration complete!")
