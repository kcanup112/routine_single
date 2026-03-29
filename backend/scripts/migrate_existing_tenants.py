"""
Migration Script: Add Default Data to Existing Tenants
Backfills days, shifts, and periods for tenants created before auto-seeding was implemented
"""
import sys
from pathlib import Path

# Add the parent directory to the path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import text
from app.core.database_saas import SessionLocal
from app.models.models_saas import Tenant
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def check_and_populate_schema(schema_name: str, db) -> dict:
    """
    Check if schema has default data and populate if missing
    Returns: dict with counts of created records
    """
    results = {
        "schema": schema_name,
        "days_added": 0,
        "shifts_added": 0,
        "periods_added": 0,
        "already_populated": False
    }
    
    try:
        # Check if days exist
        day_count_query = text(f'SELECT COUNT(*) FROM "{schema_name}".days')
        day_count = db.execute(day_count_query).scalar()
        
        if day_count >= 7:
            logger.info(f"✓ {schema_name}: Already has {day_count} days, skipping...")
            results["already_populated"] = True
            return results
        
        logger.info(f"⚙ {schema_name}: Populating default data...")
        
        # Insert days if missing
        if day_count == 0:
            days_insert = text(f"""
                INSERT INTO "{schema_name}".days (name, day_number, is_working_day) VALUES 
                ('Sunday', 0, true), ('Monday', 1, true), ('Tuesday', 2, true), 
                ('Wednesday', 3, true), ('Thursday', 4, true), ('Friday', 5, true), 
                ('Saturday', 6, false) 
                ON CONFLICT (day_number) DO NOTHING
                RETURNING id
            """)
            result = db.execute(days_insert)
            results["days_added"] = len(result.fetchall())
            db.commit()
            logger.info(f"  ✓ Added {results['days_added']} days")
        
        # Check and create shift
        shift_count_query = text(f'SELECT COUNT(*) FROM "{schema_name}".shifts')
        shift_count = db.execute(shift_count_query).scalar()
        
        if shift_count == 0:
            shift_insert = text(f"""
                INSERT INTO "{schema_name}".shifts 
                (name, description, start_time, end_time, working_days, period_duration, 
                 break_after_periods, break_durations, is_active, is_default) 
                VALUES ('Morning Shift', 'Default morning shift', '07:00:00', '15:30:00', 
                        '{{0,1,2,3,4,5}}', 50, '{{2,4}}', '{{15,60}}', true, true) 
                RETURNING id
            """)
            shift_result = db.execute(shift_insert)
            shift_id = shift_result.fetchone()[0]
            results["shifts_added"] = 1
            db.commit()
            logger.info(f"  ✓ Added shift (ID: {shift_id})")
        else:
            # Get existing shift ID
            shift_id_query = text(f'SELECT id FROM "{schema_name}".shifts ORDER BY id LIMIT 1')
            shift_id = db.execute(shift_id_query).scalar()
            logger.info(f"  ✓ Using existing shift (ID: {shift_id})")
        
        # Check and create periods
        period_count_query = text(f'SELECT COUNT(*) FROM "{schema_name}".periods')
        period_count = db.execute(period_count_query).scalar()
        
        if period_count == 0:
            # Generate 10 periods (7:00 AM - 3:30 PM, 50 min each)
            periods_data = []
            start_hour = 7
            period_duration = 50
            
            for i in range(1, 11):
                total_minutes = (i - 1) * period_duration
                current_start_hour = start_hour + (total_minutes // 60)
                current_start_minute = total_minutes % 60
                
                total_end_minutes = i * period_duration
                current_end_hour = start_hour + (total_end_minutes // 60)
                current_end_minute = total_end_minutes % 60
                
                start_time = f"{current_start_hour:02d}:{current_start_minute:02d}:00"
                end_time = f"{current_end_hour:02d}:{current_end_minute:02d}:00"
                
                suffix = "st" if i == 1 else "nd" if i == 2 else "rd" if i == 3 else "th"
                period_name = f"{i}{suffix} Period"
                
                periods_data.append(
                    f"({shift_id}, {i}, '{period_name}', '{start_time}', '{end_time}', 'teaching', true, true)"
                )
            
            periods_insert = text(f"""
                INSERT INTO "{schema_name}".periods 
                (shift_id, period_number, name, start_time, end_time, type, is_teaching_period, is_active) 
                VALUES {', '.join(periods_data)}
            """)
            db.execute(periods_insert)
            results["periods_added"] = 10
            db.commit()
            logger.info(f"  ✓ Added {results['periods_added']} periods")
        
        logger.info(f"✓ {schema_name}: Migration complete!")
        return results
        
    except Exception as e:
        logger.error(f"✗ {schema_name}: Error - {str(e)}")
        db.rollback()
        results["error"] = str(e)
        return results


def migrate_all_tenants():
    """Migrate all existing tenants"""
    db = SessionLocal()
    
    try:
        # Get all active tenants
        tenants = db.query(Tenant).filter(
            Tenant.deleted_at.is_(None),
            Tenant.status.in_(['active', 'trial'])
        ).all()
        
        logger.info(f"\n{'='*60}")
        logger.info(f"Found {len(tenants)} tenants to check")
        logger.info(f"{'='*60}\n")
        
        migration_results = []
        
        for tenant in tenants:
            result = check_and_populate_schema(tenant.schema_name, db)
            migration_results.append(result)
        
        # Summary
        logger.info(f"\n{'='*60}")
        logger.info("MIGRATION SUMMARY")
        logger.info(f"{'='*60}")
        
        total_schemas = len(migration_results)
        already_populated = sum(1 for r in migration_results if r.get("already_populated"))
        migrated = sum(1 for r in migration_results if not r.get("already_populated") and not r.get("error"))
        errors = sum(1 for r in migration_results if r.get("error"))
        
        logger.info(f"Total schemas checked: {total_schemas}")
        logger.info(f"Already populated: {already_populated}")
        logger.info(f"Successfully migrated: {migrated}")
        logger.info(f"Errors: {errors}")
        
        if migrated > 0:
            total_days = sum(r.get("days_added", 0) for r in migration_results)
            total_shifts = sum(r.get("shifts_added", 0) for r in migration_results)
            total_periods = sum(r.get("periods_added", 0) for r in migration_results)
            
            logger.info(f"\nRecords created:")
            logger.info(f"  Days: {total_days}")
            logger.info(f"  Shifts: {total_shifts}")
            logger.info(f"  Periods: {total_periods}")
        
        if errors > 0:
            logger.info(f"\n⚠ Errors encountered in {errors} schema(s):")
            for r in migration_results:
                if r.get("error"):
                    logger.info(f"  - {r['schema']}: {r['error']}")
        
        logger.info(f"{'='*60}\n")
        
    except Exception as e:
        logger.error(f"Migration failed: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    print("\n" + "="*60)
    print("TENANT DEFAULT DATA MIGRATION")
    print("="*60)
    print("This script will add default days, shifts, and periods")
    print("to existing tenant schemas that don't have them yet.")
    print("="*60 + "\n")
    
    response = input("Do you want to proceed? (yes/no): ").strip().lower()
    
    if response in ['yes', 'y']:
        migrate_all_tenants()
    else:
        print("Migration cancelled.")
