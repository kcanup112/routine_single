"""
Create default shift and auto-generate periods for KEC tenant
"""
import sys
import os
from datetime import time, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database_saas import SessionLocal, set_tenant_context
from sqlalchemy import text

def create_default_shift():
    """
    Create default day shift for KEC and auto-generate periods
    """
    db = SessionLocal()
    
    try:
        # Set tenant context to KEC schema
        set_tenant_context(db, 'kec')
        
        # Create default shift
        shift_query = text("""
            INSERT INTO shifts (
                name, description, start_time, end_time,
                working_days, period_duration, break_after_periods, break_durations,
                is_active, is_default
            ) VALUES (
                'Day Shift', 'Regular day shift for all classes',
                '07:00:00', '16:00:00',
                ARRAY[0,1,2,3,4,5], 50, ARRAY[2,4], ARRAY[15,60],
                true, true
            ) RETURNING id, name, start_time, end_time, period_duration
        """)
        
        result = db.execute(shift_query).fetchone()
        shift_id = result[0]
        shift_name = result[1]
        start_time_obj = result[2]
        end_time_obj = result[3]
        period_duration = result[4]
        
        print(f"✓ Created shift: {shift_name}")
        print(f"  Timing: {start_time_obj} - {end_time_obj}")
        print(f"  Period duration: {period_duration} minutes")
        
        # Auto-generate periods
        print("\n  Generating periods...")
        
        # Convert to datetime for calculation
        current_time = start_time_obj
        period_number = 1
        periods_created = 0
        
        # Define breaks (after period 2: 15min, after period 4: 60min lunch)
        break_schedule = {
            2: ('Morning Break', 15),
            4: ('Lunch Break', 60)
        }
        
        # Generate periods until end time
        while True:
            # Calculate period end time
            period_end = (timedelta(hours=current_time.hour, minutes=current_time.minute) + 
                         timedelta(minutes=period_duration))
            period_end_hours = int(period_end.total_seconds() // 3600)
            period_end_minutes = int((period_end.total_seconds() % 3600) // 60)
            
            # Check if we've reached end time
            if period_end_hours > end_time_obj.hour or \
               (period_end_hours == end_time_obj.hour and period_end_minutes > end_time_obj.minute):
                break
            
            # Insert teaching period
            period_insert = text("""
                INSERT INTO periods (
                    shift_id, period_number, name, start_time, end_time,
                    type, is_teaching_period, is_active
                ) VALUES (
                    :shift_id, :period_number, :name, :start_time, :end_time,
                    'teaching', true, true
                )
            """)
            
            db.execute(period_insert, {
                'shift_id': shift_id,
                'period_number': period_number,
                'name': f'Period {period_number}',
                'start_time': current_time,
                'end_time': time(period_end_hours, period_end_minutes)
            })
            periods_created += 1
            
            print(f"    Period {period_number}: {current_time.strftime('%H:%M')} - {period_end_hours:02d}:{period_end_minutes:02d}")
            
            # Move current time to period end
            current_time = time(period_end_hours, period_end_minutes)
            
            # Check if there's a break after this period
            if period_number in break_schedule:
                break_name, break_minutes = break_schedule[period_number]
                
                # Calculate break end time
                break_end = (timedelta(hours=current_time.hour, minutes=current_time.minute) + 
                           timedelta(minutes=break_minutes))
                break_end_hours = int(break_end.total_seconds() // 3600)
                break_end_minutes = int((break_end.total_seconds() % 3600) // 60)
                
                # Insert break period
                period_number += 1
                break_insert = text("""
                    INSERT INTO periods (
                        shift_id, period_number, name, start_time, end_time,
                        type, is_teaching_period, is_active
                    ) VALUES (
                        :shift_id, :period_number, :name, :start_time, :end_time,
                        :type, false, true
                    )
                """)
                
                break_type = 'lunch' if break_minutes >= 60 else 'break'
                
                db.execute(break_insert, {
                    'shift_id': shift_id,
                    'period_number': period_number,
                    'name': break_name,
                    'start_time': current_time,
                    'end_time': time(break_end_hours, break_end_minutes),
                    'type': break_type
                })
                
                print(f"    {break_name}: {current_time.strftime('%H:%M')} - {break_end_hours:02d}:{break_end_minutes:02d}")
                
                # Move current time to break end
                current_time = time(break_end_hours, break_end_minutes)
            
            period_number += 1
        
        db.commit()
        
        print(f"\n✓ Successfully created {periods_created} teaching periods")
        print(f"✓ Total periods (including breaks): {period_number - 1}")
        
        # Query and display all periods
        print("\n  Final Period Schedule:")
        periods_query = text("""
            SELECT period_number, name, start_time, end_time, type, is_teaching_period
            FROM periods WHERE shift_id = :shift_id ORDER BY period_number
        """)
        periods = db.execute(periods_query, {'shift_id': shift_id}).fetchall()
        
        for p in periods:
            period_type = "📚 Teaching" if p[5] else "☕ Break"
            print(f"    {p[1]:20s} {p[2].strftime('%H:%M')} - {p[3].strftime('%H:%M')}  {period_type}")
        
    except Exception as e:
        db.rollback()
        print(f"Error creating shift: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_default_shift()
