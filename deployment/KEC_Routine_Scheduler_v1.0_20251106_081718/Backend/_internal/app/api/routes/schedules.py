from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas import schemas
from app.services.crud import ScheduleService

router = APIRouter(prefix="/schedules", tags=["schedules"])

@router.post("/", response_model=schemas.Schedule)
def create_schedule(schedule: schemas.ScheduleCreate, db: Session = Depends(get_db)):
    return ScheduleService.create(db, schedule)

@router.get("/", response_model=List[schemas.Schedule])
def get_schedules(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return ScheduleService.get_all(db, skip, limit)

@router.get("/class/{class_id}/", response_model=List[schemas.Schedule])
def get_class_schedule(class_id: int, db: Session = Depends(get_db)):
    return ScheduleService.get_by_class(db, class_id)

@router.get("/teacher/{teacher_id}/", response_model=List[schemas.Schedule])
def get_teacher_schedule(teacher_id: int, db: Session = Depends(get_db)):
    return ScheduleService.get_by_teacher(db, teacher_id)

@router.delete("/{schedule_id}/")
def delete_schedule(schedule_id: int, db: Session = Depends(get_db)):
    deleted = ScheduleService.delete(db, schedule_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return {"message": "Schedule deleted successfully"}
