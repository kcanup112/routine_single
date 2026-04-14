"""
Database models for single-tenant Routine Scheduler
"""
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Time, Float, DateTime, Date, Text, Numeric, Index, JSON
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from app.core.database import Base


class User(Base):
    """User model — admin/viewer accounts for this institution"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(200))
    phone = Column(String(20))
    role = Column(String(50), default='viewer')  # admin, viewer
    permissions = Column(JSON, default=[])
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime, nullable=True)

class Department(Base):
    __tablename__ = "departments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False)
    code = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)
    
    programs = relationship("Programme", back_populates="department")
    teachers = relationship("Teacher", back_populates="department")

class Programme(Base):
    __tablename__ = "programmes"
    
    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    name = Column(String(200), nullable=False)
    code = Column(String(50), nullable=True)
    duration_years = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)
    
    department = relationship("Department", back_populates="programs")
    semesters = relationship("Semester", back_populates="programme")

class Semester(Base):
    __tablename__ = "semesters"
    
    id = Column(Integer, primary_key=True, index=True)
    programme_id = Column(Integer, ForeignKey("programmes.id"), nullable=False)
    name = Column(String(100), nullable=False)
    semester_number = Column(Integer, nullable=False)
    academic_year = Column(String(20), nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)
    
    programme = relationship("Programme", back_populates="semesters")
    classes = relationship("Class", back_populates="semester")
    semester_subjects = relationship("SemesterSubject", back_populates="semester")

class Class(Base):
    __tablename__ = "classes"
    
    id = Column(Integer, primary_key=True, index=True)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=False)
    shift_id = Column(Integer, ForeignKey("shifts.id"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    name = Column(String(200), nullable=False)
    section = Column(String(50), nullable=True)
    room_no = Column(String(50), nullable=True)
    student_capacity = Column(Integer, default=60)
    current_strength = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    academic_year = Column(String(20), nullable=True)
    effective_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)
    
    semester = relationship("Semester", back_populates="classes")
    shift = relationship("Shift", back_populates="classes")
    department = relationship("Department")
    class_routines = relationship("ClassRoutine", back_populates="class_")
    calendar_events = relationship("CalendarEvent", back_populates="class_")

class Subject(Base):
    __tablename__ = "subjects"
    
    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    name = Column(String(200), nullable=False)
    code = Column(String(50), unique=True, nullable=True)
    credit_hours = Column(Integer, nullable=True)
    is_lab = Column(Boolean, default=False)  # Whether subject has lab component
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)
    
    department = relationship("Department")
    semester_subjects = relationship("SemesterSubject", back_populates="subject")

class SemesterSubject(Base):
    __tablename__ = "semester_subjects"
    
    id = Column(Integer, primary_key=True, index=True)
    semester_id = Column(Integer, ForeignKey("semesters.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    periods_per_week = Column(Integer, default=3)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)
    
    semester = relationship("Semester", back_populates="semester_subjects")
    subject = relationship("Subject", back_populates="semester_subjects")
    # Removed class_routines relationship - ClassRoutine now references subject_id directly

class Teacher(Base):
    __tablename__ = "teachers"
    
    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    user_id = Column(Integer, nullable=True)  # FK to public.users (cross-schema, no FK constraint)
    name = Column(String(200), nullable=False)
    abbreviation = Column(String(50), nullable=True)
    email = Column(String(255), unique=True, nullable=True)
    phone = Column(String(20), nullable=True)
    employee_id = Column(String(50), unique=True, nullable=True)
    designation = Column(String(100), nullable=True)
    qualification = Column(Text, nullable=True)
    employment_type = Column(String(20), default='full_time')  # 'full_time' or 'part_time'
    max_periods_per_week = Column(Integer, default=30)
    unavailable_days = Column(ARRAY(Integer), default=list)  # PostgreSQL array of integers
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)
    
    department = relationship("Department", back_populates="teachers")
    teacher_subjects = relationship("TeacherSubject", back_populates="teacher")

class TeacherSubject(Base):
    __tablename__ = "teacher_subjects"
    __table_args__ = (
        Index('ix_ts_teacher_subject', 'teacher_id', 'subject_id', unique=True),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    proficiency_level = Column(String(50), default='expert')
    preferred = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    teacher = relationship("Teacher", back_populates="teacher_subjects")
    subject = relationship("Subject")

class Day(Base):
    __tablename__ = "days"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    day_number = Column(Integer, unique=True, nullable=False)
    is_working_day = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    class_routines = relationship("ClassRoutine", back_populates="day")

class Period(Base):
    __tablename__ = "periods"
    
    id = Column(Integer, primary_key=True, index=True)
    shift_id = Column(Integer, ForeignKey("shifts.id", ondelete="CASCADE"), nullable=False)
    period_number = Column(Integer, nullable=False)
    name = Column(String(100), nullable=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    type = Column(String(20), nullable=False)  # 'teaching', 'break', 'lunch'
    is_teaching_period = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    shift = relationship("Shift", back_populates="periods")
    class_routines = relationship("ClassRoutine", back_populates="period")

class Shift(Base):
    """Shift/Session configuration for multi-shift support"""
    __tablename__ = "shifts"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    working_days = Column(String, default='{0,1,2,3,4,5}')  # Array as string
    period_duration = Column(Integer, default=50, nullable=False)
    break_after_periods = Column(String, default='{2,4}')  # Array as string
    break_durations = Column(String, default='{15,60}')  # Array as string  
    is_active = Column(Boolean, default=True, nullable=False)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    
    periods = relationship("Period", back_populates="shift")
    classes = relationship("Class", back_populates="shift")

class ClassRoutine(Base):
    __tablename__ = "class_routines"
    
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=False)
    day_id = Column(Integer, ForeignKey("days.id", ondelete="CASCADE"), nullable=False)
    period_id = Column(Integer, ForeignKey("periods.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=True)  # Changed from semester_subject_id
    teacher_id = Column(Integer, ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True)
    room_no = Column(String(50), nullable=True)  # Changed from room_id to match actual database
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    class_ = relationship("Class", back_populates="class_routines")
    day = relationship("Day", back_populates="class_routines")
    period = relationship("Period", back_populates="class_routines")
    subject = relationship("Subject")  # Changed from semester_subject
    teacher = relationship("Teacher")

class Room(Base):
    __tablename__ = "rooms"
    
    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String(50), unique=True, nullable=False)
    name = Column(String(200), nullable=True)
    building = Column(String(200), nullable=True)
    description = Column(Text, nullable=True)
    floor = Column(String(50), nullable=True)
    capacity = Column(Integer, nullable=True)
    type = Column(String(50), nullable=True)  # 'classroom', 'lab', 'auditorium', etc.
    room_type = Column(String(50), nullable=True)  # Additional type field
    facilities = Column(ARRAY(String), nullable=True)  # Array of facilities
    is_active = Column(Boolean, default=True)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)
    
    # Removed class_routines relationship - ClassRoutine uses room_no (string) not room_id (FK)

class ClassRoutineEntry(Base):
    __tablename__ = "class_routine_entries"
    __table_args__ = (
        Index('ix_cre_class_day_period', 'class_id', 'day_id', 'period_id'),
        Index('ix_cre_teacher_day', 'lead_teacher_id', 'day_id'),
        Index('ix_cre_class_subject', 'class_id', 'subject_id'),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"))
    day_id = Column(Integer, ForeignKey("days.id"))
    period_id = Column(Integer, ForeignKey("periods.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    is_lab = Column(Boolean, default=False)
    is_half_lab = Column(Boolean, default=False)
    num_periods = Column(Integer, default=1)
    lead_teacher_id = Column(Integer, ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True)
    assist_teacher_1_id = Column(Integer, ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True)
    assist_teacher_2_id = Column(Integer, ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True)
    assist_teacher_3_id = Column(Integer, ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True)
    group = Column(String, nullable=True)  # For lab groups: Y, Z, Y/Z, Y/Z (Alternate)
    lab_room = Column(String, nullable=True)  # Lab room assignment
    lab_group_id = Column(String, nullable=True)  # To group multiple subjects in same lab slot
    
    class_ = relationship("Class", foreign_keys=[class_id])
    day = relationship("Day")
    period = relationship("Period")
    subject = relationship("Subject")
    lead_teacher = relationship("Teacher", foreign_keys=[lead_teacher_id])
    assist_teacher_1 = relationship("Teacher", foreign_keys=[assist_teacher_1_id])
    assist_teacher_2 = relationship("Teacher", foreign_keys=[assist_teacher_2_id])
    assist_teacher_3 = relationship("Teacher", foreign_keys=[assist_teacher_3_id])

class PositionRate(Base):
    __tablename__ = "position_rates"
    
    id = Column(Integer, primary_key=True, index=True)
    position = Column(String, unique=True, nullable=False)
    rate = Column(Float, nullable=False)  # Rate per period in NPR

class TeacherEffectiveLoad(Base):
    __tablename__ = "teacher_effective_loads"
    
    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id", ondelete="CASCADE"), unique=True, nullable=False)
    effective_load = Column(Float, nullable=False, default=20.0)
    position = Column(String, nullable=True)
    
    teacher = relationship("Teacher")

class CalendarEvent(Base):
    """Calendar events for tenant-specific academic calendar"""
    __tablename__ = "calendar_events"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    event_type = Column(String(50), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id", ondelete="CASCADE"), nullable=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True)
    location = Column(String(255), nullable=True)
    is_all_day = Column(Boolean, default=False)
    status = Column(String(20), default='scheduled')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    class_ = relationship("Class", back_populates="calendar_events")
    teacher = relationship("Teacher")
