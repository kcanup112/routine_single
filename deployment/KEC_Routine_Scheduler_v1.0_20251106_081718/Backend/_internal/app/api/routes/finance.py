from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas.schemas import (
    PositionRateCreate, 
    PositionRateResponse,
    TeacherEffectiveLoadCreate,
    TeacherEffectiveLoadResponse
)
from app.services import crud
from app.models import models

router = APIRouter()

@router.get("/position-rates", response_model=List[PositionRateResponse])
def get_position_rates(db: Session = Depends(get_db)):
    """Get all position rates"""
    return crud.get_position_rates(db)

@router.post("/position-rates", response_model=List[PositionRateResponse])
def create_or_update_position_rates(
    rates: List[PositionRateCreate],
    db: Session = Depends(get_db)
):
    """Create or update position rates"""
    return crud.create_or_update_position_rates(db, rates)

@router.get("/position-rates/{position}")
def get_position_rate(position: str, db: Session = Depends(get_db)):
    """Get rate for a specific position"""
    rate = crud.get_position_rate_by_position(db, position)
    if not rate:
        raise HTTPException(status_code=404, detail="Position rate not found")
    return rate

@router.delete("/position-rates/{position}")
def delete_position_rate_endpoint(position: str, db: Session = Depends(get_db)):
    """Delete a position rate"""
    success = crud.delete_position_rate(db, position)
    if not success:
        raise HTTPException(status_code=404, detail="Position rate not found")
    return {"message": "Position rate deleted successfully"}

# Teacher Effective Load Routes
@router.get("/effective-loads", response_model=List[TeacherEffectiveLoadResponse])
def get_effective_loads_endpoint(db: Session = Depends(get_db)):
    """Get all teacher effective loads"""
    return crud.get_effective_loads(db)

@router.post("/effective-loads", response_model=List[TeacherEffectiveLoadResponse])
def create_or_update_effective_loads_endpoint(
    loads: List[TeacherEffectiveLoadCreate],
    db: Session = Depends(get_db)
):
    """Create or update teacher effective loads"""
    # Validate that all teachers exist
    for load in loads:
        teacher = db.query(models.Teacher).filter(models.Teacher.id == load.teacher_id).first()
        if not teacher:
            raise HTTPException(
                status_code=404, 
                detail=f"Teacher with id {load.teacher_id} not found"
            )
    
    return crud.create_or_update_effective_loads(db, loads)

@router.get("/effective-loads/{teacher_id}", response_model=TeacherEffectiveLoadResponse)
def get_effective_load_by_teacher_endpoint(teacher_id: int, db: Session = Depends(get_db)):
    """Get effective load for a specific teacher"""
    load = crud.get_effective_load_by_teacher(db, teacher_id)
    if not load:
        raise HTTPException(status_code=404, detail="Teacher effective load not found")
    return load

@router.delete("/effective-loads/{teacher_id}")
def delete_effective_load_endpoint(teacher_id: int, db: Session = Depends(get_db)):
    """Delete a teacher effective load"""
    success = crud.delete_effective_load(db, teacher_id)
    if not success:
        raise HTTPException(status_code=404, detail="Teacher effective load not found")
    return {"message": "Teacher effective load deleted successfully"}
