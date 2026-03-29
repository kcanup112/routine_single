from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas import schemas
from app.services.crud import ClassService

router = APIRouter(prefix="/classes", tags=["classes"])

@router.post("/", response_model=schemas.Class)
def create_class(class_data: schemas.ClassCreate, db: Session = Depends(get_db)):
    return ClassService.create(db, class_data)

@router.get("/", response_model=List[schemas.Class])
def get_classes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return ClassService.get_all(db, skip, limit)

@router.get("/{class_id}/", response_model=schemas.Class)
def get_class(class_id: int, db: Session = Depends(get_db)):
    class_obj = ClassService.get_by_id(db, class_id)
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    return class_obj

@router.get("/semester/{semester_id}/", response_model=List[schemas.Class])
def get_classes_by_semester(semester_id: int, db: Session = Depends(get_db)):
    return ClassService.get_by_semester(db, semester_id)

@router.put("/{class_id}/", response_model=schemas.Class)
def update_class(class_id: int, class_data: schemas.ClassUpdate, db: Session = Depends(get_db)):
    updated = ClassService.update(db, class_id, class_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Class not found")
    return updated

@router.delete("/{class_id}/")
def delete_class(class_id: int, db: Session = Depends(get_db)):
    deleted = ClassService.delete(db, class_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Class not found")
    return {"message": "Class deleted successfully"}
