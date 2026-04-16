from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database_saas import get_db
from app.schemas import schemas
from app.services.crud import ShiftService
from app.auth.dependencies import require_read_access, require_write_access
from app.models.models import User

router = APIRouter(prefix="/shifts", tags=["shifts"])

@router.post("/", response_model=schemas.Shift)
def create_shift(shift: schemas.ShiftCreate, db: Session = Depends(get_db), current_user: User = Depends(require_write_access)):
    """Create a new shift"""
    return ShiftService.create(db, shift)

@router.get("/", response_model=List[schemas.Shift])
def get_shifts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(require_read_access)):
    """Get all shifts"""
    return ShiftService.get_all(db, skip, limit)

@router.get("/{shift_id}/", response_model=schemas.Shift)
def get_shift(shift_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_read_access)):
    """Get a specific shift by ID"""
    shift = ShiftService.get_by_id(db, shift_id)
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    return shift

@router.put("/{shift_id}/", response_model=schemas.Shift)
def update_shift(shift_id: int, shift: schemas.ShiftCreate, db: Session = Depends(get_db), current_user: User = Depends(require_write_access)):
    """Update a shift"""
    updated = ShiftService.update(db, shift_id, shift)
    if not updated:
        raise HTTPException(status_code=404, detail="Shift not found")
    return updated

@router.delete("/{shift_id}/")
def delete_shift(shift_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_write_access)):
    """Delete a shift"""
    deleted = ShiftService.delete(db, shift_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Shift not found")
    return {"message": "Shift deleted successfully"}
