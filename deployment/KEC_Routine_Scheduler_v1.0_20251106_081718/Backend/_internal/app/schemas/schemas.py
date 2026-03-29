from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import time

# Department Schemas
class DepartmentBase(BaseModel):
    name: str
    code: str

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(DepartmentBase):
    name: Optional[str] = None
    code: Optional[str] = None

class Department(DepartmentBase):
    id: int
    
    class Config:
        from_attributes = True

# Programme Schemas
class ProgrammeBase(BaseModel):
    name: str
    code: str
    department_id: int

class ProgrammeCreate(ProgrammeBase):
    pass

class ProgrammeUpdate(ProgrammeBase):
    name: Optional[str] = None
    code: Optional[str] = None
    department_id: Optional[int] = None

class Programme(ProgrammeBase):
    id: int
    
    class Config:
        from_attributes = True

# Semester Schemas
class SemesterBase(BaseModel):
    name: str
    semester_number: int
    programme_id: int
    is_active: bool = True

class SemesterCreate(SemesterBase):
    pass

class SemesterUpdate(SemesterBase):
    name: Optional[str] = None
    semester_number: Optional[int] = None
    programme_id: Optional[int] = None
    is_active: Optional[bool] = None

class Semester(SemesterBase):
    id: int
    
    class Config:
        from_attributes = True

# Class Schemas
class ClassBase(BaseModel):
    name: str
    section: str
    semester_id: int
    department_id: int
    room_no: Optional[str] = None
    effective_date: Optional[str] = None

class ClassCreate(ClassBase):
    pass

class ClassUpdate(BaseModel):
    name: Optional[str] = None
    section: Optional[str] = None
    semester_id: Optional[int] = None
    department_id: Optional[int] = None
    room_no: Optional[str] = None
    effective_date: Optional[str] = None

class Class(ClassBase):
    id: int
    
    class Config:
        from_attributes = True

# Subject Schemas
class SubjectBase(BaseModel):
    name: str
    code: str
    is_lab: bool = False
    credit_hours: int = 3

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(SubjectBase):
    name: Optional[str] = None
    code: Optional[str] = None
    is_lab: Optional[bool] = None
    credit_hours: Optional[int] = None

class Subject(SubjectBase):
    id: int
    
    class Config:
        from_attributes = True

# Teacher Schemas
class TeacherBase(BaseModel):
    name: str
    abbreviation: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    recruitment: str  # Full Time or Part Time
    department_id: Optional[int] = None

class TeacherCreate(TeacherBase):
    pass

class TeacherUpdate(BaseModel):
    name: Optional[str] = None
    abbreviation: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    recruitment: Optional[str] = None
    department_id: Optional[int] = None

class Teacher(TeacherBase):
    id: int
    
    class Config:
        from_attributes = True

# ClassSubjectTeacher Schemas
class ClassSubjectTeacherBase(BaseModel):
    class_id: int
    subject_id: int
    teacher_id: int
    prac_group: Optional[str] = None
    lab_room: Optional[str] = None

class ClassSubjectTeacherCreate(ClassSubjectTeacherBase):
    pass

class ClassSubjectTeacherUpdate(ClassSubjectTeacherBase):
    class_id: Optional[int] = None
    subject_id: Optional[int] = None
    teacher_id: Optional[int] = None
    prac_group: Optional[str] = None
    lab_room: Optional[str] = None

class ClassSubjectTeacher(ClassSubjectTeacherBase):
    id: int
    
    class Config:
        from_attributes = True

# Day Schemas
class DayBase(BaseModel):
    name: str
    order: int

class DayCreate(DayBase):
    pass

class Day(DayBase):
    id: int
    
    class Config:
        from_attributes = True

# Period Schemas
class PeriodBase(BaseModel):
    name: str
    start_time: time
    end_time: time
    order: int

class PeriodCreate(PeriodBase):
    pass

class Period(PeriodBase):
    id: int
    
    class Config:
        from_attributes = True

# Schedule Schemas
class ScheduleBase(BaseModel):
    class_id: int
    day_id: int
    period_id: int
    class_subject_teacher_id: int
    room: Optional[str] = None

class ScheduleCreate(ScheduleBase):
    pass

class ScheduleUpdate(ScheduleBase):
    class_id: Optional[int] = None
    day_id: Optional[int] = None
    period_id: Optional[int] = None
    class_subject_teacher_id: Optional[int] = None
    room: Optional[str] = None

class Schedule(ScheduleBase):
    id: int
    
    class Config:
        from_attributes = True

# SemesterSubject Schemas
class SemesterSubjectBase(BaseModel):
    semester_id: int
    subject_id: int

class SemesterSubjectCreate(SemesterSubjectBase):
    pass

class SemesterSubject(SemesterSubjectBase):
    id: int
    
    class Config:
        from_attributes = True

# Room Schemas
class RoomBase(BaseModel):
    room_number: str
    building: Optional[str] = None
    capacity: Optional[int] = None

class RoomCreate(RoomBase):
    pass

class RoomUpdate(BaseModel):
    room_number: Optional[str] = None
    building: Optional[str] = None
    capacity: Optional[int] = None

class Room(RoomBase):
    id: int
    
    class Config:
        from_attributes = True

# Position Rate Schemas
class PositionRateBase(BaseModel):
    position: str
    rate: float

class PositionRateCreate(PositionRateBase):
    pass

class PositionRateUpdate(BaseModel):
    rate: Optional[float] = None

class PositionRateResponse(PositionRateBase):
    id: int
    
    class Config:
        from_attributes = True

# Teacher Effective Load Schemas
class TeacherEffectiveLoadBase(BaseModel):
    teacher_id: int
    effective_load: float
    position: Optional[str] = None

class TeacherEffectiveLoadCreate(TeacherEffectiveLoadBase):
    pass

class TeacherEffectiveLoadUpdate(BaseModel):
    effective_load: Optional[float] = None
    position: Optional[str] = None

class TeacherEffectiveLoadResponse(TeacherEffectiveLoadBase):
    id: int
    
    class Config:
        from_attributes = True
