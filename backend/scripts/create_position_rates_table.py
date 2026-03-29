import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import engine, Base
from app.models.models import PositionRate

def create_position_rates_table():
    """Create the position_rates table"""
    print("Creating position_rates table...")
    
    # Create all tables (will only create if they don't exist)
    Base.metadata.create_all(bind=engine)
    
    print("✓ position_rates table created successfully!")

if __name__ == "__main__":
    create_position_rates_table()
