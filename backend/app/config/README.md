# Tenant Configuration Templates

This directory contains configuration templates for customizing tenant defaults based on institution type, region, and schedule preferences.

## Files

### `tenant_defaults.py`
Provides customizable templates for:
- **Working Day Schedules**: Nepal (Sun-Fri), International (Mon-Fri), Middle East (Sun-Thu), etc.
- **Period Templates**: Different countries' academic schedules (Nepal, US, UK, India)
- **Institution Types**: Engineering college, Management college, High school, University

## Usage

### In Tenant Signup

```python
from app.config.tenant_defaults import (
    get_default_settings_for_country,
    get_period_template,
    generate_period_data
)

# Get defaults based on country
country_settings = get_default_settings_for_country("Nepal")

# Generate periods for tenant schema
periods = generate_period_data(country_settings["period_template"])
```

### Available Templates

#### Working Day Templates
- `nepal_standard`: Sunday-Friday (Sat weekend)
- `international_standard`: Monday-Friday (Sat-Sun weekend)
- `middle_east`: Sunday-Thursday (Fri-Sat weekend)
- `custom_six_day`: 6-day work week

#### Period Templates
- `nepal_standard`: 7:00 AM - 3:30 PM, 50 min periods, 10 periods
- `us_standard`: 8:00 AM - 3:00 PM, 45 min periods, 8 periods
- `uk_standard`: 9:00 AM - 3:30 PM, 60 min periods, 6 periods
- `india_standard`: 9:00 AM - 4:00 PM, 50 min periods, 7 periods
- `evening_shift`: 4:00 PM - 9:00 PM, 60 min periods, 5 periods

#### Institution Templates
- `engineering_college`
- `management_college`
- `high_school`
- `university`

## Customization

To add a new template:

1. Edit `tenant_defaults.py`
2. Add entry to the appropriate template dictionary
3. Follow the existing structure for consistency
4. Update the exported template name lists

## Integration

These templates are used during:
1. Tenant signup (automatic schema population)
2. Settings page (allow post-signup customization)
3. Admin portal (override defaults for specific tenants)

## Future Enhancements

- [ ] Add template selection to signup form
- [ ] Create settings page to modify schedules post-signup
- [ ] Add multi-shift support (morning + evening)
- [ ] Support custom break times per institution
- [ ] Add academic calendar templates
- [ ] Support Bikram Sambat (BS) calendar for Nepal
