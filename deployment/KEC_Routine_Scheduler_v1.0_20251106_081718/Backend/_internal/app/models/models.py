from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Time, Float
from sqlalchemy.orm import relationship
from app.core.database import Base

class Department(Base):
    __tablename__ = "departments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    code = Column(String, unique=True, nullable=False)
    
    programs = relationship("Programme", back_populates="department")
    teachers = relationship("Teacher", back_populates="department")

class Programme(Base):
    __tablename__ = "programmes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"))
    
    department = relationship("Department", back_populates="programs")
    semesters = relationship("Semester", back_populates="programme")

class Semester(Base):
    __tablename__ = "semesters"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    semester_number = Column(Integer, nullable=False)
    programme_id = Column(Integer, ForeignKey("programmes.id"))
    is_active = Column(Boolean, default=True)
    
    programme = relationship("Programme", back_populates="semesters")
    classes = relationship("Class", back_populates="semester")
    semester_subjects = relationship("SemesterSubject", back_populates="semester")

class Class(Base):
    __tablename__ = "classes"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    section = Column(String, nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id"))
    department_id = Column(Integer, ForeignKey("departments.id"))
    room_no = Column(String)
    effective_date = Column(String)  # Date in string format
    
    semester = relationship("Semester", back_populates="classes")
    department = relationship("Department")
    class_subject_teachers = relationship("ClassSubjectTeacher", back_populates="class_")
    schedules = relationship("Schedule", back_populates="class_")

class Subject(Base):
    __tablename__ = "subjects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    is_lab = Column(Boolean, default=False)
    credit_hours = Column(Integer, default=3)
    
    class_subject_teachers = relationship("ClassSubjectTeacher", back_populates="subject")
    semester_subjects = relationship("SemesterSubject", back_populates="subject")
    teacher_subjects = relationship("TeacherSubject", back_populates="subject")

class SemesterSubject(Base):
    __tablename__ = "semester_subjects"
    
    id = Column(Integer, primary_key=True, index=True)
    semester_id = Column(Integer, ForeignKey("semesters.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    
    semester = relationship("Semester", back_populates="semester_subjects")
    subject = relationship("Subject", back_populates="semester_subjects")

class Teacher(Base):
    __tablename__ = "teachers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    abbreviation = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True)
    phone = Column(String)
    recruitment = Column(String, nullable=False)  # Full Time or Part Time
    department_id = Column(Integer, ForeignKey("departments.id"))
    
    department = relationship("Department", back_populates="teachers")
    class_subject_teachers = relationship("ClassSubjectTeacher", back_populates="teacher")
    teacher_subjects = relationship("TeacherSubject", back_populates="teacher")

class TeacherSubject(Base):
    __tablename__ = "teacher_subjects"
    
    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    
    teacher = relationship("Teacher", back_populates="teacher_subjects")
    subject = relationship("Subject", back_populates="teacher_subjects")

class ClassSubjectTeacher(Base):
    __tablename__ = "class_subject_teachers"
    
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    teacher_id = Column(Integer, ForeignKey("teachers.id"))
    prac_group = Column(String)  # For lab groups
    lab_room = Column(String)
    
    class_ = relationship("Class", back_populates="class_subject_teachers")
    subject = relationship("Subject", back_populates="class_subject_teachers")
    teacher = relationship("Teacher", back_populates="class_subject_teachers")

class Day(Base):
    __tablename__ = "days"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    order = Column(Integer, unique=True, nullable=False)
    
    schedules = relationship("Schedule", back_populates="day")

class Period(Base):
    __tablename__ = "periods"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    order = Column(Integer, unique=True, nullable=False)
    
    schedules = relationship("Schedule", back_populates="period")

class Schedule(Base):
    __tablename__ = "schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"))
    day_id = Column(Integer, ForeignKey("days.id"))
    period_id = Column(Integer, ForeignKey("periods.id"))
    class_subject_teacher_id = Column(Integer, ForeignKey("class_subject_teachers.id"))
    room = Column(String)
    
    class_ = relationship("Class", back_populates="schedules")
    day = relationship("Day", back_populates="schedules")
    period = relationship("Period", back_populates="schedules")
    class_subject_teacher = relationship("ClassSubjectTeacher")

class Room(Base):
    __tablename__ = "rooms"
    
    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String, unique=True, nullable=False)
    building = Column(String)
    capacity = Column(Integer)

class ClassRoutineEntry(Base):
    __tablename__ = "class_routine_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"))
    day_id = Column(Integer, ForeignKey("days.id"))
    period_id = Column(Integer, ForeignKey("periods.id"))
    subject_id = Column(Integer, ForeignKey("subjects.id"))
    is_lab = Column(Boolean, default=False)
    is_half_lab = Column(Boolean, default=False)
    num_periods = Column(Integer, default=1)
    lead_teacher_id = Column(Integer, ForeignKey("teachers.id"))
    assist_teacher_1_id = Column(Integer, ForeignKey("teachers.id"), nullable=True)
    assist_teacher_2_id = Column(Integer, ForeignKey("teachers.id"), nullable=True)
    assist_teacher_3_id = Column(Integer, ForeignKey("teachers.id"), nullable=True)
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
    teacher_id = Column(Integer, ForeignKey("teachers.id"), unique=True, nullable=False)
    effective_load = Column(Float, nullable=False, default=20.0)
    position = Column(String, nullable=True)
    
    teacher = relationship("Teacher")
