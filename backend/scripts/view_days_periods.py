import sys
from pathlib import Path

# Add the parent directory to the path to import app modules
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import SessionLocal
from app.models import models

def view_current_data():
    """View current days and periods in the database"""
    db = SessionLocal()
    try:
        print("Current Days:")
        print("-" * 50)
        days = db.query(models.Day).order_by(models.Day.order).all()
        if days:
            for day in days:
                print(f"  Order {day.order}: {day.name}")
        else:
            print("  No days found")
        
        print("\nCurrent Periods:")
        print("-" * 50)
        periods = db.query(models.Period).order_by(models.Period.order).all()
        if periods:
            for period in periods:
                print(f"  Order {period.order}: {period.name} ({period.start_time} - {period.end_time})")
        else:
            print("  No periods found")
        
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    view_current_data()
