from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database_saas import get_db
from app.schemas import schemas
from app.services.crud import RoomService
from app.auth.dependencies import require_read_access, require_write_access
from app.models.models_saas import User

router = APIRouter(prefix="/rooms", tags=["rooms"])

@router.post("/", response_model=schemas.Room)
def create_room(room: schemas.RoomCreate, db: Session = Depends(get_db), current_user: User = Depends(require_write_access)):
    return RoomService.create(db, room)

@router.get("/", response_model=List[schemas.Room])
def get_rooms(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(require_read_access)):
    return RoomService.get_all(db, skip, limit)

@router.get("/{room_id}", response_model=schemas.Room)
def get_room(room_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_read_access)):
    room = RoomService.get_by_id(db, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

@router.put("/{room_id}", response_model=schemas.Room)
def update_room(room_id: int, room: schemas.RoomUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_write_access)):
    updated = RoomService.update(db, room_id, room)
    if not updated:
        raise HTTPException(status_code=404, detail="Room not found")
    return updated

@router.delete("/{room_id}/")
def delete_room(room_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_write_access)):
    deleted = RoomService.delete(db, room_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Room not found")
    return {"message": "Room deleted successfully"}
