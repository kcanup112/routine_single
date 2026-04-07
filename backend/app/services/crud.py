from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models import models
from app.schemas import schemas
from typing import List, Optional
from datetime import datetime, time, timedelta


def get_institution_type(db: Session) -> str:
    """
    Return the institution_type for the current tenant.
    Reads the schema from the active search_path, then queries public.tenants.
    Falls back to "engineering" if not found.
    """
    try:
        result = db.execute(text("SELECT current_schema()")).scalar()
        schema_name = result if result and result != "public" else None
        if not schema_name:
            return "engineering"
        from app.models.models_saas import Tenant
        tenant = db.execute(
            text("SELECT settings FROM public.tenants WHERE schema_name = :s"),
            {"s": schema_name}
        ).fetchone()
        if tenant and tenant[0]:
            settings = tenant[0]
            if isinstance(settings, dict):
                return settings.get("institution_type", "engineering")
    except Exception:
        pass
    return "engineering"


class DepartmentService:
    @staticmethod
    def create(db: Session, department: schemas.DepartmentCreate):
        db_department = models.Department(**department.dict())
        db.add(db_department)
        db.commit()
        db.refresh(db_department)
        # School mode: auto-create a hidden default Programme for this department
        if get_institution_type(db) == "school":
            existing = db.query(models.Programme).filter(
                models.Programme.department_id == db_department.id,
                models.Programme.code == "DEFAULT"
            ).first()
            if not existing:
                default_prog = models.Programme(
                    department_id=db_department.id,
                    name="Default",
                    code="DEFAULT",
                )
                db.add(default_prog)
                db.commit()
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
            # Delete related rows that may lack ON DELETE CASCADE in the DB
            db.query(models.ClassRoutine).filter(models.ClassRoutine.class_id == class_id).delete()
            db.query(models.ClassRoutineEntry).filter(models.ClassRoutineEntry.class_id == class_id).delete()
            # Use query-based delete to avoid SQLAlchemy loading relationships (e.g. calendar_events)
            db.query(models.Class).filter(models.Class.id == class_id).delete()
            db.commit()
        return db_class

class SemesterService:
    @staticmethod
    def create(db: Session, semester: schemas.SemesterCreate):
        data = semester.dict()
        department_id = data.pop("department_id", None)
        # School mode: resolve programme_id from the department's default programme
        if not data.get("programme_id") and department_id:
            prog = db.query(models.Programme).filter(
                models.Programme.department_id == department_id,
                models.Programme.code == "DEFAULT"
            ).first()
            if not prog:
                raise ValueError(
                    f"No default programme found for department {department_id}. "
                    "Please ensure the department was created in school mode."
                )
            data["programme_id"] = prog.id
        if not data.get("programme_id"):
            raise ValueError("programme_id is required (or department_id for school mode)")
        db_semester = models.Semester(**data)
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
    def get_by_department(db: Session, department_id: int):
        """School mode: return all semesters (classes) belonging to a department."""
        return (
            db.query(models.Semester)
            .join(models.Programme, models.Semester.programme_id == models.Programme.id)
            .filter(models.Programme.department_id == department_id)
            .all()
        )
    
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
        return db.query(models.Day).order_by(models.Day.day_number).offset(skip).limit(limit).all()
    
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

class ShiftService:
    @staticmethod
    def _add_minutes_to_time(t: time, minutes: int) -> time:
        """Helper to add minutes to a time object"""
        dt = datetime.combine(datetime.today(), t)
        dt_new = dt + timedelta(minutes=minutes)
        return dt_new.time()
    
    @staticmethod
    def _parse_array_field(field_value) -> List[int]:
        """Parse PostgreSQL array stored as string '{1,2,3}' to list [1,2,3]"""
        if isinstance(field_value, list):
            return field_value
        if isinstance(field_value, str):
            # Remove curly braces and split
            clean = field_value.strip('{}').strip()
            if not clean:
                return []
            return [int(x.strip()) for x in clean.split(',') if x.strip()]
        return []
    
    @staticmethod
    def _generate_periods_for_shift(db_shift) -> List[models.Period]:
        """Auto-generate periods based on shift configuration"""
        periods = []
        current_time = db_shift.start_time
        period_number = 1
        teaching_period_count = 0
        
        # Parse break configuration
        break_after = ShiftService._parse_array_field(db_shift.break_after_periods)
        break_durations = ShiftService._parse_array_field(db_shift.break_durations)
        
        # Generate periods until we reach end time
        while True:
            # Calculate teaching period end time
            period_end = ShiftService._add_minutes_to_time(current_time, db_shift.period_duration)
            
            # Stop if we exceed shift end time
            if period_end > db_shift.end_time:
                break
            
            teaching_period_count += 1
            
            # Create teaching period
            periods.append(models.Period(
                shift_id=db_shift.id,
                period_number=period_number,
                name=f"Period {teaching_period_count}",
                start_time=current_time,
                end_time=period_end,
                type='teaching',
                is_teaching_period=True,
                is_active=True
            ))
            
            current_time = period_end
            period_number += 1
            
            # Check if a break should be added after this teaching period
            if teaching_period_count in break_after:
                try:
                    break_index = break_after.index(teaching_period_count)
                    if break_index < len(break_durations):
                        break_duration = break_durations[break_index]
                        break_end = ShiftService._add_minutes_to_time(current_time, break_duration)
                        
                        # Stop if break exceeds shift end time
                        if break_end > db_shift.end_time:
                            break
                        
                        # Determine break type based on duration
                        break_type = 'lunch' if break_duration >= 45 else 'break'
                        break_name = 'Lunch Break' if break_type == 'lunch' else f'Break ({break_duration} min)'
                        
                        periods.append(models.Period(
                            shift_id=db_shift.id,
                            period_number=period_number,
                            name=break_name,
                            start_time=current_time,
                            end_time=break_end,
                            type=break_type,
                            is_teaching_period=False,
                            is_active=True
                        ))
                        
                        current_time = break_end
                        period_number += 1
                except (ValueError, IndexError):
                    pass  # Skip if break config is invalid
            
            # Safety check to prevent infinite loops
            if period_number > 50:
                break
        
        return periods
    
    @staticmethod
    def create(db: Session, shift: schemas.ShiftCreate):
        """Create shift and auto-generate periods"""
        # Convert lists to PostgreSQL array format if needed
        shift_data = shift.dict()
        if isinstance(shift_data.get('working_days'), list):
            shift_data['working_days'] = '{' + ','.join(map(str, shift_data['working_days'])) + '}'
        if isinstance(shift_data.get('break_after_periods'), list):
            shift_data['break_after_periods'] = '{' + ','.join(map(str, shift_data['break_after_periods'])) + '}'
        if isinstance(shift_data.get('break_durations'), list):
            shift_data['break_durations'] = '{' + ','.join(map(str, shift_data['break_durations'])) + '}'
        
        db_shift = models.Shift(**shift_data)
        db.add(db_shift)
        db.flush()  # Get shift.id without committing
        
        # Auto-generate periods
        periods = ShiftService._generate_periods_for_shift(db_shift)
        for period in periods:
            db.add(period)
        
        db.commit()
        db.refresh(db_shift)
        return db_shift
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100):
        return db.query(models.Shift).filter(models.Shift.deleted_at.is_(None)).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_by_id(db: Session, shift_id: int):
        return db.query(models.Shift).filter(models.Shift.id == shift_id, models.Shift.deleted_at.is_(None)).first()
    
    @staticmethod
    def update(db: Session, shift_id: int, shift: schemas.ShiftCreate):
        """Update shift and regenerate periods if timing/duration changed"""
        db_shift = db.query(models.Shift).filter(models.Shift.id == shift_id, models.Shift.deleted_at.is_(None)).first()
        if not db_shift:
            return None
        
        # Check if period-affecting fields changed
        shift_dict = shift.dict(exclude_unset=True)
        regenerate_periods = (
            shift_dict.get('start_time') != db_shift.start_time or
            shift_dict.get('end_time') != db_shift.end_time or
            shift_dict.get('period_duration') != db_shift.period_duration or
            shift_dict.get('break_after_periods') != ShiftService._parse_array_field(db_shift.break_after_periods) or
            shift_dict.get('break_durations') != ShiftService._parse_array_field(db_shift.break_durations)
        )
        
        # Convert lists to PostgreSQL array format
        if isinstance(shift_dict.get('working_days'), list):
            shift_dict['working_days'] = '{' + ','.join(map(str, shift_dict['working_days'])) + '}'
        if isinstance(shift_dict.get('break_after_periods'), list):
            shift_dict['break_after_periods'] = '{' + ','.join(map(str, shift_dict['break_after_periods'])) + '}'
        if isinstance(shift_dict.get('break_durations'), list):
            shift_dict['break_durations'] = '{' + ','.join(map(str, shift_dict['break_durations'])) + '}'
        
        # Update shift fields
        for key, value in shift_dict.items():
            setattr(db_shift, key, value)
        
        # Regenerate periods if timing changed
        if regenerate_periods:
            # Delete existing auto-generated periods (keep manual ones)
            db.query(models.Period).filter(
                models.Period.shift_id == shift_id
            ).delete()
            
            # Generate new periods
            db.flush()  # Ensure shift is updated before generating
            periods = ShiftService._generate_periods_for_shift(db_shift)
            for period in periods:
                db.add(period)
        
        db.commit()
        db.refresh(db_shift)
        return db_shift
    
    @staticmethod
    def delete(db: Session, shift_id: int):
        db_shift = db.query(models.Shift).filter(models.Shift.id == shift_id, models.Shift.deleted_at.is_(None)).first()
        if db_shift:
            # Get period IDs for this shift
            period_ids = [p.id for p in db.query(models.Period).filter(
                models.Period.shift_id == shift_id
            ).all()]
            
            if period_ids:
                # Delete routine entries referencing these periods
                db.query(models.ClassRoutineEntry).filter(
                    models.ClassRoutineEntry.period_id.in_(period_ids)
                ).delete(synchronize_session='fetch')
                db.query(models.ClassRoutine).filter(
                    models.ClassRoutine.period_id.in_(period_ids)
                ).delete(synchronize_session='fetch')
                # Delete the periods themselves
                db.query(models.Period).filter(
                    models.Period.shift_id == shift_id
                ).delete()
            
            db_shift.deleted_at = datetime.utcnow()
            db.commit()
        return db_shift

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
        return db.query(models.Period).order_by(models.Period.period_number).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_by_id(db: Session, period_id: int):
        return db.query(models.Period).filter(models.Period.id == period_id).first()
    
    @staticmethod
    def get_by_shift(db: Session, shift_id: int):
        """Get all periods for a specific shift"""
        shift_obj = db.query(models.Shift).filter(
            models.Shift.id == shift_id,
            models.Shift.is_active == True,
        ).first()
        if not shift_obj:
            return []
        return db.query(models.Period).filter(
            models.Period.shift_id == shift_id,
            models.Period.is_active == True,
            models.Period.start_time >= shift_obj.start_time,
            models.Period.end_time <= shift_obj.end_time,
        ).order_by(models.Period.period_number).all()
    
    @staticmethod
    def get_teaching_periods_by_shift(db: Session, shift_id: int):
        """Get only teaching periods for a specific shift"""
        shift_obj = db.query(models.Shift).filter(
            models.Shift.id == shift_id,
            models.Shift.is_active == True,
        ).first()
        if not shift_obj:
            return []
        return db.query(models.Period).filter(
            models.Period.shift_id == shift_id,
            models.Period.is_teaching_period == True,
            models.Period.is_active == True,
            models.Period.start_time >= shift_obj.start_time,
            models.Period.end_time <= shift_obj.end_time,
        ).order_by(models.Period.period_number).all()

    @staticmethod
    def get_default_teaching_periods(db: Session):
        """Get teaching periods for the default active shift."""
        default_shift = db.query(models.Shift).filter(
            models.Shift.is_default == True,
            models.Shift.is_active == True,
        ).first()
        if not default_shift:
            return []
        return PeriodService.get_teaching_periods_by_shift(db, default_shift.id)
    
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
            # Delete referencing routine entries first (FK constraints)
            db.query(models.ClassRoutineEntry).filter(
                models.ClassRoutineEntry.period_id == period_id
            ).delete()
            db.query(models.ClassRoutine).filter(
                models.ClassRoutine.period_id == period_id
            ).delete()
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
    def save_routine(db: Session, class_id: int, routine_entries: List[dict], room_no: str = None):
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
                subject_id=entry_data.get('subject_id'),  # None for BREAK/LC
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
            # Reconstruct virtual subject_id for BREAK / LC entries
            if entry.subject_id is None and entry.group in ('BREAK', 'LC'):
                virtual_sid = entry.group       # 'BREAK' or 'LC'
                virtual_name = 'Break' if entry.group == 'BREAK' else 'Library Consultation'
                virtual_code = entry.group
            else:
                virtual_sid = entry.subject_id
                virtual_name = entry.subject.name if entry.subject else ''
                virtual_code = entry.subject.code if entry.subject else ''

            result.append({
                'id': entry.id,
                'dayId': entry.day_id,
                'periodId': entry.period_id,
                'subject_id': virtual_sid,
                'subject_name': virtual_name,
                'subject_code': virtual_code,
                'is_lab': entry.is_lab,
                'is_half_lab': entry.is_half_lab,
                'num_periods': entry.num_periods,
                'lead_teacher_id': entry.lead_teacher_id,
                'lead_teacher_name': entry.lead_teacher.name if entry.lead_teacher else '',
                'assist_teacher_1_id': entry.assist_teacher_1_id,
                'assist_teacher_1_name': entry.assist_teacher_1.name if entry.assist_teacher_1 else '',
                'assist_teacher_2_id': entry.assist_teacher_2_id,
                'assist_teacher_2_name': entry.assist_teacher_2.name if entry.assist_teacher_2 else '',
                'assist_teacher_3_id': entry.assist_teacher_3_id,
                'assist_teacher_3_name': entry.assist_teacher_3.name if entry.assist_teacher_3 else '',
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
        
        # Get all periods ordered by their period_number to calculate ranges
        all_periods = db.query(models.Period).order_by(models.Period.period_number).all()
        period_order_map = {p.id: p.period_number for p in all_periods}
        
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


class RoutineGeneratorService:
    """
    Auto-generate theory-only routine entries for a list of classes.

    Delegates to CP-SAT solver (routine_solver.py) by default.
    Falls back to the legacy greedy algorithm if ortools is unavailable
    or if solver='greedy' is explicitly requested.

    Block-size rules (consecutive pairs prioritised):
      load=1 → [1]
      load=2 → [2]
      load=3 → [2, 1]
      load=4 → [2, 2]
      load=5 → [2, 2, 1]
      load=N → [2, …, 2, (1 if N is odd)]
    """

    @staticmethod
    def _plan_blocks(load: int) -> list:
        blocks = []
        remaining = int(load)
        while remaining >= 2:
            blocks.append(2)
            remaining -= 2
        if remaining:
            blocks.append(1)
        return blocks

    @staticmethod
    def generate(db, assignments: list, solver: str = "cpsat") -> dict:
        """
        Entry point.  *solver* can be ``"cpsat"`` (default) or ``"greedy"``.
        """
        if solver == "cpsat":
            try:
                from app.services.routine_solver import CPSATRoutineSolver
                return CPSATRoutineSolver.solve(db, assignments)
            except ImportError:
                import logging
                logging.getLogger(__name__).warning(
                    "ortools not installed – falling back to greedy generator"
                )
            except Exception as exc:
                import logging
                logging.getLogger(__name__).error(
                    "CP-SAT solver failed (%s) – falling back to greedy", exc
                )

        # ── legacy greedy algorithm ─────────────────────────────────────
        return RoutineGeneratorService._greedy(db, assignments)
    @staticmethod
    def _greedy(db, assignments: list) -> dict:
        from collections import defaultdict

        # Determine block strategy for school vs engineering
        _block_fn = (
            (lambda load: [1] * int(load))
            if get_institution_type(db) == "school"
            else RoutineGeneratorService._plan_blocks
        )

        # 1. Working days ordered by day_number
        days = (db.query(models.Day)
                  .filter(models.Day.is_working_day == True)
                  .order_by(models.Day.day_number)
                  .all())
        if not days:
            return {'placed': 0, 'unplaced': [], 'class_results': [],
                    'error': 'No working days configured'}

        # 2. Build a complete period map so immutable existing entries are
        #    respected even if a period is non-teaching or inactive.
        period_number_map = {
            p.id: p.period_number
            for p in db.query(models.Period).all()
        }

        # 3. Pre-build busy maps from ALL existing entries (theory + lab).
        #    Existing entries are treated as IMMUTABLE – no deletions.
        all_existing = db.query(models.ClassRoutineEntry).all()
        teacher_busy = defaultdict(set)
        class_busy   = defaultdict(set)
        existing_counts = defaultdict(int)  # (class_id, subject_id, teacher_id) → placed periods

        target_class_ids = {ca['class_id'] for ca in assignments}

        for entry in all_existing:
            pn = period_number_map.get(entry.period_id)
            if pn is None:
                continue
            for offset in range(entry.num_periods or 1):
                slot = (entry.day_id, pn + offset)
                class_busy[entry.class_id].add(slot)
                for tid in [entry.lead_teacher_id,
                            entry.assist_teacher_1_id,
                            entry.assist_teacher_2_id,
                            entry.assist_teacher_3_id]:
                    if tid:
                        teacher_busy[tid].add(slot)

            # Count already-placed theory periods for target classes
            if entry.class_id in target_class_ids and not entry.is_lab:
                existing_counts[
                    (entry.class_id, entry.subject_id, entry.lead_teacher_id)
                ] += (entry.num_periods or 1)

        # 4. Resolve default shift (fallback for classes that have no shift_id)
        default_shift = (
            db.query(models.Shift)
              .filter(models.Shift.is_default == True,
                      models.Shift.is_active == True)
              .first()
        )

        def _teaching_periods_for_shift(shift_id: int):
            """Return active teaching periods that strictly fit inside shift bounds."""
            shift_obj = (
                db.query(models.Shift)
                .filter(models.Shift.id == shift_id, models.Shift.is_active == True)
                .first()
            )
            if not shift_obj:
                return []
            return (db.query(models.Period)
                      .filter(models.Period.shift_id == shift_id,
                              models.Period.is_teaching_period == True,
                              models.Period.is_active == True,
                              models.Period.start_time >= shift_obj.start_time,
                              models.Period.end_time <= shift_obj.end_time)
                      .order_by(models.Period.period_number)
                      .all())

        # 5. Process each class (only fill *remaining* load; no deletions)
        total_placed  = 0
        unplaced      = []
        class_results = []
        new_entries   = []

        for ca in assignments:
            class_id = ca['class_id']
            cls = db.query(models.Class).filter(models.Class.id == class_id).first()
            if not cls:
                continue

            if cls.shift_id:
                shift_periods = _teaching_periods_for_shift(cls.shift_id)
            elif default_shift:
                shift_periods = _teaching_periods_for_shift(default_shift.id)
            else:
                shift_periods = []

            pnums = [p.period_number for p in shift_periods]
            pid_by_pnum = {p.period_number: p.id for p in shift_periods}

            adjacent_pairs = [
                (pnums[i], pnums[i + 1])
                for i in range(len(pnums) - 1)
                if pnums[i + 1] == pnums[i] + 1
            ]

            class_placed   = 0
            class_unplaced = []

            # Deduplicate: only process each (subject, teacher) once per class
            seen_pairs = set()

            for subj in ca.get('subjects', []):
                subject_id = subj['subject_id']
                for tl in subj.get('teachers', []):
                    teacher_id = tl['teacher_id']
                    pair_key = (subject_id, teacher_id)
                    if pair_key in seen_pairs:
                        continue
                    seen_pairs.add(pair_key)

                    load = max(0, int(tl.get('load', 0) or 0))
                    if load == 0:
                        continue

                    already = existing_counts.get((class_id, subject_id, teacher_id), 0)
                    remaining = load - already
                    if remaining <= 0:
                        continue

                    blocks = _block_fn(remaining)
                    subject_placed = 0

                    for block_size in blocks:
                        placed_this_block = False

                        if block_size == 2:
                            # Try adjacent pair first
                            for day in days:
                                if placed_this_block:
                                    break
                                for pn1, pn2 in adjacent_pairs:
                                    s1 = (day.id, pn1)
                                    s2 = (day.id, pn2)
                                    if (s1 not in class_busy[class_id] and
                                            s2 not in class_busy[class_id] and
                                            s1 not in teacher_busy[teacher_id] and
                                            s2 not in teacher_busy[teacher_id]):
                                        new_entries.append(models.ClassRoutineEntry(
                                            class_id=class_id,
                                            day_id=day.id,
                                            period_id=pid_by_pnum[pn1],
                                            subject_id=subject_id,
                                            lead_teacher_id=teacher_id,
                                            num_periods=2,
                                            is_lab=False,
                                        ))
                                        class_busy[class_id].add(s1)
                                        class_busy[class_id].add(s2)
                                        teacher_busy[teacher_id].add(s1)
                                        teacher_busy[teacher_id].add(s2)
                                        subject_placed += 2
                                        placed_this_block = True
                                        break

                            # Fallback: two singles
                            if not placed_this_block:
                                singles = 0
                                for day in days:
                                    if singles >= 2:
                                        break
                                    for pn in pnums:
                                        s = (day.id, pn)
                                        if (s not in class_busy[class_id] and
                                                s not in teacher_busy[teacher_id]):
                                            new_entries.append(models.ClassRoutineEntry(
                                                class_id=class_id,
                                                day_id=day.id,
                                                period_id=pid_by_pnum[pn],
                                                subject_id=subject_id,
                                                lead_teacher_id=teacher_id,
                                                num_periods=1,
                                                is_lab=False,
                                            ))
                                            class_busy[class_id].add(s)
                                            teacher_busy[teacher_id].add(s)
                                            subject_placed += 1
                                            singles += 1
                                            placed_this_block = True
                                            break
                        else:
                            for day in days:
                                if placed_this_block:
                                    break
                                for pn in pnums:
                                    s = (day.id, pn)
                                    if (s not in class_busy[class_id] and
                                            s not in teacher_busy[teacher_id]):
                                        new_entries.append(models.ClassRoutineEntry(
                                            class_id=class_id,
                                            day_id=day.id,
                                            period_id=pid_by_pnum[pn],
                                            subject_id=subject_id,
                                            lead_teacher_id=teacher_id,
                                            num_periods=1,
                                            is_lab=False,
                                        ))
                                        class_busy[class_id].add(s)
                                        teacher_busy[teacher_id].add(s)
                                        subject_placed += 1
                                        placed_this_block = True
                                        break

                        if not placed_this_block:
                            class_unplaced.append({
                                'subject_id': subject_id,
                                'teacher_id': teacher_id,
                                'block_size': block_size,
                                'reason': 'No free slot found',
                            })

                    class_placed += subject_placed
                    if subject_placed < remaining:
                        class_unplaced.append({
                            'subject_id': subject_id,
                            'teacher_id': teacher_id,
                            'load': load,
                            'placed': subject_placed,
                            'already': already,
                            'reason': f'Only placed {subject_placed}/{remaining} remaining periods',
                        })

            total_placed += class_placed
            unplaced.extend(class_unplaced)
            class_results.append({
                'class_id': class_id,
                'placed': class_placed,
                'unplaced': len(class_unplaced),
            })

        # 7. Bulk write
        for entry in new_entries:
            db.add(entry)
        db.commit()

        return {
            'placed': total_placed,
            'unplaced': unplaced,
            'class_results': class_results,
        }


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
