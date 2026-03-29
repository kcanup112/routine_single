-- Initialize public schema tables for multi-tenant SaaS
-- This script is executed when PostgreSQL container first starts

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tenants table
CREATE TABLE IF NOT EXISTS public.tenants (
    id SERIAL PRIMARY KEY,
    
    -- Basic Info
    name VARCHAR(200) NOT NULL,
    subdomain VARCHAR(63) UNIQUE NOT NULL,
    schema_name VARCHAR(63) UNIQUE NOT NULL,
    
    -- Contact
    admin_email VARCHAR(255) NOT NULL,
    admin_name VARCHAR(200),
    phone VARCHAR(20),
    
    -- Address
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Nepal',
    
    -- Subscription
    plan VARCHAR(20) DEFAULT 'trial' CHECK (plan IN ('trial', 'basic', 'standard', 'premium')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'trial', 'suspended', 'cancelled')),
    trial_ends_at TIMESTAMP,
    
    -- Settings (JSONB)
    settings JSONB DEFAULT '{}'::jsonb,
    
    -- Limits from plan
    max_teachers INTEGER DEFAULT 50,
    max_students INTEGER DEFAULT 500,
    max_classes INTEGER DEFAULT 20,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT subdomain_format CHECK (subdomain ~ '^[a-z0-9-]+$'),
    CONSTRAINT subdomain_length CHECK (length(subdomain) >= 3 AND length(subdomain) <= 63)
);

CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON public.tenants(subdomain) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status);

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    -- Authentication
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Profile
    full_name VARCHAR(200),
    phone VARCHAR(20),
    
    -- Role & Permissions
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'user')),
    permissions JSONB DEFAULT '[]'::jsonb,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP,
    
    -- Security
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(45),
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    -- Unique constraint on email per tenant
    CONSTRAINT unique_email_per_tenant UNIQUE (tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_users_tenant ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    -- Plan details
    plan VARCHAR(20) NOT NULL,
    billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    
    -- Pricing
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NPR',
    
    -- Payment gateway
    payment_gateway VARCHAR(50),
    gateway_subscription_id VARCHAR(255),
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
    
    -- Dates
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    cancelled_at TIMESTAMP,
    trial_ends_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON public.subscriptions(tenant_id);

-- Payment Transactions table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    subscription_id INTEGER REFERENCES public.subscriptions(id),
    
    -- Transaction details
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NPR',
    
    -- Gateway info
    payment_gateway VARCHAR(50) NOT NULL,
    gateway_transaction_id VARCHAR(255),
    gateway_response JSONB,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    
    -- Metadata
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    -- Invitation details
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    token VARCHAR(255) UNIQUE NOT NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    
    -- Inviter
    invited_by INTEGER REFERENCES public.users(id),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tenant Features table
CREATE TABLE IF NOT EXISTS public.tenant_features (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    feature_key VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    
    -- Configuration (JSONB)
    config JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint
    CONSTRAINT unique_feature_per_tenant UNIQUE (tenant_id, feature_key)
);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES public.users(id),
    
    -- Action details
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id INTEGER,
    
    -- Changes (JSONB)
    old_values JSONB,
    new_values JSONB,
    
    -- Request metadata
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at);

-- Helper function to set tenant context
CREATE OR REPLACE FUNCTION public.set_tenant_context(tenant_schema VARCHAR)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('SET search_path TO %I, public', tenant_schema);
END;
$$ LANGUAGE plpgsql;

-- Function to create tenant schema
CREATE OR REPLACE FUNCTION public.create_tenant_schema(tenant_schema VARCHAR)
RETURNS VOID AS $$
BEGIN
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', tenant_schema);
    EXECUTE format('SET search_path TO %I, public', tenant_schema);
    
    -- Note: Tenant-specific tables will be created separately
    -- This function just creates the schema namespace
END;
$$ LANGUAGE plpgsql;
