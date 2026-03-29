from sqlalchemy.orm import Session
from app.models import models
from app.schemas import schemas
from typing import List, Optional

class DepartmentService:
    @staticmethod
    def create(db: Session, department: schemas.DepartmentCreate):
        db_department = models.Department(**department.dict())
        db.add(db_department)
        db.commit()
        db.refresh(db_department)
        return db_department
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100):
        return db.query(models.Department).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_by_id(db: Session, department_id: int):
        return db.query(models.Department).filter(models.Department.id == department_id).first()
    
    @staticmethod
    def update(db: Session, department_id: int, department: schemas.DepartmentUpdate):
        db_department = db.query(models.Department).filter(models.Department.id == department_id).first()
        if db_department:
            update_data = department.dict(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_department, key, value)
            db.commit()
            db.refresh(db_department)
        return db_department
    
    @staticmethod
    def delete(db: Session, department_id: int):
        db_department = db.query(models.Department).filter(models.Department.id == department_id).first()
        if db_department:
            db.delete(db_department)
            db.commit()
        return db_department

class ProgrammeService:
    @staticmethod
    def create(db: Session, programme: schemas.ProgrammeCreate):
        db_programme = models.Programme(**programme.dict())
        db.add(db_programme)
        db.commit()
        db.refresh(db_programme)
        return db_programme
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100):
        return db.query(models.Programme).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_by_id(db: Session, programme_id: int):
        return db.query(models.Programme).filter(models.Programme.id == programme_id).first()
    
    @staticmethod
    def get_by_department(db: Session, department_id: int):
        return db.query(models.Programme).filter(models.Programme.department_id == department_id).all()
    
    @staticmethod
    def update(db: Session, programme_id: int, programme: schemas.ProgrammeUpdate):
        db_programme = db.query(models.Programme).filter(models.Programme.id == programme_id).first()
        if db_programme:
            update_data = programme.dict(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_programme, key, value)
            db.commit()
            db.refresh(db_programme)
        return db_programme
    
    @staticmethod
    def delete(db: Session, programme_id: int):
        db_programme = db.query(models.Programme).filter(models.Programme.id == programme_id).first()
        if db_programme:
            db.delete(db_programme)
            db.commit()
        return db_programme

class TeacherService:
    @staticmethod
    def create(db: Session, teacher: schemas.TeacherCreate):
        db_teacher = models.Teacher(**teacher.dict())
        db.add(db_teacher)
        db.commit()
        db.refresh(db_teacher)
        return db_teacher
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100):
        return db.query(models.Teacher).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_by_id(db: Session, teacher_id: int):
        return db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
    
    @staticmethod
    def get_by_department(db: Session, department_id: int):
        return db.query(models.Teacher).filter(models.Teacher.department_id == department_id).all()
    
    @staticmethod
    def update(db: Session, teacher_id: int, teacher: schemas.TeacherUpdate):
        db_teacher = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
        if db_teacher:
            update_data = teacher.dict(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_teacher, key, value)
            db.commit()
            db.refresh(db_teacher)
        return db_teacher
    
    @staticmethod
    def delete(db: Session, teacher_id: int):
        db_teacher = db.query(models.Teacher).filter(models.Teacher.id == teacher_id).first()
        if db_teacher:
            db.delete(db_teacher)
            db.commit()
        return db_teacher

class SubjectService:
    @staticmethod
    def create(db: Session, subject: schemas.SubjectCreate):
        db_subject = models.Subject(**subject.dict())
        db.add(db_subject)
        db.commit()
        db.refresh(db_subject)
        return db_subject
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100):
        return db.query(models.Subject).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_by_id(db: Session, subject_id: int):
        return db.query(models.Subject).filter(models.Subject.id == subject_id).first()
    
    @staticmethod
    def update(db: Session, subject_id: int, subject: schemas.SubjectUpdate):
        db_subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
        if db_subject:
            update_data = subject.dict(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_subject, key, value)
            db.commit()
            db.refresh(db_subject)
        return db_subject
    
    @staticmethod
    def delete(db: Session, subject_id: int):
        db_subject = db.query(models.Subject).filter(models.Subject.id == subject_id).first()
        if db_subject:
            db.delete(db_subject)
            db.commit()
        return db_subject

class ClassService:
    @staticmethod
    def create(db: Session, class_: schemas.ClassCreate):
        db_class = models.Class(**class_.dict())
        db.add(db_class)
        db.commit()
        db.refresh(db_class)
        return db_class
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100):
        return db.query(models.Class).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_by_id(db: Session, class_id: int):
        return db.query(models.Class).filter(models.Class.id == class_id).first()
    
    @staticmethod
    def get_by_semester(db: Session, semester_id: int):
        return db.query(models.Class).filter(models.Class.semester_id == semester_id).all()
    
    @staticmethod
    def update(db: Session, class_id: int, class_: schemas.ClassUpdate):
        db_class = db.query(models.Class).filter(models.Class.id == class_id).first()
        if db_class:
            update_data = class_.dict(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_class, key, value)
            db.commit()
            db.refresh(db_class)
        return db_class
    
    @staticmethod
    def delete(db: Session, class_id: int):
        db_class = db.query(models.Class).filter(models.Class.id == class_id).first()
        if db_class:
            db.delete(db_class)
            db.commit()
        return db_class

class SemesterService:
    @staticmethod
    def create(db: Session, semester: schemas.SemesterCreate):
        db_semester = models.Semester(**semester.dict())
        db.add(db_semester)
        db.commit()
        db.refresh(db_semester)
        return db_semester
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100):
        return db.query(models.Semester).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_by_id(db: Session, semester_id: int):
        return db.query(models.Semester).filter(models.Semester.id == semester_id).first()
    
    @staticmethod
    def get_by_programme(db: Session, programme_id: int):
        return db.query(models.Semester).filter(models.Semester.programme_id == programme_id).all()
    
    @staticmethod
    def update(db: Session, semester_id: int, semester: schemas.SemesterUpdate):
        db_semester = db.query(models.Semester).filter(models.Semester.id == semester_id).first()
        if db_semester:
            update_data = semester.dict(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_semester, key, value)
            db.commit()
            db.refresh(db_semester)
        return db_semester
    
    @staticmethod
    def delete(db: Session, semester_id: int):
        db_semester = db.query(models.Semester).filter(models.Semester.id == semester_id).first()
        if db_semester:
            db.delete(db_semester)
            db.commit()
        return db_semester

class ScheduleService:
    @staticmethod
    def create(db: Session, schedule: schemas.ScheduleCreate):
        db_schedule = models.Schedule(**schedule.dict())
        db.add(db_schedule)
        db.commit()
        db.refresh(db_schedule)
        return db_schedule
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100):
        return db.query(models.Schedule).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_by_class(db: Session, class_id: int):
        return db.query(models.Schedule).filter(models.Schedule.class_id == class_id).all()
    
    @staticmethod
    def get_by_teacher(db: Session, teacher_id: int):
        return db.query(models.Schedule).join(
            models.ClassSubjectTeacher
        ).filter(
            models.ClassSubjectTeacher.teacher_id == teacher_id
        ).all()
    
    @staticmethod
    def delete(db: Session, schedule_id: int):
        db_schedule = db.query(models.Schedule).filter(models.Schedule.id == schedule_id).first()
        if db_schedule:
            db.delete(db_schedule)
            db.commit()
        return db_schedule

class ClassService:
    @staticmethod
    def create(db: Session, class_data: schemas.ClassCreate):
        db_class = models.Class(**class_data.dict())
        db.add(db_class)
        db.commit()
        db.refresh(db_class)
        return db_class
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100):
        return db.query(models.Class).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_by_id(db: Session, class_id: int):
        return db.query(models.Class).filter(models.Class.id == class_id).first()
    
    @staticmethod
    def get_by_semester(db: Session, semester_id: int):
        return db.query(models.Class).filter(models.Class.semester_id == semester_id).all()
    
    @staticmethod
    def update(db: Session, class_id: int, class_data: schemas.ClassUpdate):
        db_class = db.query(models.Class).filter(models.Class.id == class_id).first()
        if db_class:
            update_data = class_data.dict(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_class, key, value)
            db.commit()
            db.refresh(db_class)
        return db_class
    
    @staticmethod
    def delete(db: Session, class_id: int):
        db_class = db.query(models.Class).filter(models.Class.id == class_id).first()
        if db_class:
            db.delete(db_class)
            db.commit()
        return db_class

class RoomService:
    @staticmethod
    def create(db: Session, room: schemas.RoomCreate):
        db_room = models.Room(**room.dict())
        db.add(db_room)
        db.commit()
        db.refresh(db_room)
        return db_room
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100):
        return db.query(models.Room).order_by(models.Room.room_number).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_by_id(db: Session, room_id: int):
        return db.query(models.Room).filter(models.Room.id == room_id).first()
    
    @staticmethod
    def update(db: Session, room_id: int, room: schemas.RoomUpdate):
        db_room = db.query(models.Room).filter(models.Room.id == room_id).first()
        if db_room:
            update_data = room.dict(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_room, key, value)
            db.commit()
            db.refresh(db_room)
        return db_room
    
    @staticmethod
    def delete(db: Session, room_id: int):
        db_room = db.query(models.Room).filter(models.Room.id == room_id).first()
        if db_room:
            db.delete(db_room)
            db.commit()
        return db_room

class DayService:
    @staticmethod
    def create(db: Session, day: schemas.DayCreate):
        db_day = models.Day(**day.dict())
        db.add(db_day)
        db.commit()
        db.refresh(db_day)
        return db_day
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100):
        return db.query(models.Day).order_by(models.Day.order).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_by_id(db: Session, day_id: int):
        return db.query(models.Day).filter(models.Day.id == day_id).first()
    
    @staticmethod
    def update(db: Session, day_id: int, day: schemas.DayBase):
        db_day = db.query(models.Day).filter(models.Day.id == day_id).first()
        if db_day:
            update_data = day.dict(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_day, key, value)
            db.commit()
            db.refresh(db_day)
        return db_day
    
    @staticmethod
    def delete(db: Session, day_id: int):
        db_day = db.query(models.Day).filter(models.Day.id == day_id).first()
        if db_day:
            db.delete(db_day)
            db.commit()
        return db_day

class PeriodService:
    @staticmethod
    def create(db: Session, period: schemas.PeriodCreate):
        db_period = models.Period(**period.dict())
        db.add(db_period)
        db.commit()
        db.refresh(db_period)
        return db_period
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100):
        return db.query(models.Period).order_by(models.Period.order).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_by_id(db: Session, period_id: int):
        return db.query(models.Period).filter(models.Period.id == period_id).first()
    
    @staticmethod
    def update(db: Session, period_id: int, period: schemas.PeriodCreate):
        db_period = db.query(models.Period).filter(models.Period.id == period_id).first()
        if db_period:
            update_data = period.dict(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_period, key, value)
            db.commit()
            db.refresh(db_period)
        return db_period
    
    @staticmethod
    def delete(db: Session, period_id: int):
        db_period = db.query(models.Period).filter(models.Period.id == period_id).first()
        if db_period:
            db.delete(db_period)
            db.commit()
        return db_period

class TeacherSubjectService:
    @staticmethod
    def get_teacher_subjects(db: Session, teacher_id: int):
        """Get all subjects assigned to a teacher"""
        teacher_subjects = db.query(models.TeacherSubject).filter(
            models.TeacherSubject.teacher_id == teacher_id
        ).all()
        return [ts.subject for ts in teacher_subjects]
    
    @staticmethod
    def get_available_subjects(db: Session, teacher_id: int):
        """Get all subjects (available for assignment to multiple teachers)"""
        # Return all subjects since subjects can be assigned to multiple teachers
        return db.query(models.Subject).all()
    
    @staticmethod
    def assign_subject(db: Session, teacher_id: int, subject_id: int):
        """Assign a subject to a teacher"""
        # Check if relationship already exists
        existing = db.query(models.TeacherSubject).filter(
            models.TeacherSubject.teacher_id == teacher_id,
            models.TeacherSubject.subject_id == subject_id
        ).first()
        
        if existing:
            return existing
        
        teacher_subject = models.TeacherSubject(
            teacher_id=teacher_id,
            subject_id=subject_id
        )
        db.add(teacher_subject)
        db.commit()
        db.refresh(teacher_subject)
        return teacher_subject
    
    @staticmethod
    def remove_subject(db: Session, teacher_id: int, subject_id: int):
        """Remove a subject from a teacher"""
        teacher_subject = db.query(models.TeacherSubject).filter(
            models.TeacherSubject.teacher_id == teacher_id,
            models.TeacherSubject.subject_id == subject_id
        ).first()
        
        if teacher_subject:
            db.delete(teacher_subject)
            db.commit()
            return True
        return False
    
    @staticmethod
    def get_teachers_by_subject(db: Session, subject_id: int):
        """Get all teachers who can teach a specific subject"""
        teacher_subjects = db.query(models.TeacherSubject).filter(
            models.TeacherSubject.subject_id == subject_id
        ).all()
        return [ts.teacher for ts in teacher_subjects]

class ClassRoutineService:
    @staticmethod
    def save_routine(db: Session, class_id: int, routine_entries: List[dict]):
        """Save or update routine for a class"""
        # Delete existing routine entries for this class
        db.query(models.ClassRoutineEntry).filter(
            models.ClassRoutineEntry.class_id == class_id
        ).delete()
        
        # Create new entries
        created_entries = []
        for entry_data in routine_entries:
            # Skip continuation entries (they're handled by num_periods)
            if entry_data.get('isContinuation'):
                continue
                
            entry = models.ClassRoutineEntry(
                class_id=class_id,
                day_id=entry_data['dayId'],
                period_id=entry_data['periodId'],
                subject_id=entry_data['subject_id'],
                is_lab=entry_data.get('is_lab', False),
                is_half_lab=entry_data.get('is_half_lab', False),
                num_periods=entry_data.get('num_periods', 1),
                lead_teacher_id=entry_data.get('lead_teacher_id'),
                assist_teacher_1_id=entry_data.get('assist_teacher_1_id'),
                assist_teacher_2_id=entry_data.get('assist_teacher_2_id'),
                assist_teacher_3_id=entry_data.get('assist_teacher_3_id'),
                group=entry_data.get('group'),
                lab_room=entry_data.get('lab_room'),
                lab_group_id=entry_data.get('lab_group_id'),
            )
            db.add(entry)
            created_entries.append(entry)
        
        db.commit()
        return created_entries
    
    @staticmethod
    def get_routine_by_class(db: Session, class_id: int):
        """Get routine entries for a class"""
        entries = db.query(models.ClassRoutineEntry).filter(
            models.ClassRoutineEntry.class_id == class_id
        ).all()
        
        result = []
        for entry in entries:
            result.append({
                'id': entry.id,
                'dayId': entry.day_id,
                'periodId': entry.period_id,
                'subject_id': entry.subject_id,
                'subject_name': entry.subject.name if entry.subject else '',
                'subject_code': entry.subject.code if entry.subject else '',
                'is_lab': entry.is_lab,
                'is_half_lab': entry.is_half_lab,
                'num_periods': entry.num_periods,
                'lead_teacher_id': entry.lead_teacher_id,
                'lead_teacher_name': entry.lead_teacher.abbreviation if entry.lead_teacher else '',
                'assist_teacher_1_id': entry.assist_teacher_1_id,
                'assist_teacher_1_name': entry.assist_teacher_1.abbreviation if entry.assist_teacher_1 else '',
                'assist_teacher_2_id': entry.assist_teacher_2_id,
                'assist_teacher_2_name': entry.assist_teacher_2.abbreviation if entry.assist_teacher_2 else '',
                'assist_teacher_3_id': entry.assist_teacher_3_id,
                'assist_teacher_3_name': entry.assist_teacher_3.abbreviation if entry.assist_teacher_3 else '',
                'group': entry.group,
                'lab_room': entry.lab_room,
                'lab_group_id': entry.lab_group_id,
            })
        
        return result
    
    @staticmethod
    def get_all_routines(db: Session):
        """Get all routine entries with related data"""
        try:
            entries = db.query(models.ClassRoutineEntry).all()
            print(f"Found {len(entries)} routine entries")
            
            result = []
            for entry in entries:
                try:
                    class_info = entry.class_
                    
                    # Build subject dict
                    subject_dict = None
                    if entry.subject:
                        subject_dict = {
                            'id': entry.subject.id,
                            'name': entry.subject.name,
                            'code': entry.subject.code,
                        }
                    
                    # Build class dict
                    class_dict = None
                    if class_info:
                        programme_dict = None
                        semester_dict = None
                        
                        if class_info.semester:
                            semester_dict = {'name': class_info.semester.name}
                            if class_info.semester.programme:
                                programme_dict = {
                                    'code': class_info.semester.programme.code,
                                    'name': class_info.semester.programme.name,
                                }
                        
                        class_dict = {
                            'id': class_info.id,
                            'name': class_info.name,
                            'section': class_info.section,
                            'room_no': class_info.room_no,
                            'programme': programme_dict,
                            'semester': semester_dict,
                        }
                    
                    result.append({
                        'id': entry.id,
                        'day_id': entry.day_id,
                        'period_id': entry.period_id,
                        'class_id': entry.class_id,
                        'subject_id': entry.subject_id,
                        'is_lab': entry.is_lab,
                        'is_half_lab': entry.is_half_lab,
                        'num_periods': entry.num_periods,
                        'lead_teacher_id': entry.lead_teacher_id,
                        'assist_teacher_1_id': entry.assist_teacher_1_id,
                        'assist_teacher_2_id': entry.assist_teacher_2_id,
                        'assist_teacher_3_id': entry.assist_teacher_3_id,
                        'group': entry.group,
                        'lab_room': entry.lab_room,
                        'lab_group_id': entry.lab_group_id,
                        'subject': subject_dict,
                        'class': class_dict,
                    })
                except Exception as e:
                    print(f"Error processing entry {entry.id}: {e}")
                    import traceback
                    traceback.print_exc()
                    continue
            
            print(f"Returning {len(result)} processed entries")
            return result
        except Exception as e:
            print(f"Error in get_all_routines: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    @staticmethod
    def delete_routine(db: Session, class_id: int):
        """Delete all routine entries for a class"""
        db.query(models.ClassRoutineEntry).filter(
            models.ClassRoutineEntry.class_id == class_id
        ).delete()
        db.commit()
        return True
    
    @staticmethod
    def check_teacher_conflicts(db: Session, teacher_id: int, day_id: int, period_ids: list, exclude_class_id: int = None):
        """Check if a teacher has conflicts in the given time slots (including multi-period overlaps)"""
        print(f"Checking conflicts for teacher {teacher_id}, day {day_id}, periods {period_ids}, exclude_class {exclude_class_id}")
        
        # Get all periods ordered by their order to calculate ranges
        all_periods = db.query(models.Period).order_by(models.Period.order).all()
        period_order_map = {p.id: p.order for p in all_periods}
        
        # Calculate the range of periods being checked (min to max)
        if not period_ids:
            return {'has_conflict': False, 'conflicts': []}
            
        checked_orders = [period_order_map.get(pid) for pid in period_ids if pid in period_order_map]
        if not checked_orders:
            return {'has_conflict': False, 'conflicts': []}
            
        min_checked_order = min(checked_orders)
        max_checked_order = max(checked_orders)
        
        print(f"Checking period range: {min_checked_order} to {max_checked_order}")
        
        # Find all assignments for this teacher on this day
        query = db.query(models.ClassRoutineEntry).filter(
            models.ClassRoutineEntry.day_id == day_id
        ).filter(
            (models.ClassRoutineEntry.lead_teacher_id == teacher_id) |
            (models.ClassRoutineEntry.assist_teacher_1_id == teacher_id) |
            (models.ClassRoutineEntry.assist_teacher_2_id == teacher_id) |
            (models.ClassRoutineEntry.assist_teacher_3_id == teacher_id)
        )
        
        if exclude_class_id:
            query = query.filter(models.ClassRoutineEntry.class_id != exclude_class_id)
        
        all_assignments = query.all()
        print(f"Found {len(all_assignments)} existing assignments for this teacher on this day")
        
        conflicts = []
        for assignment in all_assignments:
            assignment_period_order = period_order_map.get(assignment.period_id)
            if assignment_period_order is None:
                continue
                
            # Calculate the range this assignment covers
            assignment_start = assignment_period_order
            assignment_end = assignment_period_order + (assignment.num_periods - 1)
            
            print(f"Checking assignment: period {assignment_period_order}, num_periods {assignment.num_periods}, range {assignment_start}-{assignment_end}")
            
            # Check if ranges overlap
            # Two ranges overlap if: start1 <= end2 AND start2 <= end1
            if assignment_start <= max_checked_order and min_checked_order <= assignment_end:
                print(f"CONFLICT DETECTED: Assignment range {assignment_start}-{assignment_end} overlaps with checked range {min_checked_order}-{max_checked_order}")
                conflicts.append(assignment)
            else:
                print(f"No overlap: Assignment range {assignment_start}-{assignment_end} does not overlap with {min_checked_order}-{max_checked_order}")
        
        print(f"Total conflicts found: {len(conflicts)}")
        
        if conflicts:
            conflict_details = []
            for conflict in conflicts:
                class_info = db.query(models.Class).filter(models.Class.id == conflict.class_id).first()
                period_info = db.query(models.Period).filter(models.Period.id == conflict.period_id).first()
                subject_info = conflict.subject
                
                conflict_period_order = period_order_map.get(conflict.period_id, 0)
                conflict_range = f"{conflict_period_order}-{conflict_period_order + conflict.num_periods - 1}" if conflict.num_periods > 1 else str(conflict_period_order)
                
                print(f"Conflict: class={class_info.name if class_info else 'Unknown'}, period range={conflict_range}, subject={subject_info.name if subject_info else 'Unknown'}")
                
                conflict_details.append({
                    'class_name': class_info.name if class_info else 'Unknown',
                    'period_order': conflict_range,
                    'subject_name': subject_info.name if subject_info else 'Unknown',
                })
            
            return {
                'has_conflict': True,
                'conflicts': conflict_details
            }
        
        return {'has_conflict': False, 'conflicts': []}


# Position Rate CRUD operations
def get_position_rates(db: Session):
    """Get all position rates"""
    return db.query(models.PositionRate).all()

def get_position_rate_by_position(db: Session, position: str):
    """Get position rate by position name"""
    return db.query(models.PositionRate).filter(models.PositionRate.position == position).first()

def create_or_update_position_rates(db: Session, rates: List[schemas.PositionRateCreate]):
    """Create or update multiple position rates"""
    result = []
    for rate_data in rates:
        # Check if position rate already exists
        existing_rate = db.query(models.PositionRate).filter(
            models.PositionRate.position == rate_data.position
        ).first()
        
        if existing_rate:
            # Update existing rate
            existing_rate.rate = rate_data.rate
            db.commit()
            db.refresh(existing_rate)
            result.append(existing_rate)
        else:
            # Create new rate
            new_rate = models.PositionRate(
                position=rate_data.position,
                rate=rate_data.rate
            )
            db.add(new_rate)
            db.commit()
            db.refresh(new_rate)
            result.append(new_rate)
    
    return result

def delete_position_rate(db: Session, position: str):
    """Delete a position rate"""
    rate = db.query(models.PositionRate).filter(models.PositionRate.position == position).first()
    if rate:
        db.delete(rate)
        db.commit()
        return True
    return False

# Teacher Effective Load CRUD operations
def get_effective_loads(db: Session):
    """Get all teacher effective loads"""
    return db.query(models.TeacherEffectiveLoad).all()

def get_effective_load_by_teacher(db: Session, teacher_id: int):
    """Get effective load for a specific teacher"""
    return db.query(models.TeacherEffectiveLoad).filter(
        models.TeacherEffectiveLoad.teacher_id == teacher_id
    ).first()

def create_or_update_effective_loads(db: Session, loads: List[schemas.TeacherEffectiveLoadCreate]):
    """Create or update multiple teacher effective loads"""
    result = []
    for load_data in loads:
        # Check if effective load already exists for this teacher
        existing_load = db.query(models.TeacherEffectiveLoad).filter(
            models.TeacherEffectiveLoad.teacher_id == load_data.teacher_id
        ).first()
        
        if existing_load:
            # Update existing load
            existing_load.effective_load = load_data.effective_load
            existing_load.position = load_data.position
            db.commit()
            db.refresh(existing_load)
            result.append(existing_load)
        else:
            # Create new load
            new_load = models.TeacherEffectiveLoad(
                teacher_id=load_data.teacher_id,
                effective_load=load_data.effective_load,
                position=load_data.position
            )
            db.add(new_load)
            db.commit()
            db.refresh(new_load)
            result.append(new_load)
    
    return result

def delete_effective_load(db: Session, teacher_id: int):
    """Delete a teacher effective load"""
    load = db.query(models.TeacherEffectiveLoad).filter(
        models.TeacherEffectiveLoad.teacher_id == teacher_id
    ).first()
    if load:
        db.delete(load)
        db.commit()
        return True
    return False
