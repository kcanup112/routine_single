-- ===================================================================
-- MULTI-TENANT SaaS DATABASE SCHEMA - Schema-based Isolation
-- ===================================================================
-- This schema design implements multi-tenancy using PostgreSQL schemas
-- Each institution gets its own schema for complete data isolation
-- ===================================================================

-- ===================================================================
-- GLOBAL SCHEMA: public
-- Contains cross-tenant data and tenant metadata
-- ===================================================================

-- Tenants (Institutions)
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Info
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    schema_name VARCHAR(100) UNIQUE NOT NULL,
    
    -- Branding
    logo_url VARCHAR(500),
    primary_color VARCHAR(7) DEFAULT '#1976d2',
    secondary_color VARCHAR(7) DEFAULT '#dc004e',
    favicon_url VARCHAR(500),
    
    -- Institution Details
    institution_type VARCHAR(50) CHECK (institution_type IN ('engineering', 'medical', 'school', 'college', 'university')),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Nepal',
    postal_code VARCHAR(20),
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'trial' 
        CHECK (status IN ('trial', 'active', 'suspended', 'cancelled', 'expired')),
    plan VARCHAR(20) NOT NULL DEFAULT 'free'
        CHECK (plan IN ('free', 'basic', 'premium', 'enterprise')),
    
    -- Trial & Subscription
    trial_ends_at TIMESTAMP,
    subscription_started_at TIMESTAMP,
    
    -- Limits based on plan
    max_teachers INTEGER DEFAULT 5,
    max_students INTEGER DEFAULT 50,
    max_departments INTEGER DEFAULT 3,
    max_programmes INTEGER DEFAULT 5,
    storage_limit_mb INTEGER DEFAULT 100,
    
    -- Settings (JSONB for flexibility)
    settings JSONB DEFAULT '{
        "working_days": [0,1,2,3,4,5],
        "weekend": [5,6],
        "time_zone": "Asia/Kathmandu",
        "locale": "en-US",
        "calendar_type": "ad",
        "features_enabled": ["routine", "calendar", "reports"]
    }'::jsonb,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    deleted_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT subdomain_format CHECK (subdomain ~ '^[a-z0-9-]+$'),
    CONSTRAINT subdomain_length CHECK (length(subdomain) >= 3 AND length(subdomain) <= 63)
);

CREATE INDEX idx_tenants_subdomain ON public.tenants(subdomain) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenants_status ON public.tenants(status);
CREATE INDEX idx_tenants_plan ON public.tenants(plan);
CREATE INDEX idx_tenants_schema ON public.tenants(schema_name);

-- Users (Global authentication)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    -- Auth
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Profile
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    avatar_url VARCHAR(500),
    
    -- Role & Permissions
    role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'tenant_admin', 'teacher', 'staff', 'student')),
    permissions JSONB DEFAULT '[]'::jsonb,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP,
    
    -- Activity
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(45),
    login_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT users_tenant_email_unique UNIQUE (tenant_id, email)
);

CREATE INDEX idx_users_tenant ON public.users(tenant_id);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_active ON public.users(is_active) WHERE deleted_at IS NULL;

-- Subscriptions
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    -- Plan Details
    plan VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'past_due', 'cancelled', 'unpaid', 'trialing')),
    
    -- Billing
    billing_cycle VARCHAR(20) CHECK (billing_cycle IN ('monthly', 'annual')),
    amount DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'NPR',
    
    -- Payment Gateway
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    khalti_subscription_id VARCHAR(255),
    payment_method VARCHAR(50),
    
    -- Subscription Period
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT false,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    
    -- Usage Tracking
    usage_data JSONB DEFAULT '{}'::jsonb,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_tenant ON public.subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON public.subscriptions(current_period_end);

-- Invitations
CREATE TABLE public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    email VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    
    invited_by UUID REFERENCES public.users(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT invitations_tenant_email_unique UNIQUE (tenant_id, email)
);

CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_tenant ON public.invitations(tenant_id);
CREATE INDEX idx_invitations_expires ON public.invitations(expires_at);

-- Audit Logs
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    -- Action Details
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(255),
    
    -- Context
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_tenant ON public.audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);

-- Partition audit logs by month for performance
CREATE TABLE public.audit_logs_template (LIKE public.audit_logs INCLUDING ALL);

-- Tenant Features
CREATE TABLE public.tenant_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    feature_name VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    
    settings JSONB DEFAULT '{}'::jsonb,
    
    enabled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    disabled_at TIMESTAMP,
    
    CONSTRAINT tenant_features_unique UNIQUE (tenant_id, feature_name)
);

CREATE INDEX idx_tenant_features_tenant ON public.tenant_features(tenant_id);
CREATE INDEX idx_tenant_features_enabled ON public.tenant_features(is_enabled);

-- Payment Transactions
CREATE TABLE public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id),
    
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NPR',
    
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method VARCHAR(50),
    
    gateway_transaction_id VARCHAR(255),
    gateway_response JSONB,
    
    invoice_url VARCHAR(500),
    receipt_url VARCHAR(500),
    
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_transactions_tenant ON public.payment_transactions(tenant_id);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX idx_payment_transactions_created ON public.payment_transactions(created_at);

-- ===================================================================
-- TENANT SCHEMA TEMPLATE
-- This schema structure is created for each new tenant
-- Replace {tenant_schema} with actual tenant schema name (e.g., kec, apex)
-- ===================================================================

-- Shifts
CREATE TABLE {tenant_schema}.shifts (
    id SERIAL PRIMARY KEY,
    
    -- Shift Details
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    
    -- Timing
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Working Days (0=Sunday, 6=Saturday)
    working_days INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5],
    
    -- Period Configuration
    period_duration_minutes INTEGER DEFAULT 50,
    break_duration_minutes INTEGER DEFAULT 10,
    lunch_break_duration_minutes INTEGER DEFAULT 30,
    lunch_break_after_period INTEGER,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    
    -- Display
    color VARCHAR(7) DEFAULT '#1976d2',
    display_order INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    
    CONSTRAINT shift_time_valid CHECK (end_time > start_time)
);

CREATE INDEX idx_shifts_is_active ON {tenant_schema}.shifts(is_active);
CREATE INDEX idx_shifts_code ON {tenant_schema}.shifts(code);

-- Periods
CREATE TABLE {tenant_schema}.periods (
    id SERIAL PRIMARY KEY,
    shift_id INTEGER NOT NULL REFERENCES {tenant_schema}.shifts(id) ON DELETE CASCADE,
    
    -- Period Details
    period_number INTEGER NOT NULL,
    name VARCHAR(100),
    type VARCHAR(20) DEFAULT 'regular' CHECK (type IN ('regular', 'lab', 'break', 'lunch', 'assembly', 'prayer')),
    
    -- Timing
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER GENERATED ALWAYS AS (EXTRACT(EPOCH FROM (end_time - start_time)) / 60) STORED,
    
    -- Configuration
    is_break BOOLEAN DEFAULT false,
    is_teaching_period BOOLEAN DEFAULT true,
    can_schedule_class BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT periods_shift_number_unique UNIQUE (shift_id, period_number),
    CONSTRAINT period_time_valid CHECK (end_time > start_time)
);

CREATE INDEX idx_periods_shift ON {tenant_schema}.periods(shift_id);
CREATE INDEX idx_periods_type ON {tenant_schema}.periods(type);
CREATE INDEX idx_periods_teaching ON {tenant_schema}.periods(is_teaching_period);

-- Departments
CREATE TABLE {tenant_schema}.departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    
    head_teacher_id INTEGER,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_departments_active ON {tenant_schema}.departments(is_active);

-- Programmes
CREATE TABLE {tenant_schema}.programmes (
    id SERIAL PRIMARY KEY,
    department_id INTEGER REFERENCES {tenant_schema}.departments(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    duration_years INTEGER,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_programmes_department ON {tenant_schema}.programmes(department_id);
CREATE INDEX idx_programmes_active ON {tenant_schema}.programmes(is_active);

-- Semesters
CREATE TABLE {tenant_schema}.semesters (
    id SERIAL PRIMARY KEY,
    programme_id INTEGER REFERENCES {tenant_schema}.programmes(id) ON DELETE CASCADE,
    
    semester_number INTEGER NOT NULL,
    name VARCHAR(100),
    
    CONSTRAINT semesters_programme_number_unique UNIQUE (programme_id, semester_number)
);

CREATE INDEX idx_semesters_programme ON {tenant_schema}.semesters(programme_id);

-- Rooms
CREATE TABLE {tenant_schema}.rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE,
    capacity INTEGER,
    room_type VARCHAR(20) CHECK (room_type IN ('classroom', 'lab', 'auditorium', 'hall')),
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rooms_active ON {tenant_schema}.rooms(is_active);
CREATE INDEX idx_rooms_type ON {tenant_schema}.rooms(room_type);

-- Classes (with shift assignment)
CREATE TABLE {tenant_schema}.classes (
    id SERIAL PRIMARY KEY,
    programme_id INTEGER REFERENCES {tenant_schema}.programmes(id) ON DELETE CASCADE,
    semester_id INTEGER REFERENCES {tenant_schema}.semesters(id) ON DELETE CASCADE,
    shift_id INTEGER REFERENCES {tenant_schema}.shifts(id),
    
    -- Class Details
    name VARCHAR(100) NOT NULL,
    section VARCHAR(10),
    academic_year VARCHAR(20),
    
    -- Capacity
    total_students INTEGER DEFAULT 0,
    max_capacity INTEGER,
    
    -- Room Assignment
    default_room_id INTEGER REFERENCES {tenant_schema}.rooms(id),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT classes_unique UNIQUE (programme_id, semester_id, section, academic_year)
);

CREATE INDEX idx_classes_shift ON {tenant_schema}.classes(shift_id);
CREATE INDEX idx_classes_semester ON {tenant_schema}.classes(semester_id);
CREATE INDEX idx_classes_programme ON {tenant_schema}.classes(programme_id);
CREATE INDEX idx_classes_active ON {tenant_schema}.classes(is_active);

-- Class Period Overrides
CREATE TABLE {tenant_schema}.class_period_overrides (
    id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES {tenant_schema}.classes(id) ON DELETE CASCADE,
    period_id INTEGER NOT NULL REFERENCES {tenant_schema}.periods(id) ON DELETE CASCADE,
    
    custom_start_time TIME,
    custom_end_time TIME,
    is_active BOOLEAN DEFAULT true,
    reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT class_period_overrides_unique UNIQUE (class_id, period_id)
);

CREATE INDEX idx_class_period_overrides_class ON {tenant_schema}.class_period_overrides(class_id);

-- Teachers
CREATE TABLE {tenant_schema}.teachers (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(50),
    
    department_id INTEGER REFERENCES {tenant_schema}.departments(id),
    
    employee_code VARCHAR(50) UNIQUE,
    designation VARCHAR(100),
    employment_type VARCHAR(20) CHECK (employment_type IN ('full_time', 'part_time', 'visiting', 'contract')),
    
    max_periods_per_week INTEGER DEFAULT 30,
    preferred_shifts INTEGER[],
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_teachers_department ON {tenant_schema}.teachers(department_id);
CREATE INDEX idx_teachers_active ON {tenant_schema}.teachers(is_active);
CREATE INDEX idx_teachers_user ON {tenant_schema}.teachers(user_id);

-- Subjects
CREATE TABLE {tenant_schema}.subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    credit_hours INTEGER,
    
    subject_type VARCHAR(20) DEFAULT 'theory' CHECK (subject_type IN ('theory', 'lab', 'project', 'seminar')),
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subjects_active ON {tenant_schema}.subjects(is_active);
CREATE INDEX idx_subjects_type ON {tenant_schema}.subjects(subject_type);

-- Semester Subjects
CREATE TABLE {tenant_schema}.semester_subjects (
    id SERIAL PRIMARY KEY,
    semester_id INTEGER REFERENCES {tenant_schema}.semesters(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES {tenant_schema}.subjects(id) ON DELETE CASCADE,
    
    is_elective BOOLEAN DEFAULT false,
    
    CONSTRAINT semester_subjects_unique UNIQUE (semester_id, subject_id)
);

CREATE INDEX idx_semester_subjects_semester ON {tenant_schema}.semester_subjects(semester_id);
CREATE INDEX idx_semester_subjects_subject ON {tenant_schema}.semester_subjects(subject_id);

-- Teacher Subjects
CREATE TABLE {tenant_schema}.teacher_subjects (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER REFERENCES {tenant_schema}.teachers(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES {tenant_schema}.subjects(id) ON DELETE CASCADE,
    
    can_teach_lab BOOLEAN DEFAULT false,
    
    CONSTRAINT teacher_subjects_unique UNIQUE (teacher_id, subject_id)
);

CREATE INDEX idx_teacher_subjects_teacher ON {tenant_schema}.teacher_subjects(teacher_id);
CREATE INDEX idx_teacher_subjects_subject ON {tenant_schema}.teacher_subjects(subject_id);

-- Days
CREATE TABLE {tenant_schema}.days (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL,
    code VARCHAR(3) UNIQUE,
    day_number INTEGER UNIQUE CHECK (day_number >= 0 AND day_number <= 6),
    
    is_working_day BOOLEAN DEFAULT true
);

-- Class Routines (with period reference)
CREATE TABLE {tenant_schema}.class_routines (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES {tenant_schema}.classes(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES {tenant_schema}.subjects(id),
    teacher_id INTEGER REFERENCES {tenant_schema}.teachers(id),
    room_id INTEGER REFERENCES {tenant_schema}.rooms(id),
    day_id INTEGER REFERENCES {tenant_schema}.days(id),
    period_id INTEGER REFERENCES {tenant_schema}.periods(id),
    
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT class_routines_unique UNIQUE (class_id, day_id, period_id)
);

CREATE INDEX idx_class_routines_class ON {tenant_schema}.class_routines(class_id);
CREATE INDEX idx_class_routines_teacher ON {tenant_schema}.class_routines(teacher_id);
CREATE INDEX idx_class_routines_period ON {tenant_schema}.class_routines(period_id);
CREATE INDEX idx_class_routines_subject ON {tenant_schema}.class_routines(subject_id);
CREATE INDEX idx_class_routines_day ON {tenant_schema}.class_routines(day_id);

-- Calendar Events
CREATE TABLE {tenant_schema}.calendar_events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    event_type VARCHAR(50),
    
    start_time TIME,
    end_time TIME,
    is_all_day BOOLEAN DEFAULT false,
    
    color VARCHAR(7),
    icon VARCHAR(50),
    
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_calendar_events_date ON {tenant_schema}.calendar_events(event_date);
CREATE INDEX idx_calendar_events_type ON {tenant_schema}.calendar_events(event_type);

-- Academic Years
CREATE TABLE {tenant_schema}.academic_years (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    is_current BOOLEAN DEFAULT false,
    
    terms JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT academic_year_dates_valid CHECK (end_date > start_date)
);

CREATE INDEX idx_academic_years_current ON {tenant_schema}.academic_years(is_current);
CREATE INDEX idx_academic_years_dates ON {tenant_schema}.academic_years(start_date, end_date);

-- Holidays
CREATE TABLE {tenant_schema}.holidays (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    
    holiday_type VARCHAR(50) CHECK (holiday_type IN ('national', 'religious', 'institutional', 'other')),
    description TEXT,
    
    applies_to_shifts INTEGER[],
    
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_holidays_date ON {tenant_schema}.holidays(date);
CREATE INDEX idx_holidays_type ON {tenant_schema}.holidays(holiday_type);

-- ===================================================================
-- HELPER FUNCTIONS
-- ===================================================================

-- Function to set tenant context (search_path)
CREATE OR REPLACE FUNCTION public.set_tenant_context(tenant_schema_name TEXT)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('SET search_path TO %I, public', tenant_schema_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create new tenant schema
CREATE OR REPLACE FUNCTION public.create_tenant_schema(
    p_tenant_id UUID,
    p_schema_name VARCHAR
)
RETURNS VOID AS $$
DECLARE
    sql_template TEXT;
BEGIN
    -- Create schema
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', p_schema_name);
    
    -- Read and execute schema template
    -- (This would be called from application code with actual SQL)
    
    -- Grant permissions
    EXECUTE format('GRANT USAGE ON SCHEMA %I TO tenant_user', p_schema_name);
    EXECUTE format('GRANT ALL ON ALL TABLES IN SCHEMA %I TO tenant_user', p_schema_name);
    EXECUTE format('GRANT ALL ON ALL SEQUENCES IN SCHEMA %I TO tenant_user', p_schema_name);
    
    -- Seed initial data (days)
    EXECUTE format('
        INSERT INTO %I.days (name, code, day_number, is_working_day) VALUES
        (''Sunday'', ''SUN'', 0, true),
        (''Monday'', ''MON'', 1, true),
        (''Tuesday'', ''TUE'', 2, true),
        (''Wednesday'', ''WED'', 3, true),
        (''Thursday'', ''THU'', 4, true),
        (''Friday'', ''FRI'', 5, true),
        (''Saturday'', ''SAT'', 6, false)
    ', p_schema_name);
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================================================
-- COMMENTS FOR DOCUMENTATION
-- ===================================================================

COMMENT ON TABLE public.tenants IS 'Multi-tenant institutions/organizations';
COMMENT ON TABLE public.users IS 'Global user authentication and profiles';
COMMENT ON TABLE public.subscriptions IS 'Subscription and billing information';
COMMENT ON TABLE public.audit_logs IS 'Audit trail for all tenant operations';

COMMENT ON COLUMN public.tenants.schema_name IS 'PostgreSQL schema name for tenant data isolation';
COMMENT ON COLUMN public.tenants.settings IS 'JSONB field for flexible tenant configuration';
COMMENT ON COLUMN public.users.tenant_id IS 'Tenant association for user isolation';
