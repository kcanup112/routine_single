# Multi-tenant SaaS Migration Guide

## Phase 1: Environment Setup (Week 1-2)

### Step 1: Install Docker and Docker Compose

**Windows:**
1. Download Docker Desktop from https://www.docker.com/products/docker-desktop
2. Install and start Docker Desktop
3. Verify installation:
```powershell
docker --version
docker-compose --version
```

### Step 2: Set Up Development Environment

1. **Copy environment file:**
```powershell
cd docs/saas-migration
Copy-Item .env.example ..\..\..env
```

2. **Edit `.env` file with your configurations:**
   - Generate SECRET_KEY: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
   - Set DB_PASSWORD and REDIS_PASSWORD
   - Configure email settings (for testing, use Gmail with app password)

3. **Start Docker containers:**
```powershell
cd docs/saas-migration
docker-compose up -d
```

4. **Verify services are running:**
```powershell
docker-compose ps
```

All services should show "Up" status:
- postgres (port 5432)
- redis (port 6379)
- pgbouncer (port 6432)
- pgadmin (port 5050)

### Step 3: Initialize Database Schema

1. **Access PostgreSQL:**
```powershell
docker exec -it kec-routine-postgres psql -U kec_admin -d kec_routine_saas
```

2. **Create public schema tables:**
```sql
-- Copy content from DATABASE_SCHEMA.sql (public schema section)
-- Or run the entire file
\i /docker-entrypoint-initdb.d/DATABASE_SCHEMA.sql
```

3. **Verify tables created:**
```sql
\dt public.*
```

You should see:
- tenants
- users
- subscriptions
- invitations
- audit_logs
- tenant_features
- payment_transactions

### Step 4: Create First Tenant (KEC)

1. **Insert KEC tenant:**
```sql
INSERT INTO public.tenants (
    name, subdomain, schema_name, 
    institution_type, status, plan,
    email, phone, country, city
) VALUES (
    'Kantipur Engineering College',
    'kec',
    'kec',
    'engineering',
    'active',
    'premium',
    'info@kec.edu.np',
    '+977-1-5186040',
    'Nepal',
    'Kathmandu'
) RETURNING id;
```

Save the returned UUID (tenant_id).

2. **Create KEC schema:**
```sql
CREATE SCHEMA kec;
```

3. **Apply tenant schema template:**
Replace `{tenant_schema}` with `kec` in DATABASE_SCHEMA.sql tenant section and execute.

4. **Seed initial data for KEC:**
```sql
-- Days are auto-seeded by function
-- Add a default shift
INSERT INTO kec.shifts (
    name, code, start_time, end_time,
    period_duration_minutes, lunch_break_after_period
) VALUES (
    'Day Shift', 'DAY', '07:00', '15:00',
    50, 4
) RETURNING id;
```

Save shift_id for period generation.

5. **Generate periods for shift:**
Use the backend API endpoint (to be created) or manually:
```sql
-- Period 1: 07:00 - 07:50
INSERT INTO kec.periods (shift_id, period_number, name, start_time, end_time, type)
VALUES (1, 1, 'Period 1', '07:00', '07:50', 'regular');

-- Period 2: 07:50 - 08:40
INSERT INTO kec.periods (shift_id, period_number, name, start_time, end_time, type)
VALUES (1, 2, 'Period 2', '07:50', '08:40', 'regular');

-- Short Break: 08:40 - 08:50
INSERT INTO kec.periods (shift_id, period_number, name, start_time, end_time, type, is_break, is_teaching_period, can_schedule_class)
VALUES (1, 3, 'Short Break', '08:40', '08:50', 'break', true, false, false);

-- Continue for all periods...
-- Lunch after period 4
-- Total 7-8 teaching periods + breaks
```

### Step 5: Migrate Existing KEC Data

1. **Export from SQLite:**
```powershell
cd backend
python scripts/export_sqlite_data.py
```

This will generate JSON files for each table.

2. **Import to PostgreSQL:**
```powershell
python scripts/import_to_postgres.py --tenant kec
```

3. **Verify data migration:**
```sql
SELECT COUNT(*) FROM kec.departments;
SELECT COUNT(*) FROM kec.teachers;
SELECT COUNT(*) FROM kec.classes;
SELECT COUNT(*) FROM kec.class_routines;
```

## Phase 2: Backend Updates (Week 3-4)

### Step 1: Update Dependencies

**backend/requirements.txt:**
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
alembic==1.12.1
psycopg2-binary==2.9.9  # PostgreSQL adapter
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
pydantic==2.5.0
pydantic-settings==2.1.0
redis==5.0.1
celery==5.3.4
stripe==7.7.0
requests==2.31.0
python-dotenv==1.0.0
```

Install:
```powershell
cd backend
.venv/Scripts/Activate
pip install -r requirements.txt
```

### Step 2: Create Tenant Middleware

**backend/app/middleware/tenant.py:**
```python
from fastapi import Request, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Tenant

async def tenant_middleware(request: Request, call_next):
    """
    Extract tenant from subdomain and set schema context
    """
    host = request.headers.get("host", "")
    subdomain = extract_subdomain(host)
    
    if subdomain:
        db = next(get_db())
        tenant = db.query(Tenant).filter(
            Tenant.subdomain == subdomain,
            Tenant.status.in_(['active', 'trial'])
        ).first()
        
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")
        
        # Set tenant context in request state
        request.state.tenant = tenant
        request.state.schema_name = tenant.schema_name
        
        # Set PostgreSQL search_path
        db.execute(f"SET search_path TO {tenant.schema_name}, public")
    
    response = await call_next(request)
    return response

def extract_subdomain(host: str) -> str:
    """Extract subdomain from host header"""
    # kec.localhost:3000 -> kec
    # kec.yourapp.com -> kec
    parts = host.split(".")
    if len(parts) > 2:
        return parts[0]
    return None
```

### Step 3: Update Database Configuration

**backend/app/core/database.py:**
```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# PostgreSQL connection
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### Step 4: Create Tenant Management API

**backend/app/api/routes/tenants.py:**
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas import TenantCreate, TenantResponse
from app.services.tenant_service import TenantService

router = APIRouter(prefix="/api/tenants", tags=["tenants"])

@router.post("/signup", response_model=TenantResponse)
async def signup_tenant(
    tenant_data: TenantCreate,
    db: Session = Depends(get_db)
):
    """
    New tenant signup endpoint
    """
    service = TenantService(db)
    tenant = await service.create_tenant(tenant_data)
    return tenant

@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant(
    tenant_id: str,
    db: Session = Depends(get_db)
):
    """Get tenant details"""
    service = TenantService(db)
    tenant = service.get_tenant(tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant
```

### Step 5: Create Shift Management API

**backend/app/api/routes/shifts.py:**
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas import ShiftCreate, ShiftResponse, PeriodResponse
from app.services.shift_service import ShiftService

router = APIRouter(prefix="/api/shifts", tags=["shifts"])

@router.post("/", response_model=ShiftResponse)
async def create_shift(
    shift_data: ShiftCreate,
    db: Session = Depends(get_db)
):
    """Create new shift with auto-generated periods"""
    service = ShiftService(db)
    shift = service.create_shift_with_periods(shift_data)
    return shift

@router.get("/", response_model=List[ShiftResponse])
async def list_shifts(db: Session = Depends(get_db)):
    """List all shifts for current tenant"""
    service = ShiftService(db)
    return service.get_all_shifts()

@router.get("/{shift_id}/periods", response_model=List[PeriodResponse])
async def get_shift_periods(
    shift_id: int,
    db: Session = Depends(get_db)
):
    """Get all periods for a shift"""
    service = ShiftService(db)
    return service.get_shift_periods(shift_id)
```

## Phase 3: Frontend Updates (Week 5-6)

### Step 1: Add Subdomain Detection

**frontend/src/utils/tenant.js:**
```javascript
export const getTenantFromUrl = () => {
  const hostname = window.location.hostname
  const parts = hostname.split('.')
  
  if (parts.length > 2) {
    return parts[0] // kec.localhost -> kec
  }
  
  // Fallback for development
  return localStorage.getItem('tenant_subdomain') || null
}

export const setTenantSubdomain = (subdomain) => {
  localStorage.setItem('tenant_subdomain', subdomain)
}
```

### Step 2: Update API Client

**frontend/src/services/api.js:**
```javascript
import axios from 'axios'
import { getTenantFromUrl } from '../utils/tenant'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add tenant subdomain to requests
api.interceptors.request.use((config) => {
  const subdomain = getTenantFromUrl()
  if (subdomain) {
    config.headers['X-Tenant-Subdomain'] = subdomain
  }
  
  const token = localStorage.getItem('token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  
  return config
})

export default api
```

### Step 3: Create Shift Management UI

**frontend/src/pages/ShiftManagement.jsx:**
```javascript
// Component for managing shifts and periods
// Will be created as part of Settings/Configuration section
```

## Phase 4: Testing (Week 7)

### Test Multi-tenancy Isolation

1. **Create test tenant:**
```sql
INSERT INTO public.tenants (name, subdomain, schema_name, status)
VALUES ('Test College', 'test', 'test', 'trial');

CREATE SCHEMA test;
-- Apply tenant schema template
```

2. **Test data isolation:**
- Create data in `kec` schema
- Verify it's not accessible from `test` schema
- Test cross-tenant queries fail

3. **Test API with different subdomains:**
```powershell
# KEC tenant
curl -H "X-Tenant-Subdomain: kec" http://localhost:8000/api/classes

# Test tenant
curl -H "X-Tenant-Subdomain: test" http://localhost:8000/api/classes
```

Should return different data for each tenant.

## Phase 5: Deployment (Week 8)

See DEPLOYMENT.md for production deployment steps.

## Rollback Plan

If migration fails, rollback to SQLite:

1. Stop Docker containers
2. Restore from backup:
```powershell
Copy-Item backup/kec_routine.db backend/kec_routine.db
```
3. Restart old version

## Monitoring

After deployment, monitor:
- Database connections (should use PgBouncer pool)
- Schema count (`SELECT count(*) FROM pg_namespace WHERE nspname NOT LIKE 'pg_%'`)
- Disk usage
- API response times per tenant
- Error rates per tenant

## Support

For issues during migration:
- Check logs: `docker-compose logs backend`
- Database logs: `docker-compose logs postgres`
- Access pgAdmin: http://localhost:5050
