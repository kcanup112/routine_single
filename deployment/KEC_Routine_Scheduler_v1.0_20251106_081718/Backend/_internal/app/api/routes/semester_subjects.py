from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import SemesterSubject, Subject
from app.schemas.schemas import SemesterSubjectCreate, SemesterSubject as SemesterSubjectSchema

router = APIRouter()

@router.get("/semester/{semester_id}/subjects/", response_model=List[dict])
def get_semester_subjects(semester_id: int, db: Session = Depends(get_db)):
    """Get all subjects for a semester"""
    semester_subjects = db.query(SemesterSubject).filter(
        SemesterSubject.semester_id == semester_id
    ).all()
    
    result = []
    for ss in semester_subjects:
        subject = db.query(Subject).filter(Subject.id == ss.subject_id).first()
        if subject:
            result.append({
                "id": subject.id,
                "name": subject.name,
                "code": subject.code,
                "is_lab": subject.is_lab,
                "credit_hours": subject.credit_hours,
                "semester_subject_id": ss.id
            })
    
    return result

@router.post("/semester/{semester_id}/subjects/{subject_id}/")
def add_subject_to_semester(semester_id: int, subject_id: int, db: Session = Depends(get_db)):
    """Add a subject to a semester"""
    # Check if already exists
    existing = db.query(SemesterSubject).filter(
        SemesterSubject.semester_id == semester_id,
        SemesterSubject.subject_id == subject_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Subject already added to this semester")
    
    semester_subject = SemesterSubject(
        semester_id=semester_id,
        subject_id=subject_id
    )
    db.add(semester_subject)
    db.commit()
    db.refresh(semester_subject)
    
    return {"message": "Subject added successfully", "id": semester_subject.id}

@router.delete("/semester/{semester_id}/subjects/{subject_id}/")
def remove_subject_from_semester(semester_id: int, subject_id: int, db: Session = Depends(get_db)):
    """Remove a subject from a semester"""
    semester_subject = db.query(SemesterSubject).filter(
        SemesterSubject.semester_id == semester_id,
        SemesterSubject.subject_id == subject_id
    ).first()
    
    if not semester_subject:
        raise HTTPException(status_code=404, detail="Subject not found in this semester")
    
    db.delete(semester_subject)
    db.commit()
    
    return {"message": "Subject removed successfully"}
