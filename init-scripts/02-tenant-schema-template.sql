-- ===================================================================
-- APPLICATION SCHEMA
-- Creates all application tables (departments, teachers, classes, etc.)
-- Run once during initial setup
-- ===================================================================

-- Shifts (Multi-shift support)
CREATE TABLE IF NOT EXISTS shifts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Timing
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Working days (array of day numbers: 0=Sunday, 1=Monday, etc.)
    working_days INTEGER[] NOT NULL DEFAULT '{0,1,2,3,4,5}',
    
    -- Period configuration
    period_duration INTEGER NOT NULL DEFAULT 50, -- minutes
    break_after_periods INTEGER[] DEFAULT '{2,4}', -- Break after which periods
    break_durations INTEGER[] DEFAULT '{15,60}', -- Duration of each break in minutes
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_shifts_active ON shifts(is_active) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_shifts_default ON shifts(is_default) WHERE is_default = TRUE AND deleted_at IS NULL;

-- Periods (Auto-generated based on shift configuration)
CREATE TABLE IF NOT EXISTS periods (
    id SERIAL PRIMARY KEY,
    shift_id INTEGER NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    
    -- Period info
    period_number INTEGER NOT NULL,
    name VARCHAR(100), -- e.g., "Period 1", "Morning Break", "Lunch Break"
    
    -- Timing
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Type
    type VARCHAR(20) NOT NULL CHECK (type IN ('teaching', 'break', 'lunch')),
    is_teaching_period BOOLEAN DEFAULT TRUE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_period_per_shift UNIQUE (shift_id, period_number)
);

CREATE INDEX idx_periods_shift ON periods(shift_id);
CREATE INDEX idx_periods_teaching ON periods(is_teaching_period);

-- Class Period Overrides (Custom timings for specific classes)
CREATE TABLE IF NOT EXISTS class_period_overrides (
    id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL,
    period_id INTEGER NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
    
    -- Override timing
    custom_start_time TIME NOT NULL,
    custom_end_time TIME NOT NULL,
    
    -- Reason
    reason TEXT,
    
    -- Effective dates
    effective_from DATE,
    effective_to DATE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_class_period_override UNIQUE (class_id, period_id)
);

-- Departments
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL UNIQUE,
    code VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Programmes
CREATE TABLE IF NOT EXISTS programmes (
    id SERIAL PRIMARY KEY,
    department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50),
    duration_years INTEGER,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Semesters
CREATE TABLE IF NOT EXISTS semesters (
    id SERIAL PRIMARY KEY,
    programme_id INTEGER NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    semester_number INTEGER NOT NULL,
    academic_year VARCHAR(20),
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Classes (Now includes shift assignment)
CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    semester_id INTEGER NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    shift_id INTEGER REFERENCES shifts(id) ON DELETE SET NULL,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    
    name VARCHAR(200) NOT NULL,
    section VARCHAR(50),
    room_no VARCHAR(50),
    
    -- Capacity
    student_capacity INTEGER DEFAULT 60,
    current_strength INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Academic year
    academic_year VARCHAR(20),
    effective_date DATE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_classes_semester ON classes(semester_id);
CREATE INDEX idx_classes_shift ON classes(shift_id);

-- Teachers
CREATE TABLE IF NOT EXISTS teachers (
    id SERIAL PRIMARY KEY,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    user_id INTEGER,  -- Links to public.users for login access
    
    name VARCHAR(200) NOT NULL,
    abbreviation VARCHAR(50),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    
    -- Employment
    employee_id VARCHAR(50) UNIQUE,
    designation VARCHAR(100),
    qualification TEXT,
    employment_type VARCHAR(20) DEFAULT 'full_time',
    
    -- Availability
    max_periods_per_week INTEGER DEFAULT 30,
    unavailable_days INTEGER[] DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_teachers_department ON teachers(department_id);
CREATE INDEX idx_teachers_email ON teachers(email);

-- Subjects
CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE,
    
    -- Subject info
    credit_hours INTEGER,
    is_lab BOOLEAN DEFAULT FALSE,
    type VARCHAR(50),
    description TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Semester Subjects (Subject-Semester mapping)
CREATE TABLE IF NOT EXISTS semester_subjects (
    id SERIAL PRIMARY KEY,
    semester_id INTEGER NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    
    -- Teaching hours
    periods_per_week INTEGER DEFAULT 3,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    CONSTRAINT unique_semester_subject UNIQUE (semester_id, subject_id)
);

-- Teacher Subjects (Teacher-Subject assignment)
CREATE TABLE IF NOT EXISTS teacher_subjects (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    
    -- Proficiency
    proficiency_level VARCHAR(50) DEFAULT 'expert',
    preferred BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_teacher_subject UNIQUE (teacher_id, subject_id)
);

-- Rooms
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    room_number VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200),
    building VARCHAR(200),
    description TEXT,
    floor VARCHAR(50),
    
    -- Capacity
    capacity INTEGER,
    
    -- Type
    type VARCHAR(50),
    room_type VARCHAR(50),
    facilities TEXT[],
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_available BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Days
CREATE TABLE IF NOT EXISTS days (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    day_number INTEGER UNIQUE NOT NULL,
    is_working_day BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Class Routines (The actual schedule)
CREATE TABLE IF NOT EXISTS class_routines (
    id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    day_id INTEGER NOT NULL REFERENCES days(id) ON DELETE CASCADE,
    period_id INTEGER NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
    
    -- Teaching assignment
    semester_subject_id INTEGER REFERENCES semester_subjects(id) ON DELETE CASCADE,
    teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
    room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Notes
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    CONSTRAINT unique_class_day_period UNIQUE (class_id, day_id, period_id)
);

CREATE INDEX idx_class_routines_class ON class_routines(class_id);
CREATE INDEX idx_class_routines_teacher ON class_routines(teacher_id);
CREATE INDEX idx_class_routines_day ON class_routines(day_id);

-- Class Routine Entries (Detailed per-period schedule with multi-teacher support)
CREATE TABLE IF NOT EXISTS class_routine_entries (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    day_id INTEGER REFERENCES days(id) ON DELETE CASCADE,
    period_id INTEGER REFERENCES periods(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,

    -- Lab settings
    is_lab BOOLEAN DEFAULT FALSE,
    is_half_lab BOOLEAN DEFAULT FALSE,
    num_periods INTEGER DEFAULT 1,

    -- Teacher assignments
    lead_teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
    assist_teacher_1_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
    assist_teacher_2_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
    assist_teacher_3_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,

    -- Lab grouping
    "group" VARCHAR,
    lab_room VARCHAR,
    lab_group_id VARCHAR
);

CREATE INDEX IF NOT EXISTS ix_cre_class_day_period ON class_routine_entries(class_id, day_id, period_id);
CREATE INDEX IF NOT EXISTS ix_cre_teacher_day ON class_routine_entries(lead_teacher_id, day_id);
CREATE INDEX IF NOT EXISTS ix_cre_class_subject ON class_routine_entries(class_id, subject_id);

-- Position Rates (for finance/workload calculations)
CREATE TABLE IF NOT EXISTS position_rates (
    id SERIAL PRIMARY KEY,
    position VARCHAR UNIQUE NOT NULL,
    rate FLOAT NOT NULL
);

-- Teacher Effective Loads
CREATE TABLE IF NOT EXISTS teacher_effective_loads (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER UNIQUE NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    effective_load FLOAT NOT NULL DEFAULT 20.0,
    position VARCHAR
);

-- Academic Calendar Events
CREATE TABLE IF NOT EXISTS calendar_events (
    id SERIAL PRIMARY KEY,
    
    -- Event details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Date & Time
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    
    -- Type
    event_type VARCHAR(50) NOT NULL,
    
    -- Associations
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
    
    -- Location
    location VARCHAR(255),
    
    -- Status
    is_all_day BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'scheduled',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_calendar_events_dates ON calendar_events(start_date, end_date);
CREATE INDEX idx_calendar_events_type ON calendar_events(event_type);

-- Insert default days
INSERT INTO days (name, day_number, is_working_day) VALUES
    ('Sunday', 0, true),
    ('Monday', 1, true),
    ('Tuesday', 2, true),
    ('Wednesday', 3, true),
    ('Thursday', 4, true),
    ('Friday', 5, false),
    ('Saturday', 6, false)
ON CONFLICT (day_number) DO NOTHING;

COMMENT ON TABLE shifts IS 'Different shifts (Morning, Day, Evening) with their timing and period configuration';
COMMENT ON TABLE periods IS 'Auto-generated periods based on shift configuration';
COMMENT ON TABLE class_period_overrides IS 'Custom period timings for specific classes when they differ from shift defaults';
COMMENT ON TABLE classes IS 'Classes are now assigned to shifts, inheriting the shift''s period structure';
