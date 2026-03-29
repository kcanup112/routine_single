from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas import schemas
from app.services.crud import TeacherService

router = APIRouter(prefix="/teachers", tags=["teachers"])

@router.post("/", response_model=schemas.Teacher)
def create_teacher(teacher: schemas.TeacherCreate, db: Session = Depends(get_db)):
    return TeacherService.create(db, teacher)

@router.get("/", response_model=List[schemas.Teacher])
def get_teachers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return TeacherService.get_all(db, skip, limit)

@router.get("/{teacher_id}/", response_model=schemas.Teacher)
def get_teacher(teacher_id: int, db: Session = Depends(get_db)):
    teacher = TeacherService.get_by_id(db, teacher_id)
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return teacher

@router.put("/{teacher_id}/", response_model=schemas.Teacher)
def update_teacher(teacher_id: int, teacher: schemas.TeacherUpdate, db: Session = Depends(get_db)):
    updated = TeacherService.update(db, teacher_id, teacher)
    if not updated:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return updated

@router.delete("/{teacher_id}/")
def delete_teacher(teacher_id: int, db: Session = Depends(get_db)):
    deleted = TeacherService.delete(db, teacher_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return {"message": "Teacher deleted successfully"}
