from pydantic import BaseModel, Field
from datetime import date, time, datetime
from typing import Optional

class CalendarEventBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    start_date: date
    end_date: date
    event_type: str = Field(..., pattern='^(holiday|exam|event|deadline|meeting|other|welcome_farewell|orientation|sports|tour|class_test|conference|exhibition)$')
    is_all_day: bool = True
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    location: Optional[str] = None
    status: Optional[str] = 'scheduled'
    class_id: Optional[int] = None
    teacher_id: Optional[int] = None

class CalendarEventCreate(CalendarEventBase):
    pass

class CalendarEventUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    event_type: Optional[str] = Field(None, pattern='^(holiday|exam|event|deadline|meeting|other|welcome_farewell|orientation|sports|tour|class_test|conference|exhibition)$')
    is_all_day: Optional[bool] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    location: Optional[str] = None
    status: Optional[str] = None
    class_id: Optional[int] = None
    teacher_id: Optional[int] = None

class CalendarEvent(CalendarEventBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
