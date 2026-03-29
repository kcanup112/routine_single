from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from app.core.database import get_db
from app.schemas import schemas
from app.services.crud import SubjectService

router = APIRouter(prefix="/subjects", tags=["subjects"])

@router.post("/", response_model=schemas.Subject)
def create_subject(subject: schemas.SubjectCreate, db: Session = Depends(get_db)):
    try:
        return SubjectService.create(db, subject)
    except IntegrityError as e:
        db.rollback()
        if "UNIQUE constraint failed: subjects.code" in str(e):
            raise HTTPException(
                status_code=400, 
                detail=f"Subject with code '{subject.code}' already exists. Please use a different code."
            )
        raise HTTPException(status_code=400, detail="Database integrity error: " + str(e))

@router.get("/", response_model=List[schemas.Subject])
def get_subjects(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db)):
    return SubjectService.get_all(db, skip, limit)

@router.get("/{subject_id}/", response_model=schemas.Subject)
def get_subject(subject_id: int, db: Session = Depends(get_db)):
    subject = SubjectService.get_by_id(db, subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject

@router.put("/{subject_id}/", response_model=schemas.Subject)
def update_subject(subject_id: int, subject: schemas.SubjectUpdate, db: Session = Depends(get_db)):
    updated = SubjectService.update(db, subject_id, subject)
    if not updated:
        raise HTTPException(status_code=404, detail="Subject not found")
    return updated

@router.delete("/{subject_id}/")
def delete_subject(subject_id: int, db: Session = Depends(get_db)):
    deleted = SubjectService.delete(db, subject_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Subject not found")
    return {"message": "Subject deleted successfully"}
