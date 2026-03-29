# System Administrator Access Restrictions

## Overview
The system administrator account (`anupkc_1@hotmail.com`, tenant: `system`) has been restricted to only access tenant management APIs. All routine management endpoints are now blocked.

## Implementation Details

### Permission Middleware
- **Location**: `backend/app/middleware/permissions.py`
- **Execution Order**: Runs BEFORE tenant context middleware (registered second in `main_saas.py`)
- **Response Type**: Returns 403 Forbidden with JSON error message

### Allowed Routes for System Admin
The system administrator can access:
- `/api/admin/*` - System administration panel
- `/api/tenants/*` - Tenant management (CRUD operations)
- `/auth/*` - Authentication endpoints (login, change password)
- `/docs` - API documentation
- `/openapi.json` - OpenAPI specification
- `/api/users/*` - User management
- `/` - Root endpoint
- `/favicon.ico` - Static assets

### Blocked Routes for System Admin
The system administrator **CANNOT** access any routine management endpoints:
- `/departments/*` - Department management
- `/programmes/*` - Programme management
- `/semesters/*` - Semester management
- `/classes/*` - Class management
- `/teachers/*` - Teacher management
- `/subjects/*` - Subject management
- `/schedules/*` - Schedule management
- `/semester_subjects/*` - Semester-subject assignments
- `/rooms/*` - Room management
- `/days/*` - Day configuration
- `/shifts/*` - Shift management
- `/periods/*` - Period configuration
- `/teacher_subjects/*` - Teacher-subject assignments
- `/class_routines/*` - Class routine management
- `/api/calendar/*` - Calendar views

## Testing Results

### ✅ Blocked Endpoints Test
All routine management endpoints correctly return **403 Forbidden**:

```powershell
# Login as system admin
$loginResponse = Invoke-WebRequest -Uri "http://localhost:8000/auth/login" `
    -Method POST `
    -Headers @{"Content-Type"="application/json"; "X-Tenant-Subdomain"="system"} `
    -Body '{"email":"anupkc_1@hotmail.com","password":"admin123"}'

$token = ($loginResponse.Content | ConvertFrom-Json).access_token

# Test blocked endpoints
GET /departments/ -> 403 Forbidden ✅
GET /teachers/ -> 403 Forbidden ✅
GET /classes/ -> 403 Forbidden ✅
GET /schedules/ -> 403 Forbidden ✅
GET /subjects/ -> 403 Forbidden ✅
```

Error response:
```json
{
  "detail": "System administrator cannot access routine management endpoints. Access restricted to tenant management only."
}
```

### ✅ Allowed Endpoints Test
Tenant management endpoints work correctly with **200 OK**:

```powershell
# Test allowed endpoint
GET /api/admin/tenants -> 200 OK ✅
```

Returns list of all tenants with details (id, name, subdomain, status, plan, etc.)

## Middleware Execution Flow

1. **Permission Middleware** (executes FIRST)
   - Checks if request is from system admin (subdomain='system')
   - Validates route against allowed/blocked lists
   - Returns 403 if route is blocked
   - Continues if route is allowed

2. **Tenant Context Middleware** (executes SECOND)
   - Sets database schema based on tenant subdomain
   - Only executes if permission middleware didn't block the request

## Code Changes

### 1. Created Permission Middleware
**File**: `backend/app/middleware/permissions.py`

Key function:
```python
def is_route_allowed_for_system_admin(path: str) -> bool:
    # Block tenant-specific routes FIRST
    for blocked_route in TENANT_SPECIFIC_ROUTES:
        if path.startswith(blocked_route):
            return False
    
    # Allow explicitly permitted routes
    for allowed_route in SYSTEM_ADMIN_ALLOWED_ROUTES:
        if path.startswith(allowed_route):
            return True
    
    # Block other routes by default
    return False
```

### 2. Registered Middleware
**File**: `backend/app/main_saas.py`

Registration order (reverse execution):
```python
# Registered FIRST, executes SECOND
@app.middleware("http")
async def tenant_middleware(request: Request, call_next):
    return await tenant_context_middleware(request, call_next)

# Registered SECOND, executes FIRST
@app.middleware("http")
async def permission_middleware(request: Request, call_next):
    return await system_admin_permission_middleware(request, call_next)
```

## System Admin Credentials

- **Email**: anupkc_1@hotmail.com
- **Password**: admin123
- **Tenant ID**: 78
- **Subdomain**: system
- **Role**: super_admin

## Usage Recommendations

### For System Administrators
- Use the system admin account **ONLY** for:
  - Managing tenants (create, update, suspend, delete)
  - Viewing system-wide statistics
  - Managing global users
  - System configuration

### For Routine Management
- Log in with a **tenant-specific account** (not system admin)
- Each college/institution has its own admin account
- Example: For KEC tenant (subdomain: kec), use admin@kec.edu.np

## Security Benefits

1. **Separation of Concerns**: System-level administration is isolated from tenant-specific operations
2. **Reduced Attack Surface**: System admin cannot accidentally modify tenant data
3. **Clear Access Boundaries**: Explicit allow/deny lists make permissions transparent
4. **Tenant Data Protection**: System admin cannot access or manipulate tenant-specific routine data
5. **Audit Trail**: Failed access attempts to blocked routes are logged

## Troubleshooting

### Issue: System admin getting 403 on needed endpoint
**Solution**: Add the route pattern to `SYSTEM_ADMIN_ALLOWED_ROUTES` in `permissions.py`

### Issue: System admin can still access blocked route
**Solution**: Ensure route pattern is in `TENANT_SPECIFIC_ROUTES` and matches the actual URL path

### Issue: Middleware not executing
**Solution**: Check middleware registration order in `main_saas.py` - permission middleware must be registered AFTER tenant middleware to execute FIRST

## Future Enhancements

Consider adding:
- Role-based permissions (not just subdomain-based)
- Permission caching for better performance
- Detailed audit logging for all system admin actions
- Configurable permission rules via database instead of hardcoded lists
- Rate limiting for system admin endpoints
