import sqlite3

conn = sqlite3.connect('kec_routine.db')
cursor = conn.cursor()
cursor.execute('PRAGMA table_info(class_routine_entries)')
columns = cursor.fetchall()
print('Columns in class_routine_entries:')
for col in columns:
    print(f'  {col[1]} ({col[2]})')
conn.close()
