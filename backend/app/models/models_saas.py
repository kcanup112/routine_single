"""
SQLAlchemy models for multi-tenant SaaS
Public schema tables: tenants, users, subscriptions, etc.
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, DECIMAL, JSON, ForeignKey, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database_saas import Base

class Tenant(Base):
    """
    Tenant table in public schema
    Represents an educational institution using the platform
    """
    __tablename__ = "tenants"
    __table_args__ = {'schema': 'public'}
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    subdomain = Column(String(63), unique=True, nullable=False, index=True)
    schema_name = Column(String(63), unique=True, nullable=False)
    
    # Contact information
    admin_email = Column(String(255), nullable=False)
    admin_name = Column(String(200))
    phone = Column(String(20))
    
    # Address
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    country = Column(String(100), default='Nepal')
    
    # Subscription
    plan = Column(String(20), default='trial')  # trial, basic, standard, premium
    status = Column(String(20), default='active')  # active, trial, suspended, cancelled
    trial_ends_at = Column(DateTime)
    
    # Settings (JSONB)
    settings = Column(JSON, default={})
    
    # Limits from plan
    max_teachers = Column(Integer, default=50)
    max_students = Column(Integer, default=500)
    max_classes = Column(Integer, default=20)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime, nullable=True)
    
    # Relationships
    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="tenant", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="tenant", cascade="all, delete-orphan")


class User(Base):
    """
    User table in public schema
    Users belong to a tenant and have roles/permissions
    """
    __tablename__ = "users"
    __table_args__ = {'schema': 'public'}
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey('public.tenants.id'), nullable=False, index=True)
    
    # Authentication
    email = Column(String(255), nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    
    # Profile
    full_name = Column(String(200))
    phone = Column(String(20))
    
    # Role & Permissions
    role = Column(String(50), default='user')  # super_admin, admin, user
    permissions = Column(JSON, default=[])  # Array of permission strings
    
    # Status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    email_verified_at = Column(DateTime)
    
    # Security
    last_login_at = Column(DateTime)
    last_login_ip = Column(String(45))
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime, nullable=True)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="users")


class Subscription(Base):
    """
    Subscription table in public schema
    Tracks billing and payment history for tenants
    """
    __tablename__ = "subscriptions"
    __table_args__ = {'schema': 'public'}
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey('public.tenants.id'), nullable=False, index=True)
    
    # Plan details
    plan = Column(String(20), nullable=False)  # basic, standard, premium
    billing_cycle = Column(String(20), default='monthly')  # monthly, yearly
    
    # Pricing
    amount = Column(DECIMAL(10, 2), nullable=False)
    currency = Column(String(3), default='NPR')
    
    # Payment gateway
    payment_gateway = Column(String(50))  # stripe, khalti, esewa
    gateway_subscription_id = Column(String(255))
    
    # Status
    status = Column(String(20), default='active')  # active, cancelled, past_due, trialing
    
    # Dates
    current_period_start = Column(DateTime)
    current_period_end = Column(DateTime)
    cancelled_at = Column(DateTime)
    trial_ends_at = Column(DateTime)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    tenant = relationship("Tenant", back_populates="subscriptions")


class PaymentTransaction(Base):
    """
    Payment transaction history
    """
    __tablename__ = "payment_transactions"
    __table_args__ = {'schema': 'public'}
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey('public.tenants.id'), nullable=False, index=True)
    subscription_id = Column(Integer, ForeignKey('public.subscriptions.id'), index=True)
    
    # Transaction details
    amount = Column(DECIMAL(10, 2), nullable=False)
    currency = Column(String(3), default='NPR')
    
    # Gateway info
    payment_gateway = Column(String(50), nullable=False)
    gateway_transaction_id = Column(String(255))
    gateway_response = Column(JSON)
    
    # Status
    status = Column(String(20), default='pending')  # pending, completed, failed, refunded
    
    # Metadata
    description = Column(Text)
    transaction_metadata = Column('metadata', JSON, default={})
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Invitation(Base):
    """
    User invitation system for team members
    """
    __tablename__ = "invitations"
    __table_args__ = {'schema': 'public'}
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey('public.tenants.id'), nullable=False, index=True)
    
    # Invitation details
    email = Column(String(255), nullable=False)
    role = Column(String(50), default='user')
    token = Column(String(255), unique=True, nullable=False)
    
    # Status
    status = Column(String(20), default='pending')  # pending, accepted, expired
    expires_at = Column(DateTime, nullable=False)
    accepted_at = Column(DateTime)
    
    # Inviter
    invited_by = Column(Integer, ForeignKey('public.users.id'))
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())


class TenantFeature(Base):
    """
    Feature flags for tenants
    Enables/disables features per tenant
    """
    __tablename__ = "tenant_features"
    __table_args__ = {'schema': 'public'}
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey('public.tenants.id'), nullable=False, index=True)
    
    feature_key = Column(String(100), nullable=False)  # e.g., 'multi_shift', 'teacher_portal'
    is_enabled = Column(Boolean, default=True)
    
    # Configuration (JSONB)
    config = Column(JSON, default={})
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class AuditLog(Base):
    """
    Audit trail for tracking tenant activities
    """
    __tablename__ = "audit_logs"
    __table_args__ = {'schema': 'public'}
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey('public.tenants.id'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('public.users.id'), index=True)
    
    # Action details
    action = Column(String(100), nullable=False)  # e.g., 'create_class', 'update_teacher'
    entity_type = Column(String(100))  # e.g., 'Class', 'Teacher'
    entity_id = Column(Integer)
    
    # Changes (JSONB)
    old_values = Column(JSON)
    new_values = Column(JSON)
    
    # Request metadata
    ip_address = Column(String(45))
    user_agent = Column(Text)
    
    # Timestamp
    created_at = Column(DateTime, server_default=func.now(), index=True)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="audit_logs")
