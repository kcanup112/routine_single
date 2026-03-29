"""
Clear all data from all tenant schemas
This will delete all records from all tables while preserving the table structure
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import text
from app.core.database_saas import engine

def clear_all_tenant_data():
    """Clear all data from all tenant schemas"""
    
    # Get all tenant schemas
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name NOT IN ('public', 'information_schema', 'pg_catalog', 'pg_toast')
            AND schema_name NOT LIKE 'pg_%'
        """))
        tenant_schemas = [row[0] for row in result]
    
    print(f"Found {len(tenant_schemas)} tenant schemas")
    print("="*80)
    
    # Tables to clear (in order to respect foreign key constraints)
    tables_to_clear = [
        'class_routines',
        'schedules',
        'teacher_subjects',
        'semester_subjects',
        'classes',
        'semesters',
        'programmes',
        'teachers',
        'subjects',
        'rooms',
        'periods',
        'days',
        'shifts',
        'departments',
    ]
    
    total_deleted = 0
    
    for schema in tenant_schemas:
        print(f"\n📁 Processing schema: {schema}")
        
        # Handle schemas with special characters (like hyphens)
        quoted_schema = f'"{schema}"' if '-' in schema else schema
        
        with engine.begin() as conn:
            schema_deleted = 0
            
            # Disable foreign key checks temporarily
            conn.execute(text(f"SET CONSTRAINTS ALL DEFERRED"))
            
            for table in tables_to_clear:
                try:
                    # Check if table exists
                    table_check = conn.execute(text(f"""
                        SELECT EXISTS (
                            SELECT FROM information_schema.tables 
                            WHERE table_schema = '{schema}' 
                            AND table_name = '{table}'
                        )
                    """))
                    
                    if not table_check.scalar():
                        continue
                    
                    # Get count before deletion
                    count_result = conn.execute(text(f"SELECT COUNT(*) FROM {quoted_schema}.{table}"))
                    count = count_result.scalar()
                    
                    if count > 0:
                        # Delete all records
                        conn.execute(text(f"DELETE FROM {quoted_schema}.{table}"))
                        print(f"  ✅ Deleted {count} records from {table}")
                        schema_deleted += count
                    
                except Exception as e:
                    print(f"  ❌ Error clearing {table}: {e}")
            
            # Re-enable foreign key checks
            conn.execute(text(f"SET CONSTRAINTS ALL IMMEDIATE"))
            
            total_deleted += schema_deleted
            print(f"  📊 Total deleted from {schema}: {schema_deleted} records")
    
    print("\n" + "="*80)
    print(f"✅ COMPLETE! Total records deleted: {total_deleted}")
    print("="*80)

if __name__ == "__main__":
    # Auto-confirm for scripted execution
    clear_all_tenant_data()
