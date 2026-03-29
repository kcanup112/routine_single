from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas import schemas
from app.services.crud import SemesterService

router = APIRouter(prefix="/semesters", tags=["semesters"])

@router.post("/", response_model=schemas.Semester)
def create_semester(semester: schemas.SemesterCreate, db: Session = Depends(get_db)):
    return SemesterService.create(db, semester)

@router.get("/", response_model=List[schemas.Semester])
def get_semesters(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return SemesterService.get_all(db, skip, limit)

@router.get("/{semester_id}/", response_model=schemas.Semester)
def get_semester(semester_id: int, db: Session = Depends(get_db)):
    semester = SemesterService.get_by_id(db, semester_id)
    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")
    return semester

@router.get("/programme/{programme_id}/", response_model=List[schemas.Semester])
def get_semesters_by_programme(programme_id: int, db: Session = Depends(get_db)):
    return SemesterService.get_by_programme(db, programme_id)

@router.put("/{semester_id}/", response_model=schemas.Semester)
def update_semester(semester_id: int, semester: schemas.SemesterUpdate, db: Session = Depends(get_db)):
    updated = SemesterService.update(db, semester_id, semester)
    if not updated:
        raise HTTPException(status_code=404, detail="Semester not found")
    return updated

@router.delete("/{semester_id}/")
def delete_semester(semester_id: int, db: Session = Depends(get_db)):
    deleted = SemesterService.delete(db, semester_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Semester not found")
    return {"message": "Semester deleted successfully"}
