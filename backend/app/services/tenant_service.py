"""
Tenant Service
Handles tenant creation, validation, and management for multi-tenant SaaS
"""
import re
from datetime import datetime, timedelta
from typing import Optional, Tuple, List
from sqlalchemy.orm import Session
from sqlalchemy import text, create_engine
from app.core.database_saas import SessionLocal, engine
from app.models.models_saas import Tenant, User
from app.core.config_saas import settings
from app.auth.password import get_password_hash
import logging

logger = logging.getLogger(__name__)


def validate_subdomain_format(subdomain: str) -> Tuple[bool, str]:
    """
    Validate subdomain format
    Returns: (is_valid, error_message)
    """
    # Check length
    if len(subdomain) < 3:
        return False, "Subdomain must be at least 3 characters long"
    if len(subdomain) > 63:
        return False, "Subdomain must be at most 63 characters long"
    
    # Check format: lowercase alphanumeric + hyphens only
    if not re.match(r'^[a-z0-9-]+$', subdomain):
        return False, "Subdomain must contain only lowercase letters, numbers, and hyphens"
    
    # Cannot start or end with hyphen
    if subdomain.startswith('-') or subdomain.endswith('-'):
        return False, "Subdomain cannot start or end with a hyphen"
    
    # Cannot have consecutive hyphens
    if '--' in subdomain:
        return False, "Subdomain cannot contain consecutive hyphens"
    
    # Reserved subdomains
    reserved = ['www', 'api', 'admin', 'app', 'mail', 'ftp', 'localhost', 
                'test', 'staging', 'dev', 'demo', 'support', 'help', 'docs',
                'blog', 'portal', 'dashboard', 'console', 'public', 'private']
    if subdomain in reserved:
        return False, f"'{subdomain}' is a reserved subdomain"
    
    return True, ""


def check_subdomain_availability(db: Session, subdomain: str) -> bool:
    """Check if subdomain is available"""
    existing = db.query(Tenant).filter(
        Tenant.subdomain == subdomain,
        Tenant.deleted_at.is_(None)
    ).first()
    return existing is None


def generate_subdomain_suggestions(base_subdomain: str, db: Session) -> List[str]:
    """Generate alternative subdomain suggestions"""
    suggestions = []
    
    # Try with numbers
    for i in range(1, 6):
        suggestion = f"{base_subdomain}{i}"
        if check_subdomain_availability(db, suggestion):
            suggestions.append(suggestion)
            if len(suggestions) >= 3:
                break
    
    # Try with suffixes
    suffixes = ['edu', 'college', 'institute', 'academy', 'school']
    for suffix in suffixes:
        suggestion = f"{base_subdomain}-{suffix}"
        if check_subdomain_availability(db, suggestion):
            suggestions.append(suggestion)
            if len(suggestions) >= 3:
                break
    
    return suggestions[:3]


def create_tenant_schema(schema_name: str, db: Session) -> bool:
    """
    Create PostgreSQL schema for tenant and execute template SQL
    Returns: True if successful, False otherwise
    
    NOTE: Does NOT commit. Caller is responsible for committing the transaction
    so that tenant record and schema tables become visible atomically.
    """
    try:
        # Create schema (quote name to allow hyphens)
        db.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{schema_name}"'))
        logger.info(f"Created schema: {schema_name}")
        
        # Execute each table creation separately to avoid SQL parsing issues
        # NOTE: Column definitions MUST match ORM models in app/models/models.py
        statements = [
            # shifts - matches Shift model
            f'CREATE TABLE IF NOT EXISTS "{schema_name}".shifts (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, description TEXT, start_time TIME NOT NULL, end_time TIME NOT NULL, working_days VARCHAR DEFAULT \'{{0,1,2,3,4,5}}\', period_duration INTEGER NOT NULL DEFAULT 50, break_after_periods VARCHAR DEFAULT \'{{2,4}}\', break_durations VARCHAR DEFAULT \'{{15,60}}\', is_active BOOLEAN NOT NULL DEFAULT true, is_default BOOLEAN DEFAULT false, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, deleted_at TIMESTAMP)',

            # periods - matches Period model
            f'CREATE TABLE IF NOT EXISTS "{schema_name}".periods (id SERIAL PRIMARY KEY, shift_id INTEGER NOT NULL REFERENCES "{schema_name}".shifts(id) ON DELETE CASCADE, period_number INTEGER NOT NULL, name VARCHAR(100), start_time TIME NOT NULL, end_time TIME NOT NULL, type VARCHAR(20) NOT NULL DEFAULT \'teaching\', is_teaching_period BOOLEAN DEFAULT true, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',

            # departments - matches Department model (code nullable, name unique)
            f'CREATE TABLE IF NOT EXISTS "{schema_name}".departments (id SERIAL PRIMARY KEY, name VARCHAR(200) UNIQUE NOT NULL, code VARCHAR(50), description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, deleted_at TIMESTAMP)',

            # programmes - matches Programme model (code nullable)
            f'CREATE TABLE IF NOT EXISTS "{schema_name}".programmes (id SERIAL PRIMARY KEY, department_id INTEGER REFERENCES "{schema_name}".departments(id), name VARCHAR(200) NOT NULL, code VARCHAR(50), duration_years INTEGER, description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, deleted_at TIMESTAMP)',

            # semesters - matches Semester model
            f'CREATE TABLE IF NOT EXISTS "{schema_name}".semesters (id SERIAL PRIMARY KEY, programme_id INTEGER NOT NULL REFERENCES "{schema_name}".programmes(id), name VARCHAR(100) NOT NULL, semester_number INTEGER NOT NULL, academic_year VARCHAR(20), start_date DATE, end_date DATE, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, deleted_at TIMESTAMP)',

            # classes - matches Class model (section VARCHAR(50), department_id FK)
            f'CREATE TABLE IF NOT EXISTS "{schema_name}".classes (id SERIAL PRIMARY KEY, semester_id INTEGER NOT NULL REFERENCES "{schema_name}".semesters(id), shift_id INTEGER REFERENCES "{schema_name}".shifts(id), department_id INTEGER REFERENCES "{schema_name}".departments(id), name VARCHAR(200) NOT NULL, section VARCHAR(50), room_no VARCHAR(50), student_capacity INTEGER DEFAULT 60, current_strength INTEGER DEFAULT 0, is_active BOOLEAN DEFAULT true, academic_year VARCHAR(20), effective_date DATE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, deleted_at TIMESTAMP)',

            # teachers - matches Teacher model (qualification TEXT, email/employee_id UNIQUE)
            f'CREATE TABLE IF NOT EXISTS "{schema_name}".teachers (id SERIAL PRIMARY KEY, department_id INTEGER REFERENCES "{schema_name}".departments(id), name VARCHAR(200) NOT NULL, abbreviation VARCHAR(50), email VARCHAR(255) UNIQUE, phone VARCHAR(20), employee_id VARCHAR(50) UNIQUE, designation VARCHAR(100), qualification TEXT, employment_type VARCHAR(20) DEFAULT \'full_time\', max_periods_per_week INTEGER DEFAULT 30, unavailable_days INTEGER[], is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, deleted_at TIMESTAMP)',

            # subjects - matches Subject model (code VARCHAR(50) UNIQUE)
            f'CREATE TABLE IF NOT EXISTS "{schema_name}".subjects (id SERIAL PRIMARY KEY, department_id INTEGER REFERENCES "{schema_name}".departments(id), name VARCHAR(200) NOT NULL, code VARCHAR(50) UNIQUE, credit_hours INTEGER, is_lab BOOLEAN DEFAULT false, description TEXT, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, deleted_at TIMESTAMP)',

            # semester_subjects - matches SemesterSubject model
            f'CREATE TABLE IF NOT EXISTS "{schema_name}".semester_subjects (id SERIAL PRIMARY KEY, semester_id INTEGER NOT NULL REFERENCES "{schema_name}".semesters(id) ON DELETE CASCADE, subject_id INTEGER NOT NULL REFERENCES "{schema_name}".subjects(id) ON DELETE CASCADE, periods_per_week INTEGER DEFAULT 3, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, deleted_at TIMESTAMP, UNIQUE(semester_id, subject_id))',

            # teacher_subjects - matches TeacherSubject model
            f'CREATE TABLE IF NOT EXISTS "{schema_name}".teacher_subjects (id SERIAL PRIMARY KEY, teacher_id INTEGER NOT NULL REFERENCES "{schema_name}".teachers(id) ON DELETE CASCADE, subject_id INTEGER NOT NULL REFERENCES "{schema_name}".subjects(id) ON DELETE CASCADE, proficiency_level VARCHAR(50) DEFAULT \'expert\', preferred BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(teacher_id, subject_id))',

            # rooms - matches Room model (room_number VARCHAR(50))
            f'CREATE TABLE IF NOT EXISTS "{schema_name}".rooms (id SERIAL PRIMARY KEY, room_number VARCHAR(50) NOT NULL UNIQUE, name VARCHAR(200), building VARCHAR(200), floor VARCHAR(50), capacity INTEGER, type VARCHAR(50), room_type VARCHAR(50), facilities TEXT[], description TEXT, is_active BOOLEAN DEFAULT true, is_available BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, deleted_at TIMESTAMP)',

            # days - matches Day model (name VARCHAR(50))
            f'CREATE TABLE IF NOT EXISTS "{schema_name}".days (id SERIAL PRIMARY KEY, name VARCHAR(50) NOT NULL, day_number INTEGER NOT NULL UNIQUE, is_working_day BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',

            # schedules - kept for legacy/backward compat (no ORM model)
            f'CREATE TABLE IF NOT EXISTS "{schema_name}".schedules (id SERIAL PRIMARY KEY, class_id INTEGER REFERENCES "{schema_name}".classes(id) ON DELETE CASCADE, day_id INTEGER REFERENCES "{schema_name}".days(id), period_id INTEGER REFERENCES "{schema_name}".periods(id), subject_id INTEGER REFERENCES "{schema_name}".subjects(id), teacher_id INTEGER REFERENCES "{schema_name}".teachers(id), room_id INTEGER REFERENCES "{schema_name}".rooms(id), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',

            # class_routines - matches ClassRoutine model
            f'CREATE TABLE IF NOT EXISTS "{schema_name}".class_routines (id SERIAL PRIMARY KEY, class_id INTEGER NOT NULL REFERENCES "{schema_name}".classes(id) ON DELETE CASCADE, day_id INTEGER NOT NULL REFERENCES "{schema_name}".days(id) ON DELETE CASCADE, period_id INTEGER NOT NULL REFERENCES "{schema_name}".periods(id) ON DELETE CASCADE, subject_id INTEGER REFERENCES "{schema_name}".subjects(id) ON DELETE CASCADE, teacher_id INTEGER REFERENCES "{schema_name}".teachers(id) ON DELETE SET NULL, room_no VARCHAR(50), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',

            # class_routine_entries - matches ClassRoutineEntry model
            f'CREATE TABLE IF NOT EXISTS "{schema_name}".class_routine_entries (id SERIAL PRIMARY KEY, class_id INTEGER REFERENCES "{schema_name}".classes(id) ON DELETE CASCADE, day_id INTEGER REFERENCES "{schema_name}".days(id), period_id INTEGER REFERENCES "{schema_name}".periods(id), subject_id INTEGER REFERENCES "{schema_name}".subjects(id), is_lab BOOLEAN DEFAULT false, is_half_lab BOOLEAN DEFAULT false, num_periods INTEGER DEFAULT 1, lead_teacher_id INTEGER REFERENCES "{schema_name}".teachers(id), assist_teacher_1_id INTEGER REFERENCES "{schema_name}".teachers(id), assist_teacher_2_id INTEGER REFERENCES "{schema_name}".teachers(id), assist_teacher_3_id INTEGER REFERENCES "{schema_name}".teachers(id), "group" VARCHAR(50), lab_room VARCHAR(50), lab_group_id VARCHAR(50), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',

            # calendar_events - matches CalendarEvent model (extra is_holiday/color kept)
            f'CREATE TABLE IF NOT EXISTS "{schema_name}".calendar_events (id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL, description TEXT, start_date DATE NOT NULL, end_date DATE NOT NULL, start_time TIME, end_time TIME, event_type VARCHAR(50) NOT NULL, class_id INTEGER REFERENCES "{schema_name}".classes(id) ON DELETE CASCADE, teacher_id INTEGER REFERENCES "{schema_name}".teachers(id) ON DELETE SET NULL, location VARCHAR(255), is_all_day BOOLEAN DEFAULT false, status VARCHAR(20) DEFAULT \'scheduled\', is_holiday BOOLEAN DEFAULT false, color VARCHAR(20), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',

            # position_rates - matches PositionRate model
            f'CREATE TABLE IF NOT EXISTS "{schema_name}".position_rates (id SERIAL PRIMARY KEY, position VARCHAR UNIQUE NOT NULL, rate DOUBLE PRECISION NOT NULL)',

            # teacher_effective_loads - matches TeacherEffectiveLoad model
            f'CREATE TABLE IF NOT EXISTS "{schema_name}".teacher_effective_loads (id SERIAL PRIMARY KEY, teacher_id INTEGER UNIQUE NOT NULL REFERENCES "{schema_name}".teachers(id), effective_load DOUBLE PRECISION NOT NULL DEFAULT 20.0, position VARCHAR)',
        ]
        
        # Execute each statement individually
        for stmt in statements:
            db.execute(text(stmt))
        
        # Insert default days (Sunday-Saturday with working day flags)
        days_insert = f"""INSERT INTO "{schema_name}".days (name, day_number, is_working_day) VALUES 
            ('Sunday', 0, true), ('Monday', 1, true), ('Tuesday', 2, true), 
            ('Wednesday', 3, true), ('Thursday', 4, true), ('Friday', 5, true), 
            ('Saturday', 6, false) ON CONFLICT (day_number) DO NOTHING"""
        db.execute(text(days_insert))
        
        # Create default shift (Morning Shift)
        shift_insert = f"""INSERT INTO "{schema_name}".shifts 
            (name, description, start_time, end_time, working_days, period_duration, break_after_periods, break_durations, is_active, is_default) 
            VALUES ('Morning Shift', 'Default morning shift', '07:00:00', '15:30:00', '{{0,1,2,3,4,5}}', 50, '{{2,4}}', '{{15,60}}', true, true) 
            RETURNING id"""
        shift_result = db.execute(text(shift_insert))
        shift_id = shift_result.fetchone()[0]
        
        # Insert 10 default periods (7:00 AM - 3:30 PM, 50 minutes each)
        periods_data = []
        start_hour = 7
        period_duration = 50  # minutes
        
        for i in range(1, 11):
            # Calculate start time
            total_minutes = (i - 1) * period_duration
            current_start_hour = start_hour + (total_minutes // 60)
            current_start_minute = total_minutes % 60
            
            # Calculate end time
            total_end_minutes = i * period_duration
            current_end_hour = start_hour + (total_end_minutes // 60)
            current_end_minute = total_end_minutes % 60
            
            start_time = f"{current_start_hour:02d}:{current_start_minute:02d}:00"
            end_time = f"{current_end_hour:02d}:{current_end_minute:02d}:00"
            
            suffix = "st" if i == 1 else "nd" if i == 2 else "rd" if i == 3 else "th"
            period_name = f"{i}{suffix} Period"
            
            periods_data.append(f"({shift_id}, {i}, '{period_name}', '{start_time}', '{end_time}', 'teaching', true, true)")
        
        periods_insert = f"""INSERT INTO "{schema_name}".periods 
            (shift_id, period_number, name, start_time, end_time, type, is_teaching_period, is_active) 
            VALUES {', '.join(periods_data)}"""
        db.execute(text(periods_insert))
        
        # Do NOT commit here - let caller commit atomically
        logger.info(f"Executed schema template for: {schema_name} (7 days, 1 shift, 10 periods)")
        
        return True
        
    except Exception as e:
        logger.error(f"Error creating schema {schema_name}: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return False


def create_admin_user(
    db: Session, 
    tenant_id: int, 
    admin_name: str, 
    admin_email: str, 
    admin_password: str
) -> Optional[User]:
    """Create admin user for tenant"""
    try:
        # Hash password
        password_hash = get_password_hash(admin_password)
        
        # Create user
        admin_user = User(
            tenant_id=tenant_id,
            email=admin_email,
            password_hash=password_hash,
            full_name=admin_name,
            role='admin',
            is_active=True,
            is_verified=True,  # Auto-verify admin user
            email_verified_at=datetime.utcnow(),
            created_at=datetime.utcnow()
        )
        
        db.add(admin_user)
        db.flush()  # Get admin_user.id without committing
        
        logger.info(f"Created admin user: {admin_email} for tenant: {tenant_id}")
        return admin_user
        
    except Exception as e:
        logger.error(f"Error creating admin user: {str(e)}")
        db.rollback()
        return None


def create_tenant_with_schema(
    db: Session,
    institution_name: str,
    subdomain: str,
    admin_name: str,
    admin_email: str,
    admin_password: str,
    phone: Optional[str] = None,
    city: Optional[str] = None,
    country: str = "Nepal",
    plan: str = "trial"
) -> Tuple[Optional[Tenant], Optional[User], Optional[str]]:
    """
    Create tenant with schema and admin user
    Returns: (tenant, admin_user, error_message)
    """
    try:
        # Validate subdomain format
        is_valid, error_msg = validate_subdomain_format(subdomain)
        if not is_valid:
            return None, None, error_msg
        
        # Check availability
        if not check_subdomain_availability(db, subdomain):
            return None, None, f"Subdomain '{subdomain}' is already taken"
        
        # Check email uniqueness (no tenant_id constraint for signup)
        existing_email = db.query(User).filter(User.email == admin_email).first()
        if existing_email:
            return None, None, f"Email '{admin_email}' is already registered"
        
        # Calculate trial end date
        trial_ends_at = datetime.utcnow() + timedelta(days=settings.TRIAL_DAYS)
        
        # Create tenant record
        tenant = Tenant(
            name=institution_name,
            subdomain=subdomain.lower(),
            schema_name=subdomain.lower(),
            admin_email=admin_email,
            admin_name=admin_name,
            phone=phone,
            city=city,
            country=country,
            plan=plan,
            status='trial' if plan == 'trial' else 'active',
            trial_ends_at=trial_ends_at if plan == 'trial' else None,
            settings={
                "working_days": [0, 1, 2, 3, 4, 5],
                "weekend": [6],
                "time_zone": "Asia/Kathmandu",
                "locale": "en-US",
                "calendar_type": "ad",
                "academic_year_start_month": 8
            },
            max_teachers=50 if plan == 'trial' else 100,
            max_students=500 if plan == 'trial' else 2000,
            max_classes=20 if plan == 'trial' else 50,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(tenant)
        db.flush()  # Get tenant.id without committing
        
        # Create PostgreSQL schema
        schema_created = create_tenant_schema(tenant.schema_name, db)
        if not schema_created:
            db.rollback()
            return None, None, "Failed to create database schema"
        
        # Create admin user
        admin_user = create_admin_user(
            db, 
            tenant.id, 
            admin_name, 
            admin_email, 
            admin_password
        )
        
        if not admin_user:
            db.rollback()
            # Try to drop schema if user creation failed
            try:
                db.execute(text(f"DROP SCHEMA IF EXISTS {tenant.schema_name} CASCADE"))
                db.commit()
            except:
                pass
            return None, None, "Failed to create admin user"
        
        # Commit everything atomically - tenant record, schema tables, and admin user
        # all become visible to other connections at the same time
        db.commit()
        db.refresh(tenant)
        db.refresh(admin_user)
        
        logger.info(f"Successfully created tenant: {subdomain} with admin: {admin_email}")
        return tenant, admin_user, None
        
    except Exception as e:
        logger.error(f"Error in create_tenant_with_schema: {str(e)}")
        db.rollback()
        return None, None, f"An error occurred: {str(e)}"


def delete_tenant_schema(schema_name: str, db: Session) -> bool:
    """Delete tenant schema (CASCADE)"""
    try:
        db.execute(text(f'DROP SCHEMA IF EXISTS "{schema_name}" CASCADE'))
        db.commit()
        logger.info(f"Deleted schema: {schema_name}")
        return True
    except Exception as e:
        logger.error(f"Error deleting schema {schema_name}: {str(e)}")
        db.rollback()
        return False
