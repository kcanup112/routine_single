from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas import schemas
from app.services.crud import DayService

router = APIRouter(prefix="/days", tags=["days"])

@router.post("/", response_model=schemas.Day)
def create_day(day: schemas.DayCreate, db: Session = Depends(get_db)):
    return DayService.create(db, day)

@router.get("/", response_model=List[schemas.Day])
def get_days(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return DayService.get_all(db, skip, limit)

@router.get("/{day_id}", response_model=schemas.Day)
def get_day(day_id: int, db: Session = Depends(get_db)):
    day = DayService.get_by_id(db, day_id)
    if not day:
        raise HTTPException(status_code=404, detail="Day not found")
    return day

@router.put("/{day_id}", response_model=schemas.Day)
def update_day(day_id: int, day: schemas.DayBase, db: Session = Depends(get_db)):
    updated = DayService.update(db, day_id, day)
    if not updated:
        raise HTTPException(status_code=404, detail="Day not found")
    return updated

@router.delete("/{day_id}/")
def delete_day(day_id: int, db: Session = Depends(get_db)):
    deleted = DayService.delete(db, day_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Day not found")
    return {"message": "Day deleted successfully"}
