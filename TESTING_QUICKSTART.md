# Multi-Tenant Security Testing - Quick Start Guide

## Overview

This guide explains how to run the multi-tenant security and isolation tests for the KEC Routine Scheduler application.

## Prerequisites

- Docker containers running:
  - `kec-routine-backend` (FastAPI application)
  - `postgres` (PostgreSQL database)
- Backend accessible at `http://localhost:8000`
- Database: `postgresql://postgres:postgres@postgres:5432/kec_routine_saas`

## Test Scripts

### 1. API-Level Security Tests

**Script**: `backend/scripts/test_multitenant_security.py`

**Tests Performed**:
- ✅ Tenant creation (Tenant A & B)
- ✅ Data population (departments, teachers, subjects)
- ✅ Cross-tenant access prevention
- ✅ Direct Object Reference (DOR) attacks
- ✅ SQL injection protection
- ✅ Tenant onboarding (Tenant C)

**Run Command**:
```bash
docker exec -it kec-routine-backend python scripts/test_multitenant_security.py
```

**Expected Output**:
```
╔════════════════════════════════════════════════════════════════════╗
║      MULTI-TENANT SECURITY & ISOLATION TESTING SUITE               ║
║      KEC Routine Scheduler - Schema-Based Isolation                ║
╚════════════════════════════════════════════════════════════════════╝

Total Tests: 9
Passed: 9
Failed: 0
Pass Rate: 100.0%
```

---

### 2. Database-Level Isolation Tests

**Script**: `backend/scripts/test_database_isolation.py`

**Tests Performed**:
- ✅ Schema existence verification
- ✅ Table structure isolation
- ✅ Data separation between schemas
- ✅ Public schema tenant records
- ✅ PostgreSQL search_path isolation

**Run Command**:
```bash
docker exec -it kec-routine-backend python scripts/test_database_isolation.py
```

**Expected Output**:
```
╔════════════════════════════════════════════════════════════════════╗
║      DATABASE-LEVEL SCHEMA ISOLATION TESTING                       ║
║      PostgreSQL Search Path & Schema-Based Separation              ║
╚════════════════════════════════════════════════════════════════════╝

Total Tests: 17
Passed: 17
Failed: 0
Pass Rate: 100.0%
```

---

## Run All Tests

Execute both test suites sequentially:

```bash
# Run API-level tests
docker exec -it kec-routine-backend python scripts/test_multitenant_security.py

# Run database-level tests
docker exec -it kec-routine-backend python scripts/test_database_isolation.py
```

**Combined Results**: 26/26 tests passed (100%)

---

## Test Tenants Created

The tests automatically create the following tenants (if they don't exist):

| Tenant | Subdomain | Admin Email | Password | Schema |
|--------|-----------|-------------|----------|--------|
| Tech University | `tenanta` | admin@techuniversity.edu.np | SecurePass123! | `tenanta` |
| Business College | `tenantb` | admin@businesscollege.edu.np | SecurePass456! | `tenantb` |
| Engineering Institute | `tenantc` | admin@enginstitute.edu.np | SecurePass789! | `tenantc` |

---

## Manual Testing

### Create a New Tenant via API

```bash
curl -X POST http://localhost:8000/api/tenants/signup \
  -H "Content-Type: application/json" \
  -d '{
    "institution_name": "My University",
    "subdomain": "myuni",
    "admin_name": "Admin User",
    "admin_email": "admin@myuni.edu.np",
    "admin_password": "SecurePassword123!",
    "phone": "9801234567",
    "city": "Kathmandu",
    "country": "Nepal",
    "plan": "trial"
  }'
```

**Response**:
```json
{
  "tenant": {
    "id": 88,
    "name": "My University",
    "subdomain": "myuni",
    "schema_name": "myuni",
    "status": "trial",
    "plan": "trial"
  },
  "admin_user": {
    "id": 150,
    "email": "admin@myuni.edu.np",
    "role": "admin"
  },
  "access_token": "eyJhbGci...",
  "message": "Welcome to My University! Your trial account has been created successfully."
}
```

---

### Login as Tenant Admin

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@techuniversity.edu.np",
    "password": "SecurePass123!"
  }'
```

**Response**:
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer",
  "user": {
    "id": 140,
    "email": "admin@techuniversity.edu.np",
    "full_name": "Admin A",
    "role": "admin",
    "tenant_subdomain": "tenanta",
    "tenant_name": "Tech University"
  }
}
```

---

### Access Tenant Resources

**Method 1: Using X-Tenant-Subdomain Header**

```bash
TOKEN="eyJhbGci..."

curl http://localhost:8000/departments/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Subdomain: tenanta"
```

**Method 2: Via Subdomain (if DNS/hosts configured)**

```bash
curl http://tenanta.localhost:8000/departments/ \
  -H "Authorization: Bearer $TOKEN"
```

---

### Test Cross-Tenant Isolation

Try to access Tenant A's data using Tenant B's credentials:

```bash
# Login as Tenant B
TOKEN_B=$(curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@businesscollege.edu.np","password":"SecurePass456!"}' | jq -r '.access_token')

# Try to access Tenant A's department (should fail with 404)
curl http://localhost:8000/departments/1/ \
  -H "Authorization: Bearer $TOKEN_B" \
  -H "X-Tenant-Subdomain: tenantb"
# Expected: 404 Not Found
```

---

## Database Inspection

### Connect to PostgreSQL

```bash
docker exec -it postgres psql -U postgres -d kec_routine_saas
```

### List All Schemas

```sql
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY schema_name;
```

### View Tenant Records

```sql
SELECT id, name, subdomain, schema_name, status, plan, created_at
FROM public.tenants
WHERE deleted_at IS NULL
ORDER BY created_at DESC;
```

### Check Tenant A's Data

```sql
-- Set search path to Tenant A
SET search_path TO tenanta, public;

-- View departments
SELECT * FROM departments;

-- View teachers
SELECT * FROM teachers;

-- View subjects
SELECT * FROM subjects;
```

### Verify Isolation (Same ID, Different Data)

```sql
-- Tenant A's department ID=1
SELECT id, name, code FROM tenanta.departments WHERE id = 1;
-- Result: "Computer Science & Engineering", "CSE"

-- Tenant B's department ID=1
SELECT id, name, code FROM tenantb.departments WHERE id = 1;
-- Result: "Malicious Department", "MAL"

-- Both have ID=1 but different data (proper isolation)
```

---

## Troubleshooting

### Tests Fail with Connection Error

**Issue**: Cannot connect to backend/database

**Solution**:
```bash
# Check containers are running
docker ps

# Start containers if needed
docker start kec-routine-backend postgres

# Check backend logs
docker logs kec-routine-backend --tail 50
```

### Tenant Already Exists Error

**Issue**: `400 Bad Request - Subdomain 'tenanta' is already taken`

**Solution**: Tests will automatically login to existing tenants. This is normal behavior.

### Permission Denied

**Issue**: Cannot execute scripts

**Solution**:
```bash
# Ensure Python has required packages
docker exec kec-routine-backend pip install requests psycopg2-binary
```

---

## Clean Up Test Data

### Remove Test Tenants (Soft Delete)

```sql
-- Connect to database
docker exec -it postgres psql -U postgres -d kec_routine_saas

-- Soft delete test tenants
UPDATE public.tenants 
SET deleted_at = NOW() 
WHERE subdomain IN ('tenanta', 'tenantb', 'tenantc');
```

### Hard Delete (DROP SCHEMAS)

⚠️ **WARNING**: This permanently deletes all tenant data!

```sql
-- Drop schemas (CASCADE removes all tables)
DROP SCHEMA IF EXISTS tenanta CASCADE;
DROP SCHEMA IF EXISTS tenantb CASCADE;
DROP SCHEMA IF EXISTS tenantc CASCADE;

-- Delete tenant records
DELETE FROM public.users WHERE tenant_id IN (
  SELECT id FROM public.tenants 
  WHERE subdomain IN ('tenanta', 'tenantb', 'tenantc')
);

DELETE FROM public.tenants 
WHERE subdomain IN ('tenanta', 'tenantb', 'tenantc');
```

---

## Next Steps

1. **Review Test Report**: See `MULTITENANT_TESTING_REPORT.md` for detailed findings
2. **Implement Recommendations**: Address security improvements outlined in the report
3. **Performance Testing**: Run load tests with multiple concurrent tenants
4. **Monitoring**: Set up audit logging and tenant resource monitoring

---

## Support

For questions or issues:
- Review logs: `docker logs kec-routine-backend`
- Check database: `docker exec -it postgres psql -U postgres -d kec_routine_saas`
- Examine test scripts: `backend/scripts/test_*.py`

**Last Updated**: November 30, 2025
