import sys
from pathlib import Path

# Add the parent directory to the path to import app modules
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import SessionLocal
from app.models import models

def test_teacher_subject_relationship():
    """Test the teacher-subject relationship"""
    db = SessionLocal()
    try:
        # Count teachers and subjects
        teacher_count = db.query(models.Teacher).count()
        subject_count = db.query(models.Subject).count()
        relationship_count = db.query(models.TeacherSubject).count()
        
        print("Current Database Status:")
        print("-" * 50)
        print(f"Teachers: {teacher_count}")
        print(f"Subjects: {subject_count}")
        print(f"Teacher-Subject Relationships: {relationship_count}")
        print("-" * 50)
        
        if teacher_count > 0 and subject_count > 0:
            print("\n✓ Ready to assign subjects to teachers!")
            print("  Use the Teachers page and click 'Subjects' button to manage relationships")
        else:
            if teacher_count == 0:
                print("\n⚠ No teachers found. Please add teachers first.")
            if subject_count == 0:
                print("\n⚠ No subjects found. Please add subjects first.")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_teacher_subject_relationship()
