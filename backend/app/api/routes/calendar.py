from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from app.core.database_saas import get_db
from app.models.models import CalendarEvent
from app.models.models_saas import User
from app.schemas.calendar_schemas import CalendarEvent as CalendarEventSchema, CalendarEventCreate, CalendarEventUpdate
from app.auth.dependencies import get_current_user, get_admin_or_above

router = APIRouter()

# Public endpoint - anyone can view events
@router.get("/", response_model=List[CalendarEventSchema])
def get_calendar_events(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    event_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all calendar events, optionally filtered by date range and type"""
    query = db.query(CalendarEvent)
    
    if start_date:
        query = query.filter(CalendarEvent.start_date >= start_date)
    if end_date:
        query = query.filter(CalendarEvent.end_date <= end_date)
    if event_type:
        query = query.filter(CalendarEvent.event_type == event_type)
    
    return query.order_by(CalendarEvent.start_date).all()

@router.get("/{event_id}", response_model=CalendarEventSchema)
def get_calendar_event(
    event_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific calendar event by ID"""
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

# Admin only - create events
@router.post("/", response_model=CalendarEventSchema)
def create_calendar_event(
    event: CalendarEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_above)
):
    """Create a new calendar event (admin only)"""
    db_event = CalendarEvent(**event.dict())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

# Admin only - update events
@router.put("/{event_id}", response_model=CalendarEventSchema)
def update_calendar_event(
    event_id: int,
    event_update: CalendarEventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_above)
):
    """Update a calendar event (admin only)"""
    db_event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    update_data = event_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_event, field, value)
    
    db.commit()
    db.refresh(db_event)
    return db_event

# Admin only - delete events
@router.delete("/{event_id}")
def delete_calendar_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_or_above)
):
    """Delete a calendar event (admin only)"""
    db_event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    db.delete(db_event)
    db.commit()
    return {"message": "Event deleted successfully"}
