from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas import schemas
from app.services.crud import ProgrammeService

router = APIRouter(prefix="/programmes", tags=["programmes"])

@router.post("/", response_model=schemas.Programme)
def create_programme(programme: schemas.ProgrammeCreate, db: Session = Depends(get_db)):
    return ProgrammeService.create(db, programme)

@router.get("/", response_model=List[schemas.Programme])
def get_programmes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return ProgrammeService.get_all(db, skip, limit)

@router.get("/{programme_id}/", response_model=schemas.Programme)
def get_programme(programme_id: int, db: Session = Depends(get_db)):
    programme = ProgrammeService.get_by_id(db, programme_id)
    if not programme:
        raise HTTPException(status_code=404, detail="Programme not found")
    return programme

@router.get("/department/{department_id}/", response_model=List[schemas.Programme])
def get_programmes_by_department(department_id: int, db: Session = Depends(get_db)):
    return ProgrammeService.get_by_department(db, department_id)

@router.put("/{programme_id}/", response_model=schemas.Programme)
def update_programme(programme_id: int, programme: schemas.ProgrammeUpdate, db: Session = Depends(get_db)):
    updated = ProgrammeService.update(db, programme_id, programme)
    if not updated:
        raise HTTPException(status_code=404, detail="Programme not found")
    return updated

@router.delete("/{programme_id}/")
def delete_programme(programme_id: int, db: Session = Depends(get_db)):
    deleted = ProgrammeService.delete(db, programme_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Programme not found")
    return {"message": "Programme deleted successfully"}
