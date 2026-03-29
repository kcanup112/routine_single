#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine
from app.models.models import Teacher
from app.schemas.schemas import TeacherCreate
from app.services.crud import TeacherService
from sqlalchemy import text

def test_teacher_creation():
    print("=== Testing Teacher Creation ===")
    
    # Test database connection
    print(f"Database URL: {engine.url}")
    
    # Check if tables exist
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table';"))
            tables = [row[0] for row in result]
            print(f"Available tables: {tables}")
            
            if 'teachers' in tables:
                result = conn.execute(text("PRAGMA table_info(teachers);"))
                columns = [(row[1], row[2]) for row in result]
                print(f"Teachers table columns: {columns}")
            else:
                print("Teachers table not found!")
                
    except Exception as e:
        print(f"Database connection error: {e}")
        return
    
    # Test creating a teacher
    db = SessionLocal()
    try:
        teacher_data = TeacherCreate(
            name="Test Teacher Debug",
            abbreviation="TTD",
            recruitment="Full Time"
        )
        
        print(f"Creating teacher with data: {teacher_data.dict()}")
        
        # Try to create teacher
        teacher = TeacherService.create(db, teacher_data)
        print(f"Success! Created teacher: {teacher}")
        
    except Exception as e:
        print(f"Error creating teacher: {e}")
        import traceback
        traceback.print_exc()
        
    finally:
        db.close()

if __name__ == "__main__":
    test_teacher_creation()