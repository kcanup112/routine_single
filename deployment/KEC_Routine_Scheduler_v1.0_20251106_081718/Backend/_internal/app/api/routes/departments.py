from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas import schemas
from app.services.crud import DepartmentService

router = APIRouter(prefix="/departments", tags=["departments"])

@router.post("/", response_model=schemas.Department)
def create_department(department: schemas.DepartmentCreate, db: Session = Depends(get_db)):
    return DepartmentService.create(db, department)

@router.get("/", response_model=List[schemas.Department])
def get_departments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return DepartmentService.get_all(db, skip, limit)

@router.get("/{department_id}/", response_model=schemas.Department)
def get_department(department_id: int, db: Session = Depends(get_db)):
    department = DepartmentService.get_by_id(db, department_id)
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    return department

@router.put("/{department_id}/", response_model=schemas.Department)
def update_department(department_id: int, department: schemas.DepartmentUpdate, db: Session = Depends(get_db)):
    updated = DepartmentService.update(db, department_id, department)
    if not updated:
        raise HTTPException(status_code=404, detail="Department not found")
    return updated

@router.delete("/{department_id}/")
def delete_department(department_id: int, db: Session = Depends(get_db)):
    deleted = DepartmentService.delete(db, department_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Department not found")
    return {"message": "Department deleted successfully"}
