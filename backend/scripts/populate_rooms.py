"""
Script to populate rooms in the database
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import SessionLocal
from app.models.models import Room

def populate_rooms():
    db = SessionLocal()
    
    # List of rooms
    rooms = [
        # Building A - Floor 1
        "A-101", "A-102", "A-103", "A-104", "A-105", "A-106", "A-107",
        # Building A - Floor 2
        "A-201", "A-202", "A-203", "A-204", "A-205", "A-206", "A-207",
        # Building A - Floor 3
        "A-301", "A-302", "A-303", "A-304", "A-305", "A-306", "A-307",
        # Building B - Floor 2
        "B-201", "B-202", "B-203", "B-204", "B-205", "B-206", "B-207",
        # Building B - Floor 3
        "B-301", "B-302", "B-303", "B-304", "B-305", "B-306", "B-307",
    ]
    
    try:
        added_count = 0
        for room_number in rooms:
            # Check if room already exists
            existing = db.query(Room).filter(Room.room_number == room_number).first()
            if not existing:
                building = room_number.split("-")[0]  # Extract building (A or B)
                room = Room(
                    room_number=room_number,
                    building=f"Building {building}",
                    capacity=40  # Default capacity
                )
                db.add(room)
                added_count += 1
                print(f"✓ Added room: {room_number}")
            else:
                print(f"- Room {room_number} already exists")
        
        db.commit()
        print(f"\n✅ Successfully added {added_count} rooms to the database!")
        print(f"Total rooms in database: {db.query(Room).count()}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    populate_rooms()
