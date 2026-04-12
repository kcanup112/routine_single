"""Debug department creation error"""
from sqlalchemy import text
from app.core.database_saas import SessionLocal
from app.models.models import Department
from app.schemas.schemas import DepartmentCreate
from app.services.crud import DepartmentService
import traceback

db = SessionLocal()
try:
    # Set tenant schema
    db.execute(text('SET search_path TO "kec", public'))
    db.commit()
    
    dept_data = DepartmentCreate(name="Debug Test", code="DT")
    result = DepartmentService.create(db, dept_data)
    print("SUCCESS:", result.id, result.name)
    
    # Cleanup
    db.delete(result)
    db.commit()
    print("Cleaned up")
except Exception as e:
    db.rollback()
    print("ERROR:")
    traceback.print_exc()
finally:
    db.close()
