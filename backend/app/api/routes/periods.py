from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database_saas import get_db
from app.schemas import schemas
from app.services.crud import PeriodService
from app.auth.dependencies import require_read_access, require_write_access
from app.models.models import User

router = APIRouter(prefix="/periods", tags=["periods"])

@router.post("/", response_model=schemas.Period)
def create_period(period: schemas.PeriodCreate, db: Session = Depends(get_db), current_user: User = Depends(require_write_access)):
    return PeriodService.create(db, period)

@router.get("/", response_model=List[schemas.Period])
def get_periods(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(require_read_access)):
    return PeriodService.get_all(db, skip, limit)

@router.get("/shift/{shift_id}", response_model=List[schemas.Period])
def get_periods_by_shift(shift_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_read_access)):
    """Get all periods for a specific shift"""
    return PeriodService.get_by_shift(db, shift_id)

@router.get("/shift/{shift_id}/teaching", response_model=List[schemas.Period])
def get_teaching_periods_by_shift(shift_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_read_access)):
    """Get only teaching periods for a specific shift"""
    return PeriodService.get_teaching_periods_by_shift(db, shift_id)

@router.get("/default/teaching", response_model=List[schemas.Period])
def get_default_teaching_periods(db: Session = Depends(get_db), current_user: User = Depends(require_read_access)):
    """Get teaching periods for the default active shift."""
    return PeriodService.get_default_teaching_periods(db)

@router.get("/{period_id}", response_model=schemas.Period)
def get_period(period_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_read_access)):
    period = PeriodService.get_by_id(db, period_id)
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")
    return period

@router.put("/{period_id}", response_model=schemas.Period)
def update_period(period_id: int, period: schemas.PeriodCreate, db: Session = Depends(get_db), current_user: User = Depends(require_write_access)):
    updated = PeriodService.update(db, period_id, period)
    if not updated:
        raise HTTPException(status_code=404, detail="Period not found")
    return updated

@router.delete("/{period_id}/")
def delete_period(period_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_write_access)):
    deleted = PeriodService.delete(db, period_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Period not found")
    return {"message": "Period deleted successfully"}


