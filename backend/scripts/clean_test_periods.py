"""
Clean existing periods for testing shift creation
"""
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.models.models import Shift, Period
from app.core.config_saas import Settings

def clean_periods():
    # Create engine
    settings = Settings()
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        # Set schema
        db.execute(text("SET search_path TO kec_schema"))
        
        # Show existing shifts
        shifts = db.query(Shift).all()
        print('Existing shifts:')
        for s in shifts:
            period_count = db.query(Period).filter(Period.shift_id == s.id).count()
            print(f'  ID {s.id}: {s.name} ({s.start_time}-{s.end_time}) - {period_count} periods')
        
        # Delete all existing periods
        deleted = db.query(Period).delete()
        db.commit()
        print(f'\nDeleted {deleted} periods')
    finally:
        db.close()

if __name__ == '__main__':
    clean_periods()
