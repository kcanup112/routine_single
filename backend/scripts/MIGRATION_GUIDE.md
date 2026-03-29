# Tenant Default Data Migration

## Purpose
Backfills default data (days, shifts, periods) for tenants created before the auto-seeding feature was implemented.

## What It Does
For each active tenant schema:
1. ✅ Checks if days already exist (skips if 7+ days found)
2. ✅ Inserts 7 days (Sunday-Saturday) with working day flags
3. ✅ Creates default "Morning Shift" (7:00 AM - 3:30 PM)
4. ✅ Generates 10 teaching periods (50 minutes each)

## Usage

### Run Migration

```bash
# Inside Docker container
docker exec -it kec-routine-backend python scripts/migrate_existing_tenants.py

# OR directly with Python
cd backend
python scripts/migrate_existing_tenants.py
```

### Safety Features
- ✅ Interactive confirmation before execution
- ✅ Skips schemas that already have data
- ✅ Uses `ON CONFLICT DO NOTHING` for idempotency
- ✅ Individual transaction rollback on errors
- ✅ Detailed logging of all operations

### Expected Output

```
==============================================================
TENANT DEFAULT DATA MIGRATION
==============================================================
This script will add default days, shifts, and periods
to existing tenant schemas that don't have them yet.
==============================================================

Do you want to proceed? (yes/no): yes

==============================================================
Found 36 tenants to check
==============================================================

✓ kec: Already has 7 days, skipping...
⚙ kku: Populating default data...
  ✓ Added 7 days
  ✓ Added shift (ID: 1)
  ✓ Added 10 periods
✓ kku: Migration complete!

⚙ testuni: Populating default data...
  ✓ Added 7 days
  ✓ Added shift (ID: 1)
  ✓ Added 10 periods
✓ testuni: Migration complete!

==============================================================
MIGRATION SUMMARY
==============================================================
Total schemas checked: 36
Already populated: 1
Successfully migrated: 35
Errors: 0

Records created:
  Days: 245
  Shifts: 35
  Periods: 350
==============================================================
```

## When to Run

Run this script if:
- ❌ Existing tenants show "0 days" in tests
- ❌ Period/shift endpoints return empty arrays
- ❌ Class routine creation fails with "No periods found"
- ✅ After upgrading from pre-auto-seeding version

## Verification

Check if migration was successful:

```bash
# Check days count
docker exec -it kec-routine-postgres psql -U postgres -d kec_routine -c \
  "SELECT schema_name, (SELECT COUNT(*) FROM schema_name.days) as day_count FROM public.tenants WHERE deleted_at IS NULL;"

# Check specific tenant
docker exec -it kec-routine-postgres psql -U postgres -d kec_routine -c \
  "SELECT * FROM kku.days ORDER BY day_number;"
```

## Troubleshooting

### "Permission denied" error
```bash
# Grant execute permission
chmod +x scripts/migrate_existing_tenants.py
```

### "ModuleNotFoundError"
```bash
# Ensure you're in backend directory or container
cd backend
# OR
docker exec -it kec-routine-backend /bin/bash
cd /app
python scripts/migrate_existing_tenants.py
```

### Partial migration
If some schemas failed:
1. Check logs for specific error messages
2. Fix the issue (e.g., missing columns, constraint violations)
3. Re-run script (it will skip already-migrated schemas)

## Rollback

If needed, manually remove migrated data:

```sql
-- For specific tenant (replace 'kku' with tenant subdomain)
DELETE FROM "kku".periods;
DELETE FROM "kku".shifts;
DELETE FROM "kku".days;

-- Verify
SELECT 
  (SELECT COUNT(*) FROM "kku".days) as days,
  (SELECT COUNT(*) FROM "kku".shifts) as shifts,
  (SELECT COUNT(*) FROM "kku".periods) as periods;
```

## Notes

- ⚠️ Run during off-peak hours for large deployments
- ⚠️ Backup database before running in production
- ✅ Safe to run multiple times (idempotent)
- ✅ Individual schema failures don't affect others
