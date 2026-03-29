# Quick Start Guide: Enhanced Multi-Tenant System

## 🚀 What's New

Your routine scheduler now automatically sets up complete working environments for every new organization!

### ✨ Automatic Setup
When a new organization signs up, they automatically get:
- ✅ **7 Days**: Sunday through Saturday (Sun-Fri working, Sat weekend)
- ✅ **1 Shift**: Morning Shift (7:00 AM - 3:30 PM)
- ✅ **10 Periods**: 50-minute teaching periods with breaks
- ✅ **Complete Navigation**: All menu items work immediately

---

## 📱 User Journey

### 1. Organization Signup
```
Visit: http://localhost:3000/signup

Fill in:
- Institution Name: "Kantipur Engineering College"
- Subdomain: "kec" (auto-filled from email domain)
- Admin Email: admin@kec.edu.np
- Password: (minimum 8 characters)
- City/Country

Click "Sign Up"
```

**What happens automatically:**
1. PostgreSQL schema created: `kec`
2. 16 database tables created
3. 7 days inserted (Sunday-Saturday)
4. 1 shift created (Morning Shift)
5. 10 periods generated (7:00 AM - 3:30 PM)
6. Admin user created and logged in

### 2. Auto-Login & Redirect
```
After signup → Redirected to: http://kec.localhost:3000/dashboard
```

### 3. Start Using Immediately
Navigate through sidebar:
- ✅ **Departments** → Create CS, CE, EE departments
- ✅ **Programmes** → Add BCS, BCE programs
- ✅ **Semesters** → Configure semester structure
- ✅ **Teachers** → Add faculty members
- ✅ **Subjects** → Create course catalog
- ✅ **Classes** → Set up class sections
- ✅ **Class Routine** → Generate schedules

---

## 🔧 Admin Features

### Superadmin Access
```
Login: anupkc_1@hotmail.com
Password: nepal123
URL: http://localhost:3000/login

Redirects to: http://localhost:3000/dashboard/admin/dashboard
```

**Superadmin Can:**
- ✅ View all organizations
- ✅ Manage tenant status (active/suspended)
- ✅ Access any tenant's data
- ✅ View system-wide statistics
- ✅ Create regular admin users

### Tenant Admin Access
```
Login: admin@kec.edu.np (example)
URL: http://kec.localhost:3000/login

Redirects to: http://kec.localhost:3000/dashboard
```

**Tenant Admin Can:**
- ✅ Manage departments, programs, semesters
- ✅ Add/edit teachers and subjects
- ✅ Create class routines
- ✅ View teacher schedules
- ✅ Generate reports
- ❌ Cannot access other tenants' data
- ❌ Cannot access system admin panel

---

## 🌍 Regional Customization (Future)

### Available Templates (Already Implemented)

#### Working Day Schedules
| Template | Working Days | Weekend | Best For |
|----------|-------------|---------|----------|
| Nepal Standard | Sun-Fri | Sat | Nepal institutions |
| International | Mon-Fri | Sat-Sun | US/Europe/Global |
| Middle East | Sun-Thu | Fri-Sat | Gulf countries |

#### Period Schedules
| Template | Start Time | Duration | Periods | Region |
|----------|-----------|----------|---------|---------|
| Nepal | 7:00 AM | 50 min | 10 | Nepal |
| USA | 8:00 AM | 45 min | 8 | USA |
| UK | 9:00 AM | 60 min | 6 | UK |
| India | 9:00 AM | 50 min | 7 | India |
| Evening | 4:00 PM | 60 min | 5 | All regions |

### How to Use (When Frontend Added)
```
During signup, select:
1. Institution Type: Engineering College / Management / High School
2. Schedule Template: Nepal Standard / US Standard / UK Standard
3. Working Days: Sun-Fri / Mon-Fri / Custom
```

---

## 🔄 Migrating Existing Tenants

If you have organizations created before this update:

### Check Which Need Migration
```bash
docker exec -it kec-routine-postgres psql -U postgres -d kec_routine -c \
  "SELECT t.subdomain, 
          (SELECT COUNT(*) FROM \"\" || t.schema_name || '\".days') as day_count,
          (SELECT COUNT(*) FROM \"' || t.schema_name || '\".shifts') as shift_count,
          (SELECT COUNT(*) FROM \"' || t.schema_name || '\".periods') as period_count
   FROM public.tenants t 
   WHERE t.deleted_at IS NULL
   ORDER BY t.created_at;"
```

### Run Migration
```bash
docker exec -it kec-routine-backend python scripts/migrate_existing_tenants.py
```

**Expected Output:**
```
==============================================================
TENANT DEFAULT DATA MIGRATION
==============================================================

Do you want to proceed? (yes/no): yes

Found 36 tenants to check
==============================================================

✓ kec: Already has 7 days, skipping...
⚙ kku: Populating default data...
  ✓ Added 7 days
  ✓ Added shift (ID: 1)
  ✓ Added 10 periods
✓ kku: Migration complete!

==============================================================
MIGRATION SUMMARY
==============================================================
Total schemas checked: 36
Already populated: 20
Successfully migrated: 16
Errors: 0

Records created:
  Days: 112
  Shifts: 16
  Periods: 160
==============================================================
```

---

## 🧪 Testing

### Manual Test
```bash
# Create test tenant
curl -X POST http://localhost:8000/api/tenants/signup \
  -H "Content-Type: application/json" \
  -d '{
    "institution_name": "Test College",
    "subdomain": "testcol",
    "admin_name": "Test Admin",
    "admin_email": "admin@testcol.edu",
    "admin_password": "test12345",
    "city": "Kathmandu",
    "country": "Nepal",
    "plan": "trial"
  }'

# Verify days (should return 7)
curl -H "X-Tenant-Subdomain: testcol" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8000/days/

# Verify periods (should return 10)
curl -H "X-Tenant-Subdomain: testcol" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8000/periods/

# Verify shifts (should return 1)
curl -H "X-Tenant-Subdomain: testcol" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8000/shifts/
```

### Automated Test
```bash
cd backend
python test_routine_creation.py
```

**Expected Results:**
- ✅ "Populate Days & Periods": Should show "Found 7 days" (not "Created 0 days")
- ✅ All navigation tests pass
- ✅ Routine generation works

---

## 📊 Default Data Specifications

### Days Table
```sql
name      | day_number | is_working_day
----------|------------|---------------
Sunday    | 0          | true
Monday    | 1          | true
Tuesday   | 2          | true
Wednesday | 3          | true
Thursday  | 4          | true
Friday    | 5          | true
Saturday  | 6          | false
```

### Shift Configuration
```
Name: Morning Shift
Start Time: 07:00:00
End Time: 15:30:00
Working Days: [0,1,2,3,4,5] (Sun-Fri)
Period Duration: 50 minutes
Breaks After: [2,4] (After 2nd and 4th period)
Break Durations: [15,60] (15 min tea, 60 min lunch)
```

### Periods (10 periods)
```
1st Period:  07:00 - 07:50
2nd Period:  07:50 - 08:40
--- 15 min break ---
3rd Period:  08:55 - 09:45
4th Period:  09:45 - 10:35
--- 60 min lunch ---
5th Period:  11:35 - 12:25
6th Period:  12:25 - 13:15
7th Period:  13:15 - 14:05
8th Period:  14:05 - 14:55
9th Period:  14:55 - 15:45
10th Period: 15:45 - 16:35
```

---

## 🐛 Troubleshooting

### "No days found" error
```bash
# Check if days exist
docker exec -it kec-routine-postgres psql -U postgres -d kec_routine \
  -c "SELECT * FROM \"YOUR_SUBDOMAIN\".days;"

# If empty, run migration
docker exec -it kec-routine-backend python scripts/migrate_existing_tenants.py
```

### Navigation not working
```bash
# Restart frontend to load updated routes
docker restart kec-routine-frontend

# Clear browser cache and refresh
Ctrl + Shift + R (Chrome/Firefox)
```

### CORS errors
```bash
# Ensure backend recognizes subdomain
# Check browser console for origin header

# Backend should show in logs:
[TENANT] Extracted subdomain from origin: kec
```

### Tenant isolation issues
```bash
# Verify each tenant has separate schema
docker exec -it kec-routine-postgres psql -U postgres -d kec_routine \
  -c "SELECT schema_name FROM information_schema.schemata 
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'public');"
```

---

## 📚 Related Documentation

- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Complete technical details
- [backend/app/config/README.md](./backend/app/config/README.md) - Template system guide
- [backend/scripts/MIGRATION_GUIDE.md](./backend/scripts/MIGRATION_GUIDE.md) - Migration instructions
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - Overall project documentation

---

## 🎯 Quick Reference

### URLs
- **Signup**: http://localhost:3000/signup
- **Login**: http://localhost:3000/login
- **Superadmin**: http://localhost:3000/dashboard/admin/dashboard
- **Tenant Dashboard**: http://SUBDOMAIN.localhost:3000/dashboard

### Default Accounts
```
Superadmin:
  Email: anupkc_1@hotmail.com
  Password: nepal123
  
Test Tenants:
  KKU: admin@kku.edu.np
  TestUni: admin@testuni.edu.np
  (Password varies by creation)
```

### API Endpoints
```
POST /api/tenants/signup - Create new tenant
POST /auth/login - User login
GET  /days/ - Get days (requires tenant header)
GET  /periods/ - Get periods
GET  /shifts/ - Get shifts
GET  /departments/ - Get departments
```

### Docker Commands
```bash
# View logs
docker logs kec-routine-backend
docker logs kec-routine-frontend

# Restart services
docker restart kec-routine-backend
docker restart kec-routine-frontend

# Database access
docker exec -it kec-routine-postgres psql -U postgres -d kec_routine

# Backend shell
docker exec -it kec-routine-backend /bin/bash

# Run migration
docker exec -it kec-routine-backend python scripts/migrate_existing_tenants.py
```

---

## ✅ Success Checklist

After implementation, verify:
- [ ] New tenant signup creates schema
- [ ] 7 days automatically created
- [ ] 10 periods automatically created
- [ ] 1 shift automatically created
- [ ] Navigation to /dashboard/departments works
- [ ] Navigation to /dashboard/teachers works
- [ ] Navigation to /dashboard/subjects works
- [ ] Class routine page loads
- [ ] Teacher routine page loads
- [ ] Tenant data isolated (can't see other tenants)
- [ ] CORS allows subdomain.localhost requests
- [ ] Superadmin can access admin panel
- [ ] Regular admin cannot access system admin panel

---

## 🚀 You're Ready!

Your multi-tenant routine scheduler is now fully operational with:
- ✅ Automatic schema initialization
- ✅ Complete default data seeding
- ✅ Working navigation
- ✅ Template system for customization
- ✅ Migration tools for existing data

**Start creating routines!** 🎓📅
