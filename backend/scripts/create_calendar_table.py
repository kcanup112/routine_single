from app.core.database import engine, Base
from app.models.models import CalendarEvent

def create_calendar_table():
    print("Creating calendar_events table...")
    CalendarEvent.__table__.create(bind=engine, checkfirst=True)
    print("Calendar table created successfully!")

if __name__ == "__main__":
    create_calendar_table()
