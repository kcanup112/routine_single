import NepaliDate from 'nepali-date-converter'

// Nepali month names
export const nepaliMonths = [
  'बैशाख', 'जेष्ठ', 'आषाढ', 'श्रावण', 'भाद्र', 'आश्विन',
  'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत्र'
]

// Nepali weekday names (short)
export const nepaliWeekdaysShort = ['आइत', 'सोम', 'मंगल', 'बुध', 'बिहि', 'शुक्र', 'शनि']

// Nepali weekday names (long)
export const nepaliWeekdaysLong = [
  'आइतबार', 'सोमबार', 'मंगलबार', 'बुधबार', 'बिहिबार', 'शुक्रबार', 'शनिबार'
]

// Nepali digits
export const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']

/**
 * Convert AD date to BS
 */
export const adToBS = (adDate) => {
  try {
    const nepaliDate = new NepaliDate(adDate)
    return {
      year: nepaliDate.getYear(),
      month: nepaliDate.getMonth(), // 0-indexed
      date: nepaliDate.getDate(),
      day: nepaliDate.getDay() // 0 = Sunday
    }
  } catch (error) {
    console.error('Error converting AD to BS:', error)
    return null
  }
}

/**
 * Convert BS date to AD
 */
export const bsToAD = (year, month, date) => {
  try {
    const nepaliDate = new NepaliDate(year, month, date)
    return nepaliDate.toJsDate()
  } catch (error) {
    console.error('Error converting BS to AD:', error)
    return null
  }
}

/**
 * Get month name in Nepali
 */
export const getNepaliMonthName = (monthIndex) => {
  return nepaliMonths[monthIndex] || ''
}

/**
 * Get current Nepali date
 */
export const getCurrentNepaliDate = () => {
  return adToBS(new Date())
}

/**
 * Check if two dates are same in BS calendar
 */
export const isSameBSDate = (date1, date2) => {
  const bs1 = adToBS(date1)
  const bs2 = adToBS(date2)
  
  if (!bs1 || !bs2) return false
  
  return bs1.year === bs2.year && bs1.month === bs2.month && bs1.date === bs2.date
}

/**
 * Get number of days in a Nepali month
 */
export const getDaysInNepaliMonth = (year, month) => {
  try {
    // Get the first day of next month and subtract 1 day to find last day of current month
    let nextMonth = month + 1
    let nextYear = year
    
    if (nextMonth > 11) {
      nextMonth = 0
      nextYear++
    }
    
    // Create date for 1st of next month
    const nextMonthDate = new NepaliDate(nextYear, nextMonth, 1)
    const nextMonthAD = nextMonthDate.toJsDate()
    
    // Go back one day
    nextMonthAD.setDate(nextMonthAD.getDate() - 1)
    
    // Convert back to BS to get the last day
    const lastDay = adToBS(nextMonthAD)
    
    return lastDay.date
  } catch (error) {
    console.error('Error getting days in Nepali month:', error)
    // Default days per month (approximation)
    const defaultDays = [31, 31, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30]
    return defaultDays[month] || 30
  }
}

/**
 * Get start of Nepali month in AD
 */
export const getStartOfNepaliMonth = (year, month) => {
  return bsToAD(year, month, 1)
}

/**
 * Get end of Nepali month in AD
 */
export const getEndOfNepaliMonth = (year, month) => {
  const days = getDaysInNepaliMonth(year, month)
  return bsToAD(year, month, days)
}

/**
 * Add months to Nepali date
 */
export const addNepaliMonths = (adDate, monthsToAdd) => {
  const bs = adToBS(adDate)
  if (!bs) return adDate
  
  let newMonth = bs.month + monthsToAdd
  let newYear = bs.year
  
  while (newMonth > 11) {
    newMonth -= 12
    newYear++
  }
  
  while (newMonth < 0) {
    newMonth += 12
    newYear--
  }
  
  // Adjust date if it exceeds the month's days
  const daysInNewMonth = getDaysInNepaliMonth(newYear, newMonth)
  const newDate = Math.min(bs.date, daysInNewMonth)
  
  return bsToAD(newYear, newMonth, newDate)
}

/**
 * Subtract months from Nepali date
 */
export const subtractNepaliMonths = (adDate, monthsToSubtract) => {
  return addNepaliMonths(adDate, -monthsToSubtract)
}

/**
 * Convert English number to Nepali digits
 */
export const englishToNepaliNumber = (num) => {
  return String(num)
    .split('')
    .map(digit => nepaliDigits[parseInt(digit)] || digit)
    .join('')
}

/**
 * Format Nepali date
 * @param {Date} adDate - JavaScript Date object
 * @param {string} format - 'short', 'medium', 'long', 'full'
 */
export const formatBSDate = (adDate, format = 'medium') => {
  const bs = adToBS(adDate)
  if (!bs) return ''

  const { year, month, date, day } = bs

  switch (format) {
    case 'short':
      // २०८१/०८/०९
      return `${englishToNepaliNumber(year)}/${englishToNepaliNumber(String(month + 1).padStart(2, '0'))}/${englishToNepaliNumber(String(date).padStart(2, '0'))}`
    
    case 'medium':
      // मंसिर ०९, २०८१
      return `${nepaliMonths[month]} ${englishToNepaliNumber(date)}, ${englishToNepaliNumber(year)}`
    
    case 'long':
      // सोमबार, मंसिर ०९, २०८१
      return `${nepaliWeekdaysLong[day]}, ${nepaliMonths[month]} ${englishToNepaliNumber(date)}, ${englishToNepaliNumber(year)}`
    
    case 'full':
      // सोमबार, मंसिर ०९, २०८१ (November 25, 2024)
      return `${nepaliWeekdaysLong[day]}, ${nepaliMonths[month]} ${englishToNepaliNumber(date)}, ${englishToNepaliNumber(year)}`
    
    default:
      return `${nepaliMonths[month]} ${englishToNepaliNumber(date)}, ${englishToNepaliNumber(year)}`
  }
}

/**
 * Generate Nepali calendar grid for a given BS month
 * Returns array of calendar weeks with BS dates and their corresponding AD dates
 */
export const generateNepaliCalendarGrid = (year, month) => {
  try {
    const daysInMonth = getDaysInNepaliMonth(year, month)
    const firstDayAD = bsToAD(year, month, 1)
    const firstDayOfWeek = firstDayAD.getDay() // 0 = Sunday
    
    const calendarGrid = []
    let week = []
    
    // Fill empty days before month starts
    for (let i = 0; i < firstDayOfWeek; i++) {
      // Get previous month's dates
      let prevMonth = month - 1
      let prevYear = year
      if (prevMonth < 0) {
        prevMonth = 11
        prevYear--
      }
      const prevMonthDays = getDaysInNepaliMonth(prevYear, prevMonth)
      const prevDate = prevMonthDays - (firstDayOfWeek - i - 1)
      const prevDateAD = bsToAD(prevYear, prevMonth, prevDate)
      
      week.push({
        bsDate: prevDate,
        bsMonth: prevMonth,
        bsYear: prevYear,
        adDate: prevDateAD,
        isCurrentMonth: false
      })
    }
    
    // Fill current month days
    for (let date = 1; date <= daysInMonth; date++) {
      const adDate = bsToAD(year, month, date)
      week.push({
        bsDate: date,
        bsMonth: month,
        bsYear: year,
        adDate: adDate,
        isCurrentMonth: true
      })
      
      if (week.length === 7) {
        calendarGrid.push(week)
        week = []
      }
    }
    
    // Fill remaining days from next month
    if (week.length > 0) {
      let nextMonth = month + 1
      let nextYear = year
      if (nextMonth > 11) {
        nextMonth = 0
        nextYear++
      }
      
      let nextDate = 1
      while (week.length < 7) {
        const nextDateAD = bsToAD(nextYear, nextMonth, nextDate)
        week.push({
          bsDate: nextDate,
          bsMonth: nextMonth,
          bsYear: nextYear,
          adDate: nextDateAD,
          isCurrentMonth: false
        })
        nextDate++
      }
      calendarGrid.push(week)
    }
    
    return calendarGrid
  } catch (error) {
    console.error('Error generating Nepali calendar grid:', error)
    return []
  }
}
