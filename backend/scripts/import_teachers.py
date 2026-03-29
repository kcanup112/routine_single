import sys
import csv
from pathlib import Path

# Add the parent directory to the path to import app modules
sys.path.append(str(Path(__file__).parent.parent))

from app.core.database import SessionLocal
from app.models.models import Teacher

def import_teachers_from_csv(csv_file_path):
    db = SessionLocal()
    
    imported_count = 0
    skipped_count = 0
    error_count = 0
    
    try:
        with open(csv_file_path, 'r', encoding='utf-8') as file:
            csv_reader = csv.DictReader(file)
            
            for row in csv_reader:
                try:
                    # Extract teacher name and abbreviation from the "Teacher" column
                    # Format: "Name (Abb)"
                    teacher_full = row['Teacher'].strip()
                    
                    # Parse name and abbreviation
                    if '(' in teacher_full and ')' in teacher_full:
                        name = teacher_full.split('(')[0].strip()
                        abbreviation = teacher_full.split('(')[1].split(')')[0].strip()
                    else:
                        print(f"Skipping invalid format: {teacher_full}")
                        skipped_count += 1
                        continue
                    
                    # Get contact number (phone)
                    phone = row['Contact No.'].strip() if row['Contact No.'].strip() else None
                    
                    # Get email
                    email = row['E-mail id'].strip() if row['E-mail id'].strip() else None
                    
                    # Get recruitment type
                    recruitment = row['Recruitment'].strip()
                    
                    # Check if teacher with same abbreviation already exists
                    existing_teacher = db.query(Teacher).filter(Teacher.abbreviation == abbreviation).first()
                    if existing_teacher:
                        print(f"Skipping '{name}' - Abbreviation '{abbreviation}' already exists")
                        skipped_count += 1
                        continue
                    
                    # Create new teacher
                    new_teacher = Teacher(
                        name=name,
                        abbreviation=abbreviation,
                        email=email,
                        phone=phone,
                        recruitment=recruitment,
                        department_id=None  # Can be assigned later
                    )
                    
                    db.add(new_teacher)
                    db.commit()
                    
                    print(f"Added: {name} ({abbreviation}) - {recruitment}")
                    imported_count += 1
                    
                except Exception as e:
                    print(f"Error processing row {row.get('Teacher', 'Unknown')}: {str(e)}")
                    error_count += 1
                    db.rollback()
                    continue
        
        print("\n" + "="*60)
        print("Import Complete!")
        print(f"Total imported: {imported_count}")
        print(f"Total skipped: {skipped_count}")
        print(f"Total errors: {error_count}")
        print("="*60)
        
    except FileNotFoundError:
        print(f"Error: File not found at {csv_file_path}")
    except Exception as e:
        print(f"Error: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    # Update this path to your CSV file location
    csv_path = r"C:\Users\Anup kc\Documents\teacher.csv"
    import_teachers_from_csv(csv_path)
