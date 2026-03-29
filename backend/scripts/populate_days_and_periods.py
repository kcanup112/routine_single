import sys
from pathlib import Path

# Add the parent directory to the path to import app modules
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models import models
from datetime import time

def populate_days():
    """Populate days table with Sunday to Thursday"""
    db = SessionLocal()
    try:
        # Check if days already exist
        existing_days = db.query(models.Day).count()
        if existing_days > 0:
            print(f"Days table already has {existing_days} entries. Skipping day population.")
            return
        
        days = [
            {"name": "Sunday", "order": 1},
            {"name": "Monday", "order": 2},
            {"name": "Tuesday", "order": 3},
            {"name": "Wednesday", "order": 4},
            {"name": "Thursday", "order": 5},
        ]
        
        for day_data in days:
            day = models.Day(**day_data)
            db.add(day)
        
        db.commit()
        print(f"✓ Successfully added {len(days)} days (Sunday to Thursday)")
        
    except Exception as e:
        print(f"Error populating days: {e}")
        db.rollback()
    finally:
        db.close()

def populate_periods():
    """Populate periods table with 10 periods of 50 minutes each, starting from 7:00 AM"""
    db = SessionLocal()
    try:
        # Clear existing periods
        existing_count = db.query(models.Period).count()
        if existing_count > 0:
            print(f"Clearing {existing_count} existing periods...")
            db.query(models.Period).delete()
            db.commit()
        
        # Starting time: 7:00 AM
        start_hour = 7
        start_minute = 0
        period_duration = 50  # minutes
        
        periods = []
        
        for i in range(1, 11):  # 10 periods
            # Calculate start and end times
            current_start_hour = start_hour + ((start_minute + (i - 1) * period_duration) // 60)
            current_start_minute = (start_minute + (i - 1) * period_duration) % 60
            
            current_end_hour = start_hour + ((start_minute + i * period_duration) // 60)
            current_end_minute = (start_minute + i * period_duration) % 60
            
            start_time_obj = time(current_start_hour, current_start_minute, 0)
            end_time_obj = time(current_end_hour, current_end_minute, 0)
            
            # Format for display
            start_time_str = start_time_obj.strftime("%H:%M")
            end_time_str = end_time_obj.strftime("%H:%M")
            
            # Determine suffix for period name
            if i == 1:
                suffix = "st"
            elif i == 2:
                suffix = "nd"
            elif i == 3:
                suffix = "rd"
            else:
                suffix = "th"
            
            period_data = {
                "name": f"{i}{suffix} Period",
                "start_time": start_time_obj,
                "end_time": end_time_obj,
                "order": i
            }
            
            period = models.Period(**period_data)
            db.add(period)
            periods.append(f"{period_data['name']}: {start_time_str} - {end_time_str}")
        
        db.commit()
        print(f"✓ Successfully added {len(periods)} periods:")
        for period_info in periods:
            print(f"  - {period_info}")
        
    except Exception as e:
        print(f"Error populating periods: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Starting population of Days and Periods...")
    print("-" * 50)
    
    # Create tables if they don't exist
    models.Base.metadata.create_all(bind=engine)
    
    # Populate days
    populate_days()
    
    # Populate periods
    populate_periods()
    
    print("-" * 50)
    print("Population complete!")
