"""
Add description columns to tenant tables
Run this script to update all tenant schemas with missing description columns
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import text
from app.core.database_saas import get_db, engine

def add_description_columns():
    """Add description columns to tables that are missing them"""
    
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
    
    # Tables that need description column
    tables_to_update = [
        'departments',
        'programmes',
        'semesters',
        'subjects',
        'rooms',
        'periods'
    ]
    
    for schema in tenant_schemas:
        print(f"\nProcessing schema: {schema}")
        
        with engine.begin() as conn:
            # Set search path to tenant schema
            conn.execute(text(f"SET search_path TO {schema}"))
            
            for table in tables_to_update:
                # Check if table exists
                table_check = conn.execute(text(f"""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = '{schema}' 
                        AND table_name = '{table}'
                    )
                """))
                
                if not table_check.scalar():
                    print(f"  ⚠ Table {table} does not exist in {schema}, skipping...")
                    continue
                
                # Check if description column exists
                column_check = conn.execute(text(f"""
                    SELECT EXISTS (
                        SELECT FROM information_schema.columns 
                        WHERE table_schema = '{schema}' 
                        AND table_name = '{table}' 
                        AND column_name = 'description'
                    )
                """))
                
                if column_check.scalar():
                    print(f"  ✓ {table}.description already exists")
                else:
                    # Add description column
                    try:
                        conn.execute(text(f"""
                            ALTER TABLE {schema}.{table} 
                            ADD COLUMN description TEXT
                        """))
                        print(f"  ✅ Added {table}.description")
                    except Exception as e:
                        print(f"  ❌ Error adding {table}.description: {e}")
            
            # Reset search path
            conn.execute(text("SET search_path TO public"))
    
    print("\n" + "="*80)
    print("Migration complete!")
    print("="*80)

if __name__ == "__main__":
    add_description_columns()
