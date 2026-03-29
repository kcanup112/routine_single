import csv
import sys
import os

# Add the parent directory to the path to import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal
from app.models.models import Subject

def import_subjects_from_csv(csv_file_path):
    """Import subjects from CSV file into the database"""
    db = SessionLocal()
    
    try:
        with open(csv_file_path, 'r', encoding='utf-8') as file:
            csv_reader = csv.DictReader(file)
            
            imported_count = 0
            skipped_count = 0
            error_count = 0
            
            for row in csv_reader:
                subject_name = row['Subject Name'].strip()
                subject_code = row['Subject Code Extracted'].strip()
                has_practical = row['Has Practical'].strip().lower() == 'yes'
                
                # Check if subject already exists
                existing_subject = db.query(Subject).filter(
                    Subject.code == subject_code
                ).first()
                
                if existing_subject:
                    print(f"Skipping '{subject_name}' - Code '{subject_code}' already exists")
                    skipped_count += 1
                    continue
                
                try:
                    # Create new subject
                    new_subject = Subject(
                        name=subject_name,
                        code=subject_code,
                        is_lab=has_practical,
                        credit_hours=3  # Default credit hours
                    )
                    
                    db.add(new_subject)
                    db.commit()  # Commit after each insert
                    print(f"Added: {subject_name} ({subject_code}) - Lab: {has_practical}")
                    imported_count += 1
                except Exception as e:
                    db.rollback()
                    print(f"Error adding '{subject_name}' ({subject_code}): {e}")
                    error_count += 1
            
            print(f"\n{'='*60}")
            print(f"Import Complete!")
            print(f"Total imported: {imported_count}")
            print(f"Total skipped: {skipped_count}")
            print(f"Total errors: {error_count}")
            print(f"{'='*60}")
            
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    csv_file = r"c:\Users\Anup kc\Downloads\subject_separated.csv"
    
    if not os.path.exists(csv_file):
        print(f"Error: CSV file not found at {csv_file}")
        sys.exit(1)
    
    print("Starting subject import...")
    print(f"Reading from: {csv_file}\n")
    
    import_subjects_from_csv(csv_file)
