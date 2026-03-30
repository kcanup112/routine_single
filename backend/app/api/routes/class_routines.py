from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database_saas import get_db
from app.services.crud import ClassRoutineService, RoutineGeneratorService
from pydantic import BaseModel

router = APIRouter(prefix="/class-routines", tags=["class-routines"])

class RoutineEntryCreate(BaseModel):
    dayId: int
    periodId: int
    subject_id: int
    is_lab: bool = False
    is_half_lab: bool = False
    num_periods: int = 1
    lead_teacher_id: Optional[int] = None
    assist_teacher_1_id: Optional[int] = None
    assist_teacher_2_id: Optional[int] = None
    assist_teacher_3_id: Optional[int] = None
    group: Optional[str] = None
    lab_room: Optional[str] = None
    lab_group_id: Optional[str] = None
    isContinuation: bool = False

class RoutineSaveRequest(BaseModel):
    class_id: int
    entries: List[dict]
    room_no: Optional[str] = None

class TeacherConflictRequest(BaseModel):
    teacher_id: int
    day_id: int
    period_ids: List[int]
    exclude_class_id: Optional[int] = None

class TeacherLoad(BaseModel):
    teacher_id: int
    load: int

class SubjectAssignment(BaseModel):
    subject_id: int
    teachers: List[TeacherLoad]

class ClassAssignment(BaseModel):
    class_id: int
    subjects: List[SubjectAssignment]

class GenerateRequest(BaseModel):
    assignments: List[ClassAssignment]

@router.post("/save/")
def save_routine(request: RoutineSaveRequest, db: Session = Depends(get_db)):
    """Save or update routine for a class"""
    try:
        entries = ClassRoutineService.save_routine(db, request.class_id, request.entries, request.room_no)
        return {"message": "Routine saved successfully", "count": len(entries)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/")
def get_all_routines(db: Session = Depends(get_db)):
    """Get all class routine entries"""
    routines = ClassRoutineService.get_all_routines(db)
    return routines

@router.get("/{class_id}/")
def get_routine_by_class(class_id: int, db: Session = Depends(get_db)):
    """Get routine for a specific class"""
    routine = ClassRoutineService.get_routine_by_class(db, class_id)
    return routine

@router.delete("/{class_id}/")
def delete_routine(class_id: int, db: Session = Depends(get_db)):
    """Delete routine for a specific class"""
    success = ClassRoutineService.delete_routine(db, class_id)
    if success:
        return {"message": "Routine deleted successfully"}
    raise HTTPException(status_code=404, detail="Routine not found")

@router.post("/check-teacher-conflict/")
def check_teacher_conflict(
    request: TeacherConflictRequest,
    db: Session = Depends(get_db)
):
    """Check if a teacher has conflicts in the given time slots"""
    result = ClassRoutineService.check_teacher_conflicts(
        db, request.teacher_id, request.day_id, request.period_ids, request.exclude_class_id
    )
    return result

@router.post("/generate/")
def generate_routine(request: GenerateRequest, db: Session = Depends(get_db)):
    """
    Auto-generate theory routine entries for the given class-subject-teacher assignments.
    Prioritises consecutive 2-period blocks. Skips slots occupied by labs or other classes.
    """
    try:
        result = RoutineGeneratorService.generate(
            db, [a.dict() for a in request.assignments]
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
