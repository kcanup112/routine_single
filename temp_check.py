import sys
sys.path.insert(0, '.')
from app.core.database_saas import SessionLocal
from sqlalchemy import text
db = SessionLocal()
try:
    result = db.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='testschool'"))
    tables = [row[0] for row in result]
    print('Tables in testschool schema:', tables)
    
    # Check departments with null code
    result2 = db.execute(text("SELECT id, name, code FROM testschool.departments LIMIT 10"))
    rows = list(result2)
    print('Departments:', rows)
except Exception as e:
    print('Error:', e)
finally:
    db.close()
