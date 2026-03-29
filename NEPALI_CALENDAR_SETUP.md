# Nepali Calendar (BS) Implementation Guide

## ✅ Completed Implementation

I've successfully implemented dual date display (AD/BS) for the Academic Calendar with the following features:

### Features Implemented:

1. **Dual Date Display on Mini Calendar**
   - Each date cell shows both English (AD) and Nepali (BS) dates
   - AD date on top (larger), BS date below (smaller)
   - Maintains all existing functionality (event dots, selection, etc.)

2. **Calendar Type Toggle**
   - Toggle button in header to switch between "English (AD)" and "नेपाली (BS)" view
   - Changes the primary/secondary display order

3. **Month Navigation with Dual Dates**
   - Month navigation shows both AD and BS month names
   - Primary month name changes based on selected calendar type
   - Secondary month name shown below in smaller text

4. **Event Cards with Dual Dates**
   - Event cards display both AD and BS dates
   - Example: "Monday, November 25, 2024" with "सोमबार, मंसिर ०९, २०८१" below
   - Clear visual hierarchy for easy reading

5. **Selected Date Panel**
   - Shows both AD and BS dates for the selected date
   - Switches primary/secondary based on calendar type toggle

### Files Created/Modified:

1. **Created:** `frontend/src/utils/nepaliCalendar.js`
   - Nepali date conversion utilities
   - Date formatting functions
   - Month/day name constants in Nepali

2. **Modified:** `frontend/src/pages/AcademicCalendar.jsx`
   - Added calendar type toggle
   - Updated mini calendar with dual dates
   - Enhanced event cards with dual date display
   - Updated month navigation
   - Updated selected date panel

## 📋 Setup Instructions

### Step 1: Install Nepali Date Converter Library

Run this command in your terminal:

```powershell
cd "c:\Users\Anup kc\Downloads\KEC Routine Scheduler Single Shift Edited\kecRoutine\kec-routine-scheduler\frontend"
npm install nepali-date-converter
```

### Step 2: Restart Frontend Server

After installing the package, restart the frontend development server:

```powershell
# Stop the current server (Ctrl+C)
# Then restart it
npm run dev
```

### Step 3: Test the Calendar

1. Navigate to http://localhost:3000/calendar
2. You should see:
   - Each date showing both AD and BS numbers
   - Toggle button at top right: "English (AD)" / "नेपाली (BS)"
   - Month navigation showing both calendar systems
   - Event cards displaying dual dates

## 🎨 Visual Features

### Mini Calendar
- **AD Date**: Larger number (e.g., 25)
- **BS Date**: Smaller Nepali number below (e.g., ०९)
- **Event Indicators**: Colored dots below dates with events

### Calendar Type Toggle
- **English (AD)**: Shows English months primarily
- **नेपाली (BS)**: Shows Nepali months primarily
- User preference can be saved to localStorage (future enhancement)

### Event Cards
**Primary Date Format:**
- English: "Monday, November 25, 2024"
- Nepali: "सोमबार, मंसिर ०९, २०८१"

**Secondary Date Format:**
- Shown in smaller, lighter text below primary date

## 🔧 Technical Details

### Nepali Calendar Utilities

The `nepaliCalendar.js` utility provides:

- `adToBS(date)` - Convert AD to BS
- `bsToAD(year, month, date)` - Convert BS to AD
- `formatNepaliDate(date, format)` - Format BS dates
- `toNepaliNumber(num)` - Convert to Nepali digits (०१२३...)
- `nepaliMonths` - Array of Nepali month names
- `nepaliWeekdaysLong` - Full Nepali weekday names

### State Management

New state variable:
```javascript
const [calendarType, setCalendarType] = useState('ad') // 'ad' or 'bs'
```

This controls which calendar system is shown primarily.

## 🚀 Future Enhancements

1. **Persistent Calendar Preference**
   - Save user's preferred calendar type to localStorage
   - Remember choice across sessions

2. **Full Nepali Calendar Mode**
   - Nepali weekday headers (आइत, सोम, etc.)
   - Nepali number system throughout

3. **BS Date Picker**
   - Native BS date picker for event creation
   - Automatic AD conversion

4. **Holiday Integration**
   - Nepali public holidays pre-loaded
   - Different styling for national holidays

## 📝 Notes

- The Nepali calendar (Bikram Sambat) is approximately 56-57 years ahead of AD
- Nepali months have 29-32 days (varies)
- The library handles all conversion complexities automatically
- All dates are stored in AD format in the database for consistency

## ✨ Example Output

**Mini Calendar Cell:**
```
25  ← English date
०९  ← Nepali date
●●  ← Event dots
```

**Event Card:**
```
🎉 Dashain Holiday

[Holiday Chip]

📅 Friday, October 11, 2024
   शुक्रबार, आश्विन २५, २०८१

📍 Nationwide
```

## 🐛 Troubleshooting

If you encounter issues:

1. **Module not found error:**
   - Ensure `nepali-date-converter` is installed
   - Check package.json for the dependency
   - Run `npm install` again if needed

2. **Date conversion errors:**
   - The library has limitations for very old/future dates
   - Error handling is built-in with fallbacks

3. **Display issues:**
   - Clear browser cache
   - Check browser console for errors
   - Verify font supports Nepali Unicode characters

## 📚 Resources

- [Nepali Date Converter NPM Package](https://www.npmjs.com/package/nepali-date-converter)
- [Bikram Sambat Calendar Info](https://en.wikipedia.org/wiki/Vikram_Samvat)

---

**Implementation completed successfully!** 🎉
The calendar now supports dual date display for better usability in Nepal.
