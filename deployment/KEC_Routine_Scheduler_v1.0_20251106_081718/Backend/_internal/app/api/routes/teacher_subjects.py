from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.services.crud import TeacherSubjectService, SubjectService
from app.schemas import schemas

router = APIRouter(prefix="/teacher-subjects", tags=["teacher-subjects"])

@router.get("/{teacher_id}/subjects/", response_model=List[schemas.Subject])
def get_teacher_subjects(teacher_id: int, db: Session = Depends(get_db)):
    """Get all subjects assigned to a teacher"""
    return TeacherSubjectService.get_teacher_subjects(db, teacher_id)

@router.get("/{teacher_id}/available-subjects/", response_model=List[schemas.Subject])
def get_available_subjects(teacher_id: int, db: Session = Depends(get_db)):
    """Get all subjects NOT assigned to a teacher"""
    return TeacherSubjectService.get_available_subjects(db, teacher_id)

@router.post("/{teacher_id}/subjects/{subject_id}/")
def assign_subject_to_teacher(teacher_id: int, subject_id: int, db: Session = Depends(get_db)):
    """Assign a subject to a teacher"""
    result = TeacherSubjectService.assign_subject(db, teacher_id, subject_id)
    return {"message": "Subject assigned successfully", "id": result.id}

@router.delete("/{teacher_id}/subjects/{subject_id}/")
def remove_subject_from_teacher(teacher_id: int, subject_id: int, db: Session = Depends(get_db)):
    """Remove a subject from a teacher"""
    success = TeacherSubjectService.remove_subject(db, teacher_id, subject_id)
    if success:
        return {"message": "Subject removed successfully"}
    raise HTTPException(status_code=404, detail="Teacher-Subject relationship not found")

@router.get("/subject/{subject_id}/teachers/", response_model=List[schemas.Teacher])
def get_teachers_by_subject(subject_id: int, db: Session = Depends(get_db)):
    """Get all teachers who can teach a specific subject"""
    return TeacherSubjectService.get_teachers_by_subject(db, subject_id)
