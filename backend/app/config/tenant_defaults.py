"""
Tenant Default Configuration Templates
Provides customizable defaults for different institution types and regions
"""
from typing import Dict, List, Any
from datetime import time


# Working Day Templates
WORKING_DAY_TEMPLATES = {
    "nepal_standard": {
        "name": "Nepal Standard (Sun-Fri)",
        "working_days": [0, 1, 2, 3, 4, 5],  # Sunday to Friday
        "weekend": [6],  # Saturday
        "day_names": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    },
    "international_standard": {
        "name": "International Standard (Mon-Fri)",
        "working_days": [1, 2, 3, 4, 5],  # Monday to Friday
        "weekend": [0, 6],  # Sunday and Saturday
        "day_names": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    },
    "middle_east": {
        "name": "Middle East (Sun-Thu)",
        "working_days": [0, 1, 2, 3, 4],  # Sunday to Thursday
        "weekend": [5, 6],  # Friday and Saturday
        "day_names": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    },
    "custom_six_day": {
        "name": "Custom 6-Day Week",
        "working_days": [0, 1, 2, 3, 4, 5],
        "weekend": [6],
        "day_names": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    }
}


# Period/Schedule Templates by Region
PERIOD_TEMPLATES = {
    "nepal_standard": {
        "name": "Nepal Standard Schedule",
        "shift_name": "Morning Shift",
        "start_time": "07:00:00",
        "end_time": "15:30:00",
        "period_duration": 50,  # minutes
        "num_periods": 10,
        "break_after_periods": [2, 4],  # Break after 2nd and 4th period
        "break_durations": [15, 60],  # 15 min tea break, 60 min lunch
        "description": "Standard Nepali academic schedule with tea and lunch breaks"
    },
    "us_standard": {
        "name": "US Standard Schedule",
        "shift_name": "Day Schedule",
        "start_time": "08:00:00",
        "end_time": "15:00:00",
        "period_duration": 45,  # minutes
        "num_periods": 8,
        "break_after_periods": [4],  # Lunch after 4th period
        "break_durations": [30],  # 30 min lunch
        "description": "Standard US K-12 schedule with lunch break"
    },
    "uk_standard": {
        "name": "UK Standard Schedule",
        "shift_name": "School Day",
        "start_time": "09:00:00",
        "end_time": "15:30:00",
        "period_duration": 60,  # minutes
        "num_periods": 6,
        "break_after_periods": [2, 4],  # Morning break and lunch
        "break_durations": [15, 45],  # 15 min break, 45 min lunch
        "description": "Standard UK secondary school schedule"
    },
    "india_standard": {
        "name": "India Standard Schedule",
        "shift_name": "College Shift",
        "start_time": "09:00:00",
        "end_time": "16:00:00",
        "period_duration": 50,
        "num_periods": 7,
        "break_after_periods": [3],
        "break_durations": [60],  # 1 hour lunch
        "description": "Standard Indian college schedule"
    },
    "evening_shift": {
        "name": "Evening Shift",
        "shift_name": "Evening Classes",
        "start_time": "16:00:00",
        "end_time": "21:00:00",
        "period_duration": 60,
        "num_periods": 5,
        "break_after_periods": [2],
        "break_durations": [15],
        "description": "Evening shift for working professionals or part-time programs"
    }
}


# Institution Type Templates
INSTITUTION_TEMPLATES = {
    "engineering_college": {
        "name": "Engineering College",
        "period_template": "nepal_standard",
        "working_day_template": "nepal_standard",
        "default_max_periods_per_week": 30,
        "default_class_capacity": 60,
        "suggested_departments": ["Computer Engineering", "Civil Engineering", "Electronics Engineering", "Mechanical Engineering"],
        "academic_year_start_month": 8  # August (Nepali calendar)
    },
    "management_college": {
        "name": "Management College",
        "period_template": "nepal_standard",
        "working_day_template": "nepal_standard",
        "default_max_periods_per_week": 25,
        "default_class_capacity": 80,
        "suggested_departments": ["Business Administration", "Marketing", "Finance", "Human Resources"],
        "academic_year_start_month": 8
    },
    "high_school": {
        "name": "High School/+2",
        "period_template": "nepal_standard",
        "working_day_template": "nepal_standard",
        "default_max_periods_per_week": 35,
        "default_class_capacity": 40,
        "suggested_departments": ["Science", "Management", "Humanities", "Education"],
        "academic_year_start_month": 4  # April (Nepali new year)
    },
    "university": {
        "name": "University",
        "period_template": "nepal_standard",
        "working_day_template": "nepal_standard",
        "default_max_periods_per_week": 20,
        "default_class_capacity": 100,
        "suggested_departments": ["Faculty of Engineering", "Faculty of Science", "Faculty of Management", "Faculty of Humanities"],
        "academic_year_start_month": 8
    }
}


def get_working_days_config(template_name: str = "nepal_standard") -> Dict[str, Any]:
    """Get working days configuration by template name"""
    return WORKING_DAY_TEMPLATES.get(template_name, WORKING_DAY_TEMPLATES["nepal_standard"])


def get_period_template(template_name: str = "nepal_standard") -> Dict[str, Any]:
    """Get period/schedule template by name"""
    return PERIOD_TEMPLATES.get(template_name, PERIOD_TEMPLATES["nepal_standard"])


def get_institution_template(template_name: str = "engineering_college") -> Dict[str, Any]:
    """Get institution configuration template"""
    return INSTITUTION_TEMPLATES.get(template_name, INSTITUTION_TEMPLATES["engineering_college"])


def generate_period_data(template_name: str = "nepal_standard") -> List[Dict[str, Any]]:
    """
    Generate period data based on template
    Returns list of period dictionaries ready for database insertion
    """
    template = get_period_template(template_name)
    
    periods = []
    start_time_str = template["start_time"]
    start_hour, start_minute = map(int, start_time_str.split(":")[0:2])
    period_duration = template["period_duration"]
    
    for i in range(1, template["num_periods"] + 1):
        # Calculate start time
        total_minutes = (i - 1) * period_duration
        current_start_hour = start_hour + (total_minutes // 60)
        current_start_minute = start_minute + (total_minutes % 60)
        
        # Calculate end time
        total_end_minutes = i * period_duration
        current_end_hour = start_hour + (total_end_minutes // 60)
        current_end_minute = start_minute + (total_end_minutes % 60)
        
        start_time = f"{current_start_hour:02d}:{current_start_minute:02d}:00"
        end_time = f"{current_end_hour:02d}:{current_end_minute:02d}:00"
        
        suffix = "st" if i == 1 else "nd" if i == 2 else "rd" if i == 3 else "th"
        period_name = f"{i}{suffix} Period"
        
        periods.append({
            "period_number": i,
            "name": period_name,
            "start_time": start_time,
            "end_time": end_time,
            "type": "teaching",
            "is_teaching_period": True,
            "is_active": True
        })
    
    return periods


def get_default_settings_for_country(country: str) -> Dict[str, Any]:
    """
    Get default tenant settings based on country
    """
    country_defaults = {
        "Nepal": {
            "working_day_template": "nepal_standard",
            "period_template": "nepal_standard",
            "time_zone": "Asia/Kathmandu",
            "locale": "en-US",
            "calendar_type": "ad",  # Can be "bs" for Bikram Sambat
            "currency": "NPR"
        },
        "India": {
            "working_day_template": "international_standard",
            "period_template": "india_standard",
            "time_zone": "Asia/Kolkata",
            "locale": "en-IN",
            "calendar_type": "ad",
            "currency": "INR"
        },
        "USA": {
            "working_day_template": "international_standard",
            "period_template": "us_standard",
            "time_zone": "America/New_York",
            "locale": "en-US",
            "calendar_type": "ad",
            "currency": "USD"
        },
        "UK": {
            "working_day_template": "international_standard",
            "period_template": "uk_standard",
            "time_zone": "Europe/London",
            "locale": "en-GB",
            "calendar_type": "ad",
            "currency": "GBP"
        }
    }
    
    return country_defaults.get(country, country_defaults["Nepal"])


# Export available template names
AVAILABLE_WORKING_DAY_TEMPLATES = list(WORKING_DAY_TEMPLATES.keys())
AVAILABLE_PERIOD_TEMPLATES = list(PERIOD_TEMPLATES.keys())
AVAILABLE_INSTITUTION_TEMPLATES = list(INSTITUTION_TEMPLATES.keys())
