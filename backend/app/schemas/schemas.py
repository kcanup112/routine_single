from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List, Any
from datetime import time, datetime, date

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
    programme_id: Optional[int] = None
    academic_year: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: bool = True

class SemesterCreate(SemesterBase):
    programme_id: Optional[int] = None
    department_id: Optional[int] = None  # Used in school mode instead of programme_id

class SemesterUpdate(SemesterBase):
    name: Optional[str] = None
    semester_number: Optional[int] = None
    programme_id: Optional[int] = None
    academic_year: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None

class Semester(SemesterBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Class Schemas
class ClassBase(BaseModel):
    name: str
    section: Optional[str] = None
    room_no: Optional[str] = None
    semester_id: Optional[int] = None
    shift_id: Optional[int] = None
    department_id: Optional[int] = None
    student_capacity: int = 60
    current_strength: int = 0
    is_active: bool = True
    academic_year: Optional[str] = None
    effective_date: Optional[date] = None

class ClassCreate(ClassBase):
    semester_id: int

class ClassUpdate(BaseModel):
    name: Optional[str] = None
    section: Optional[str] = None
    room_no: Optional[str] = None
    semester_id: Optional[int] = None
    shift_id: Optional[int] = None
    department_id: Optional[int] = None
    student_capacity: Optional[int] = None
    current_strength: Optional[int] = None
    is_active: Optional[bool] = None
    academic_year: Optional[str] = None
    effective_date: Optional[date] = None

class Class(ClassBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Subject Schemas
class SubjectBase(BaseModel):
    department_id: Optional[int] = None
    name: str
    code: Optional[str] = None
    credit_hours: Optional[int] = None
    is_lab: bool = False  # Whether subject has lab component
    description: Optional[str] = None
    is_active: bool = True

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(SubjectBase):
    name: Optional[str] = None
    code: Optional[str] = None
    department_id: Optional[int] = None
    credit_hours: Optional[int] = None
    is_lab: Optional[bool] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class Subject(SubjectBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Teacher Schemas
class TeacherBase(BaseModel):
    department_id: Optional[int] = None
    name: str
    abbreviation: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    employee_id: Optional[str] = None
    designation: Optional[str] = None
    qualification: Optional[str] = None
    employment_type: str = 'full_time'
    max_periods_per_week: int = 30
    unavailable_days: Optional[List[int]] = []  # List of day numbers (0-6)
    is_active: bool = True

class TeacherCreate(TeacherBase):
    pass

class TeacherUpdate(BaseModel):
    name: Optional[str] = None
    abbreviation: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    employee_id: Optional[str] = None
    designation: Optional[str] = None
    qualification: Optional[str] = None
    employment_type: Optional[str] = None
    department_id: Optional[int] = None
    max_periods_per_week: Optional[int] = None
    unavailable_days: Optional[List[int]] = None
    is_active: Optional[bool] = None

class Teacher(TeacherBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
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
    day_number: int
    is_working_day: bool = True

class DayCreate(DayBase):
    pass

class Day(DayBase):
    id: int
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Shift Schemas
class ShiftBase(BaseModel):
    name: str
    description: Optional[str] = None
    start_time: time
    end_time: time
    working_days: Optional[List[int]] = [0, 1, 2, 3, 4, 5]  # Sunday-Friday by default
    period_duration: Optional[int] = 50  # minutes
    break_after_periods: Optional[List[int]] = [2, 4]  # Break after which periods
    break_durations: Optional[List[int]] = [15, 60]  # Duration of breaks in minutes
    is_active: bool = True
    is_default: bool = False

class ShiftCreate(ShiftBase):
    pass

class Shift(ShiftBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    @field_validator('working_days', 'break_after_periods', 'break_durations', mode='before')
    @classmethod
    def parse_pg_array(cls, v):
        """Parse PostgreSQL array strings to Python lists"""
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            # PostgreSQL array format: {1,2,3}
            clean = v.strip('{}').strip()
            if not clean:
                return []
            return [int(x.strip()) for x in clean.split(',') if x.strip()]
        return v
    
    class Config:
        from_attributes = True

# Period Schemas
class PeriodBase(BaseModel):
    shift_id: int
    period_number: int
    name: Optional[str] = None
    start_time: time
    end_time: time
    type: str  # 'teaching', 'break', 'lunch'
    is_teaching_period: bool = True
    is_active: bool = True

class PeriodCreate(PeriodBase):
    pass

class Period(PeriodBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
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
    name: Optional[str] = None
    building: Optional[str] = None
    description: Optional[str] = None
    floor: Optional[str] = None
    capacity: Optional[int] = None
    type: Optional[str] = None  # 'classroom', 'lab', 'auditorium'
    room_type: Optional[str] = None
    facilities: Optional[List[str]] = []
    is_active: bool = True
    is_available: bool = True

class RoomCreate(RoomBase):
    pass

class RoomUpdate(BaseModel):
    room_number: Optional[str] = None
    name: Optional[str] = None
    building: Optional[str] = None
    description: Optional[str] = None
    floor: Optional[str] = None
    capacity: Optional[int] = None
    type: Optional[str] = None
    room_type: Optional[str] = None
    facilities: Optional[List[str]] = None
    is_active: Optional[bool] = None
    is_available: Optional[bool] = None

class Room(RoomBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
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

# Tenant Signup Schemas
class TenantSignupRequest(BaseModel):
    # Institution info
    institution_name: str
    subdomain: str  # 3-63 chars, lowercase, alphanumeric + hyphen
    institution_type: str = "engineering"  # "engineering" or "school"
    
    # Admin user
    admin_name: str
    admin_email: EmailStr
    admin_password: str
    
    # Contact (optional)
    phone: Optional[str] = None
    city: Optional[str] = None
    country: str = "Nepal"
    
    # Plan
    plan: str = "trial"
    
    class Config:
        json_schema_extra = {
            "example": {
                "institution_name": "Kantipur Engineering College",
                "subdomain": "kec",
                "institution_type": "engineering",
                "admin_name": "Admin User",
                "admin_email": "admin@kec.edu.np",
                "admin_password": "SecurePass123!",
                "phone": "+977-1-1234567",
                "city": "Kathmandu",
                "country": "Nepal",
                "plan": "trial"
            }
        }

class TenantResponse(BaseModel):
    id: int
    name: str
    subdomain: str
    schema_name: str
    admin_email: str
    status: str
    plan: str
    institution_type: Optional[str] = "engineering"
    trial_ends_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class SubdomainCheckResponse(BaseModel):
    available: bool
    subdomain: str
    message: str
    suggestions: Optional[List[str]] = None

class TenantSignupResponse(BaseModel):
    tenant: TenantResponse
    admin_user: dict
    access_token: str
    token_type: str = "bearer"
    message: str
