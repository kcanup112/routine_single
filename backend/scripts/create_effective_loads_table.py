"""
Script to create teacher_effective_loads table
"""
import sys
import os

# Add parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, inspect
from app.models.models import Base, TeacherEffectiveLoad
from app.core.config import settings

def create_effective_loads_table():
    """Create teacher_effective_loads table in the database"""
    # Create engine
    engine = create_engine(settings.DATABASE_URL)
    
    # Check if table already exists
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    if 'teacher_effective_loads' in existing_tables:
        print("✓ teacher_effective_loads table already exists")
        return
    
    # Create only the teacher_effective_loads table
    TeacherEffectiveLoad.__table__.create(engine)
    
    print("✓ teacher_effective_loads table created successfully!")

if __name__ == "__main__":
    create_effective_loads_table()
