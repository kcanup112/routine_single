"""
Migration Script: Assign Default Shifts to Existing Classes
============================================================

This script assigns a default shift to all existing classes that don't have one.
It also creates a default shift if none exists in the tenant.

Usage:
    python scripts/assign_default_shifts_to_classes.py

What it does:
1. Connects to all tenant schemas
2. For each tenant:
   - Checks if a default shift exists
   - If not, creates "Morning Shift" (7:00 AM - 3:00 PM, 50-min periods)
   - Auto-generates periods for the shift
   - Assigns this shift to all classes without shift_id
3. Reports statistics

IMPORTANT: Run this after implementing the auto-period generation feature
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from datetime import time
from app.core.config_saas import settings
from app.models import models
from app.services.crud import ShiftService
from app.schemas import schemas

def get_all_tenant_schemas(db):
    """Get list of all tenant schema names"""
    from app.models import models_saas
    tenants = db.query(models_saas.Tenant).filter(
        models_saas.Tenant.deleted_at.is_(None),
        models_saas.Tenant.status.in_(['active', 'trial'])
    ).all()
    return [(t.schema_name, t.name) for t in tenants]

def assign_default_shift_to_tenant(schema_name, tenant_name, db):
    """Assign default shift to classes in a tenant schema"""
    print(f"\n{'='*60}")
    print(f"Processing tenant: {tenant_name} (schema: {schema_name})")
    print(f"{'='*60}")
    
    # Set search path to tenant schema
    db.execute(text(f'SET search_path TO "{schema_name}"'))
    
    # Check if default shift exists
    default_shift = db.query(models.Shift).filter(
        models.Shift.is_default == True,
        models.Shift.deleted_at.is_(None)
    ).first()
    
    if not default_shift:
        print("  ⚙️  No default shift found. Creating 'Morning Shift'...")
        
        # Create default shift with auto-period generation
        shift_data = schemas.ShiftCreate(
            name="Morning Shift",
            description="Default morning shift for classes",
            start_time=time(7, 0),
            end_time=time(15, 0),
            working_days=[0, 1, 2, 3, 4, 5],  # Sunday to Friday
            period_duration=50,
            break_after_periods=[2, 4],
            break_durations=[15, 60],
            is_active=True,
            is_default=True
        )
        
        default_shift = ShiftService.create(db, shift_data)
        
        # Count auto-generated periods
        period_count = db.query(models.Period).filter(
            models.Period.shift_id == default_shift.id
        ).count()
        
        print(f"  ✅ Created shift '{default_shift.name}' (ID: {default_shift.id})")
        print(f"  ✅ Auto-generated {period_count} periods")
    else:
        print(f"  ✓ Default shift already exists: '{default_shift.name}' (ID: {default_shift.id})")
    
    # Find classes without shift
    classes_without_shift = db.query(models.Class).filter(
        models.Class.shift_id.is_(None),
        models.Class.deleted_at.is_(None)
    ).all()
    
    if not classes_without_shift:
        print("  ✓ All classes already have shifts assigned")
        return {
            'schema': schema_name,
            'tenant': tenant_name,
            'shift_created': default_shift.id if 'shift_data' in locals() else None,
            'classes_updated': 0,
            'status': 'no_changes_needed'
        }
    
    print(f"  📋 Found {len(classes_without_shift)} classes without shift")
    
    # Assign default shift to classes
    for cls in classes_without_shift:
        cls.shift_id = default_shift.id
        print(f"    - {cls.name} (ID: {cls.id})")
    
    db.commit()
    
    print(f"  ✅ Assigned shift to {len(classes_without_shift)} classes")
    
    return {
        'schema': schema_name,
        'tenant': tenant_name,
        'shift_id': default_shift.id,
        'shift_name': default_shift.name,
        'classes_updated': len(classes_without_shift),
        'status': 'success'
    }

def main():
    """Main migration function"""
    print("\n" + "="*60)
    print("  MIGRATION: Assign Default Shifts to Classes")
    print("="*60)
    print("\nThis script will:")
    print("  1. Check all active tenants")
    print("  2. Create default shift if missing (with auto-generated periods)")
    print("  3. Assign shift to classes without one")
    print("\n" + "="*60 + "\n")
    
    # Confirm before proceeding
    confirm = input("Proceed with migration? (yes/no): ").strip().lower()
    if confirm != 'yes':
        print("\n❌ Migration cancelled by user")
        return
    
    # Create database connection
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        # Get all tenant schemas
        print("\n📊 Fetching tenant list...")
        tenant_schemas = get_all_tenant_schemas(db)
        print(f"   Found {len(tenant_schemas)} active tenants\n")
        
        # Track results
        results = []
        
        # Process each tenant
        for schema_name, tenant_name in tenant_schemas:
            try:
                result = assign_default_shift_to_tenant(schema_name, tenant_name, db)
                results.append(result)
            except Exception as e:
                print(f"  ❌ Error processing {tenant_name}: {str(e)}")
                results.append({
                    'schema': schema_name,
                    'tenant': tenant_name,
                    'status': 'error',
                    'error': str(e)
                })
                db.rollback()
        
        # Print summary
        print("\n" + "="*60)
        print("  MIGRATION SUMMARY")
        print("="*60)
        
        total_tenants = len(results)
        successful = len([r for r in results if r['status'] == 'success'])
        no_changes = len([r for r in results if r['status'] == 'no_changes_needed'])
        errors = len([r for r in results if r['status'] == 'error'])
        total_classes_updated = sum(r.get('classes_updated', 0) for r in results)
        
        print(f"\nTenants processed: {total_tenants}")
        print(f"  ✅ Successful: {successful}")
        print(f"  ✓  No changes needed: {no_changes}")
        print(f"  ❌ Errors: {errors}")
        print(f"\nTotal classes updated: {total_classes_updated}")
        
        # Show detailed results
        print("\n" + "-"*60)
        print("Detailed Results:")
        print("-"*60)
        for r in results:
            status_icon = '✅' if r['status'] == 'success' else '✓' if r['status'] == 'no_changes_needed' else '❌'
            print(f"{status_icon} {r['tenant']} ({r['schema']}): ", end='')
            if r['status'] == 'success':
                print(f"{r['classes_updated']} classes updated")
            elif r['status'] == 'no_changes_needed':
                print("All classes already have shifts")
            else:
                print(f"Error - {r.get('error', 'Unknown error')}")
        
        print("\n" + "="*60)
        print("✅ Migration completed!")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
