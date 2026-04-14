import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  Paper,
  Box,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Chip,
  Card,
  CardContent,
  FormControlLabel,
  Checkbox,
  Alert,
  Snackbar,
  alpha,
  useTheme,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ChevronLeft,
  ChevronRight,
  Event as EventIcon,
  Today as TodayIcon,
  CalendarMonth as CalendarMonthIcon,
} from '@mui/icons-material'
import { DatePicker, TimePicker } from '@mui/x-date-pickers'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { calendarService } from '../services'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, differenceInDays, isWithinInterval, parseISO } from 'date-fns'
import { formatBSDate, adToBS, nepaliMonths, englishToNepaliNumber, generateNepaliCalendarGrid, addNepaliMonths, subtractNepaliMonths } from '../utils/nepaliCalendar'

const eventTypeOptions = [
  { value: 'holiday', label: 'Holiday', color: '#e53935', icon: '🎉' },
  { value: 'exam', label: 'Exam', color: '#f59e0b', icon: '📝' },
  { value: 'event', label: 'Event', color: '#1976d2', icon: '🎊' },
  { value: 'deadline', label: 'Deadline', color: '#9333ea', icon: '⏰' },
  { value: 'meeting', label: 'Meeting', color: '#10b981', icon: '👥' },
  { value: 'welcome_farewell', label: 'Welcome and Farewell', color: '#ec4899', icon: '🎓' },
  { value: 'orientation', label: 'Orientation Program', color: '#06b6d4', icon: '🎯' },
  { value: 'sports', label: 'Sports Week', color: '#84cc16', icon: '⚽' },
  { value: 'tour', label: 'Educational Tour', color: '#8b5cf6', icon: '🚌' },
  { value: 'class_test', label: 'Class Test', color: '#f97316', icon: '📋' },
  { value: 'conference', label: 'Conference', color: '#0891b2', icon: '🎤' },
  { value: 'exhibition', label: 'Exhibition', color: '#a855f7', icon: '🖼️' },
]

export default function AcademicCalendar() {
  const { isAdmin, isAuthenticated } = useAuth()
  const theme = useTheme()
  const canEdit = isAuthenticated && isAdmin()
  
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [events, setEvents] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const [calendarType, setCalendarType] = useState('ad') // 'ad' or 'bs'
  const [isMultiDay, setIsMultiDay] = useState(false)
  const [isSelectingEndDate, setIsSelectingEndDate] = useState(false) // for BS mode

  // Parse a "YYYY-MM-DD" string as LOCAL midnight (not UTC) to avoid off-by-one timezone issues
  const parseLocalDate = (dateStr) => {
    if (!dateStr) return null
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d)
  }

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: new Date(),
    end_date: new Date(),
    event_type: 'event',
    is_all_day: true,
    start_time: null,
    end_time: null,
    location: '',
    status: 'scheduled',
  })

  useEffect(() => {
    fetchEvents()
  }, [currentMonth])

  const fetchEvents = async () => {
    try {
      // Widen range to cover full calendar grid (prev/next month overflow days)
      const start = startOfWeek(startOfMonth(currentMonth))
      const end = endOfWeek(endOfMonth(currentMonth))
      const response = await calendarService.getEvents({
        start_date: format(start, 'yyyy-MM-dd'),
        end_date: format(end, 'yyyy-MM-dd'),
      })
      setEvents(response.data)
    } catch (error) {
      console.error('Failed to fetch events:', error)
      showSnackbar('Failed to load events', 'error')
    }
  }

  const handlePreviousMonth = () => {
    if (calendarType === 'bs') {
      setCurrentMonth(subtractNepaliMonths(currentMonth, 1))
    } else {
      setCurrentMonth(subMonths(currentMonth, 1))
    }
  }

  const handleNextMonth = () => {
    if (calendarType === 'bs') {
      setCurrentMonth(addNepaliMonths(currentMonth, 1))
    } else {
      setCurrentMonth(addMonths(currentMonth, 1))
    }
  }

  const handleToday = () => {
    setCurrentMonth(new Date())
  }

  const handleDateClick = (date) => {
    if (!canEdit) {
      setSelectedDate(date)
      return
    }
    setSelectedDate(date)
    setIsMultiDay(false)
    setIsSelectingEndDate(false)
    setFormData({
      ...formData,
      start_date: date,
      end_date: date,
    })
    setEditingEvent(null)
    setOpenDialog(true)
  }

  const handleEditEvent = (event, e) => {
    e?.stopPropagation()
    setEditingEvent(event)
    const startD = parseLocalDate(event.start_date)
    const endD = parseLocalDate(event.end_date)
    const multiDay = differenceInDays(endD, startD) > 0
    setIsMultiDay(multiDay)
    setIsSelectingEndDate(false)
    setFormData({
      title: event.title,
      description: event.description || '',
      start_date: startD,
      end_date: endD,
      event_type: event.event_type,
      is_all_day: event.is_all_day,
      start_time: event.start_time ? new Date(`1970-01-01T${event.start_time}`) : null,
      end_time: event.end_time ? new Date(`1970-01-01T${event.end_time}`) : null,
      location: event.location || '',
      status: event.status || 'scheduled',
    })
    setOpenDialog(true)
  }

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return
    
    try {
      await calendarService.deleteEvent(eventId)
      showSnackbar('Event deleted successfully', 'success')
      fetchEvents()
    } catch (error) {
      console.error('Failed to delete event:', error)
      showSnackbar('Failed to delete event', 'error')
    }
  }

  const handleSaveEvent = async () => {
    if (!formData.title || !formData.title.trim()) {
      showSnackbar('Event title is required', 'error')
      return
    }
    if (!formData.start_date) {
      showSnackbar('Event date is required', 'error')
      return
    }
    if (isMultiDay && formData.end_date < formData.start_date) {
      showSnackbar('End date cannot be before start date', 'error')
      return
    }
    try {
      const eventData = {
        title: formData.title.trim(),
        description: formData.description || null,
        start_date: format(formData.start_date, 'yyyy-MM-dd'),
        end_date: format(formData.end_date || formData.start_date, 'yyyy-MM-dd'),
        event_type: formData.event_type,
        is_all_day: formData.is_all_day,
        start_time: formData.is_all_day || !formData.start_time ? null : format(formData.start_time, 'HH:mm:ss'),
        end_time: formData.is_all_day || !formData.end_time ? null : format(formData.end_time, 'HH:mm:ss'),
        location: formData.location || null,
        status: formData.status || 'scheduled',
      }

      if (editingEvent) {
        await calendarService.updateEvent(editingEvent.id, eventData)
        showSnackbar('Event updated successfully', 'success')
      } else {
        await calendarService.createEvent(eventData)
        showSnackbar('Event created successfully', 'success')
      }
      
      setOpenDialog(false)
      fetchEvents()
      resetForm()
    } catch (error) {
      console.error('Failed to save event:', error)
      showSnackbar('Failed to save event', 'error')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      start_date: new Date(),
      end_date: new Date(),
      event_type: 'event',
      is_all_day: true,
      start_time: null,
      end_time: null,
      location: '',
      status: 'scheduled',
    })
    setEditingEvent(null)
    setIsMultiDay(false)
    setIsSelectingEndDate(false)
  }

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity })
  }

  const getEventsForDate = (date) => {
    // Normalise comparison date to local midnight so timezone doesn't shift the day
    const cmp = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    return events.filter(event => {
      const eventStart = parseLocalDate(event.start_date)
      const eventEnd = parseLocalDate(event.end_date)
      return cmp >= eventStart && cmp <= eventEnd
    })
  }

  const getEventTypeIcon = (eventType) => {
    const type = eventTypeOptions.find(opt => opt.value === eventType)
    return type?.icon || '📅'
  }

  const getUpcomingEvents = () => {
    const today = new Date()
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return events
      .filter(event => parseLocalDate(event.end_date) >= todayMidnight)
      .sort((a, b) => parseLocalDate(a.start_date) - parseLocalDate(b.start_date))
      .slice(0, 10)
  }

  const getSelectedDateEvents = () => {
    if (!selectedDate) return []
    return getEventsForDate(selectedDate)
  }

  const renderMiniCalendar = () => {
    // Get current month in BS for display
    const currentBS = adToBS(currentMonth)
    
    let calendarDays = []
    
    if (calendarType === 'bs' && currentBS) {
      // Use Nepali calendar grid when in BS mode
      const bsGrid = generateNepaliCalendarGrid(currentBS.year, currentBS.month)
      calendarDays = bsGrid.flat() // Flatten weeks into single array
    } else {
      // Use AD calendar grid when in English mode
      const monthStart = startOfMonth(currentMonth)
      const monthEnd = endOfMonth(currentMonth)
      const startDate = startOfWeek(monthStart)
      const endDate = endOfWeek(monthEnd)
      
      const days = eachDayOfInterval({ start: startDate, end: endDate })
      calendarDays = days.map(day => ({
        adDate: day,
        isCurrentMonth: isSameMonth(day, currentMonth)
      }))
    }
    
    return (
      <Box>
        {/* Day headers */}
        <Grid container spacing={0.5} sx={{ mb: 0.5 }}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
            <Grid item xs={12/7} key={idx}>
              <Box sx={{ textAlign: 'center', py: 0.5 }}>
                <Typography 
                  variant="caption" 
                  fontWeight="bold" 
                  color="text.secondary"
                  sx={{ fontSize: '0.7rem' }}
                >
                  {day}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Mini calendar days */}
        <Grid container spacing={0.5}>
          {calendarDays.map((dayData, idx) => {
            const day = dayData.adDate
            const dayEvents = getEventsForDate(day)
            const isCurrentMonth = dayData.isCurrentMonth
            const isToday = isSameDay(day, new Date())
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            const dayBS = adToBS(day)
            const dayOfWeek = day.getDay() // 0 = Sunday, 5 = Friday, 6 = Saturday
            const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 // Friday or Saturday
            
            // Create tooltip content for events
            const tooltipContent = dayEvents.length > 0 ? (
              <Box sx={{ p: 1, maxWidth: 300 }}>
                {dayEvents.slice(0, 5).map((event, i) => (
                  <Box
                    key={i}
                    sx={{
                      mb: i < Math.min(dayEvents.length, 5) - 1 ? 1 : 0,
                      pb: i < Math.min(dayEvents.length, 5) - 1 ? 1 : 0,
                      borderBottom: i < Math.min(dayEvents.length, 5) - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontSize: '1.2rem' }}>
                        {event.icon}
                      </Typography>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ flex: 1 }}>
                        {event.title}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={event.event_type}
                        size="small"
                        sx={{
                          backgroundColor: event.color,
                          color: 'white',
                          fontSize: '0.7rem',
                          height: 20,
                        }}
                      />
                      {event.start_time && (
                        <Typography variant="caption" color="text.secondary">
                          {event.start_time}
                          {event.end_time && ` - ${event.end_time}`}
                        </Typography>
                      )}
                    </Box>
                    {event.description && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {event.description.length > 60 
                          ? `${event.description.substring(0, 60)}...` 
                          : event.description}
                      </Typography>
                    )}
                  </Box>
                ))}
                {dayEvents.length > 5 && (
                  <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block', fontWeight: 'bold' }}>
                    +{dayEvents.length - 5} more event{dayEvents.length - 5 > 1 ? 's' : ''}
                  </Typography>
                )}
              </Box>
            ) : null
            
            const dayCell = (
              <Grid item xs={12/7} key={idx}>
                <Box
                  sx={{
                    minHeight: 45,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 1,
                    cursor: 'pointer',
                    backgroundColor: isToday 
                      ? theme.palette.primary.main
                      : isSelected
                      ? alpha(theme.palette.primary.main, 0.15)
                      : isWeekend
                      ? alpha('#cb4a3e', 0.15) // Dark red for weekends
                      : 'transparent',
                    color: isToday ? 'white' : isCurrentMonth ? 'text.primary' : 'text.disabled',
                    border: isSelected && !isToday ? `2px solid ${theme.palette.primary.main}` : 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: isToday 
                        ? theme.palette.primary.dark
                        : isWeekend
                        ? alpha('#ff002bff', 0.50)
                        : alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                  onClick={() => {
                    setSelectedDate(day)
                    if (canEdit && isCurrentMonth) {
                      if (openDialog && isMultiDay) {
                        // Inside dialog: route click to start or end date
                        if (isSelectingEndDate) {
                          setFormData(prev => ({ ...prev, end_date: day }))
                          setIsSelectingEndDate(false)
                        } else {
                          setFormData(prev => ({ ...prev, start_date: day, end_date: day }))
                        }
                      } else {
                        setFormData(prev => ({ ...prev, start_date: day, end_date: day }))
                      }
                    }
                  }}
                >
                  {/* Primary Date - BS if Nepali mode, AD if English mode */}
                  <Typography 
                    variant="body2" 
                    fontWeight={isToday || isSelected ? 'bold' : 'normal'}
                    sx={{ fontSize: '0.875rem', lineHeight: 1.2 }}
                  >
                    {calendarType === 'bs' && dayBS
                      ? englishToNepaliNumber(dayBS.date)
                      : format(day, 'd')}
                  </Typography>
                  {/* Secondary Date - AD if Nepali mode, BS if English mode */}
                  {dayBS && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '0.6rem', 
                        lineHeight: 1,
                        opacity: 0.8,
                        color: isToday ? 'white' : 'text.secondary'
                      }}
                    >
                      {calendarType === 'bs'
                        ? format(day, 'd')
                        : englishToNepaliNumber(dayBS.date)}
                    </Typography>
                  )}
                  {dayEvents.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.3, mt: 0.3 }}>
                      {dayEvents.slice(0, 3).map((event, i) => (
                        <Box
                          key={i}
                          sx={{
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            backgroundColor: isToday ? 'white' : event.color || theme.palette.primary.main,
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              </Grid>
            )
            
            // Wrap with Tooltip if there are events
            return dayEvents.length > 0 ? (
              <Tooltip
                key={idx}
                title={tooltipContent}
                placement="top"
                arrow
                enterDelay={300}
                leaveDelay={100}
                componentsProps={{
                  tooltip: {
                    sx: {
                      bgcolor: 'background.paper',
                      color: 'text.primary',
                      boxShadow: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      maxWidth: 320,
                    },
                  },
                  arrow: {
                    sx: {
                      color: 'background.paper',
                      '&::before': {
                        border: '1px solid',
                        borderColor: 'divider',
                      },
                    },
                  },
                }}
              >
                {dayCell}
              </Tooltip>
            ) : dayCell
          })}
        </Grid>
      </Box>
    )
  }

  const renderEventCard = (event) => {
    const eventDate = parseLocalDate(event.start_date)
    const eventTypeConfig = eventTypeOptions.find(opt => opt.value === event.event_type)
    const eventColor = eventTypeConfig?.color || '#1976d2'
    const eventBS = adToBS(eventDate)
    
    return (
      <Card
        key={event.id}
        sx={{
          mb: 2,
          borderRadius: 2,
          borderLeft: `4px solid ${eventColor}`,
          cursor: canEdit ? 'pointer' : 'default',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: canEdit ? 3 : 1,
            transform: canEdit ? 'translateX(4px)' : 'none',
          },
        }}
        onClick={() => canEdit && handleEditEvent(event)}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
              <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                {getEventTypeIcon(event.event_type)} {event.title}
              </Typography>
            </Box>
            {canEdit && (
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <IconButton 
                  size="small" 
                  onClick={(e) => handleEditEvent(event, e)}
                  sx={{ color: 'primary.main' }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteEvent(event.id)
                  }}
                  sx={{ color: 'error.main' }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>
          
          <Chip
            label={eventTypeConfig?.label || event.event_type}
            size="small"
            sx={{
              mb: 1,
              backgroundColor: alpha(eventColor, 0.1),
              color: eventColor,
              fontWeight: 'bold',
            }}
          />
          
          {/* Date Display - single or range */}
          <Box sx={{ mb: 0.5 }}>
            {differenceInDays(parseLocalDate(event.end_date), parseLocalDate(event.start_date)) > 0 ? (
              <>
                <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600, mb: 0.3 }}>
                  📅 {format(eventDate, 'MMM d')} → {format(parseLocalDate(event.end_date), 'MMM d, yyyy')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', pl: 2.5 }}>
                  {differenceInDays(parseLocalDate(event.end_date), eventDate) + 1} days
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600, mb: 0.3 }}>
                  📅 {format(eventDate, 'EEEE, MMMM d, yyyy')}
                </Typography>
                {eventBS && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', pl: 2.5 }}>
                    {formatBSDate(eventDate, 'long')}
                  </Typography>
                )}
              </>
            )}
          </Box>
          
          {!event.is_all_day && event.start_time && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              ⏰ {event.start_time.substring(0, 5)}
              {event.end_time && ` - ${event.end_time.substring(0, 5)}`}
            </Typography>
          )}
          
          {event.location && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              📍 {event.location}
            </Typography>
          )}
          
          {event.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {event.description}
            </Typography>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ maxWidth: 1400, margin: '0 auto', px: { xs: 2, sm: 3 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a2332', mb: 0.25 }}>
              Academic Calendar
            </Typography>
            <Typography variant="body2" sx={{ color: '#8896a4' }}>
              Stay organized with your academic schedule
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Calendar Type Toggle */}
            <ToggleButtonGroup
              value={calendarType}
              exclusive
              onChange={(e, newType) => newType && setCalendarType(newType)}
              size="small"
              sx={{
                backgroundColor: 'white',
                border: '1px solid #e8edf2',
                borderRadius: '10px',
                overflow: 'hidden',
                '& .MuiToggleButton-root': {
                  px: 2,
                  py: 0.75,
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  border: 'none',
                  textTransform: 'none',
                  '&.Mui-selected': {
                    backgroundColor: '#2d6a6f',
                    color: 'white',
                    '&:hover': { backgroundColor: '#235558' },
                  },
                },
              }}
            >
              <ToggleButton value="ad">English (AD)</ToggleButton>
              <ToggleButton value="bs">नेपाली (BS)</ToggleButton>
            </ToggleButtonGroup>

            {canEdit && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => { resetForm(); setOpenDialog(true) }}
                sx={{ borderRadius: '10px', px: 2.5, textTransform: 'none', fontWeight: 600, backgroundColor: '#2d6a6f', boxShadow: 'none', '&:hover': { backgroundColor: '#235558', boxShadow: 'none' } }}
              >
                Add Event
              </Button>
            )}
          </Box>
        </Box>

        {/* Main Content - Split Layout */}
        <Grid container spacing={3}>
          {/* Left Sidebar - Mini Calendar */}
          <Grid item xs={12} md={4} lg={3}>
            <Paper 
              sx={{ 
                p: 3, 
                borderRadius: 3,
                boxShadow: 2,
                position: 'sticky',
                top: 16,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              }}
            >
              {/* Month Navigation */}
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  mb: 2,
                }}
              >
                <IconButton 
                  size="small"
                  onClick={handlePreviousMonth}
                  sx={{
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    },
                  }}
                >
                  <ChevronLeft fontSize="small" />
                </IconButton>
                
                <Box sx={{ textAlign: 'center' }}>
                  {calendarType === 'ad' ? (
                    <>
                      <Typography variant="subtitle1" fontWeight="bold" color="primary">
                        {format(currentMonth, 'MMM yyyy')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        {formatBSDate(currentMonth, 'medium')}
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography variant="subtitle1" fontWeight="bold" color="primary">
                        {formatBSDate(currentMonth, 'medium')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        {format(currentMonth, 'MMM yyyy')}
                      </Typography>
                    </>
                  )}
                </Box>
                
                <IconButton 
                  size="small"
                  onClick={handleNextMonth}
                  sx={{
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    },
                  }}
                >
                  <ChevronRight fontSize="small" />
                </IconButton>
              </Box>

              {/* Mini Calendar */}
              {renderMiniCalendar()}

              {/* Today Button */}
              <Box sx={{ mt: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<TodayIcon />}
                  onClick={handleToday}
                  sx={{
                    borderRadius: 2,
                    py: 1,
                    textTransform: 'none',
                    fontWeight: 'bold',
                  }}
                >
                  Today
                </Button>
              </Box>

              {/* Legend */}
              <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  EVENT TYPES
                </Typography>
                {eventTypeOptions.map(option => (
                  <Box 
                    key={option.value} 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1, 
                      mb: 0.5 
                    }}
                  >
                    <Box sx={{ 
                      width: 12, 
                      height: 12, 
                      backgroundColor: option.color, 
                      borderRadius: 1 
                    }} />
                    <Typography variant="caption" color="text.secondary">
                      {option.icon} {option.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Right Content - Event Lists */}
          <Grid item xs={12} md={8} lg={9}>
            {/* Selected Date Events */}
            {selectedDate && (
              <Paper 
                sx={{ 
                  p: 3, 
                  mb: 3,
                  borderRadius: 3,
                  boxShadow: 2,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    {calendarType === 'ad' ? (
                      <>
                        <Typography variant="h6" fontWeight="bold">
                          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatBSDate(selectedDate, 'long')}
                        </Typography>
                      </>
                    ) : (
                      <>
                        <Typography variant="h6" fontWeight="bold">
                          {formatBSDate(selectedDate, 'long')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                        </Typography>
                      </>
                    )}
                  </Box>
                  {canEdit && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setIsMultiDay(false)
                        setIsSelectingEndDate(false)
                        setFormData({ ...formData, start_date: selectedDate, end_date: selectedDate })
                        setEditingEvent(null)
                        setOpenDialog(true)
                      }}
                      sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                      Add Event
                    </Button>
                  )}
                </Box>
                
                {getSelectedDateEvents().length > 0 ? (
                  getSelectedDateEvents().map(event => renderEventCard(event))
                ) : (
                  <Box 
                    sx={{ 
                      py: 4, 
                      textAlign: 'center',
                      backgroundColor: alpha(theme.palette.primary.main, 0.02),
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="body1" color="text.secondary">
                      No events scheduled for this date
                    </Typography>
                    {canEdit && (
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => {
                          setIsMultiDay(false)
                          setIsSelectingEndDate(false)
                          setFormData({ ...formData, start_date: selectedDate, end_date: selectedDate })
                          setEditingEvent(null)
                          setOpenDialog(true)
                        }}
                        sx={{ mt: 2, borderRadius: 2, textTransform: 'none' }}
                      >
                        Create Event
                      </Button>
                    )}
                  </Box>
                )}
              </Paper>
            )}

            {/* Upcoming Events */}
            <Paper 
              sx={{ 
                p: 3, 
                borderRadius: 3,
                boxShadow: 2,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              }}
            >
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Upcoming Events
              </Typography>
              
              {getUpcomingEvents().length > 0 ? (
                getUpcomingEvents().map(event => renderEventCard(event))
              ) : (
                <Box 
                  sx={{ 
                    py: 4, 
                    textAlign: 'center',
                    backgroundColor: alpha(theme.palette.primary.main, 0.02),
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body1" color="text.secondary">
                    No upcoming events
                  </Typography>
                  {canEdit && (
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        resetForm()
                        setOpenDialog(true)
                      }}
                      sx={{ mt: 2, borderRadius: 2, textTransform: 'none' }}
                    >
                      Create Event
                    </Button>
                  )}
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Event Dialog */}
        <Dialog 
          open={openDialog} 
          onClose={() => setOpenDialog(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3 }
          }}
        >
          <DialogTitle 
            sx={{ 
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
              borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            }}
          >
            <Typography variant="h6" fontWeight="bold">
              {editingEvent ? 'Edit Event' : 'Add New Event'}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            {calendarType === 'bs' && (
              <Alert severity="info" sx={{ mb: 2 }}>
                💡 {isMultiDay
                  ? isSelectingEndDate
                    ? 'Now click an end date on the mini calendar'
                    : 'Click a start date on the mini calendar, then click "Set End Date"'
                  : 'Click a date in the mini calendar on the left to select the event date'}
              </Alert>
            )}
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Event Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                sx={{ mb: 3 }}
                required
                variant="outlined"
                size="small"
              />
              
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
                sx={{ mb: 3 }}
                variant="outlined"
                size="small"
              />

              {/* Multi-day toggle */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isMultiDay}
                    onChange={(e) => {
                      setIsMultiDay(e.target.checked)
                      if (!e.target.checked) {
                        setFormData({ ...formData, end_date: formData.start_date })
                        setIsSelectingEndDate(false)
                      }
                    }}
                    color="primary"
                  />
                }
                label="Multi-day event"
                sx={{ mb: 3 }}
              />

              {calendarType === 'bs' ? (
                // Nepali mode: read-only fields driven by mini-calendar clicks
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={isMultiDay ? 6 : 12}>
                    <TextField
                      fullWidth
                      label="Start Date (BS)"
                      value={formData.start_date ? formatBSDate(formData.start_date, 'medium') : ''}
                      InputProps={{ readOnly: true }}
                      helperText={formData.start_date ? `AD: ${format(formData.start_date, 'MMM d, yyyy')}` : 'Click calendar to select'}
                      variant="outlined"
                      size="small"
                      onClick={() => isMultiDay && setIsSelectingEndDate(false)}
                      sx={{ cursor: isMultiDay ? 'pointer' : 'default',
                        '& .MuiOutlinedInput-root': isMultiDay && !isSelectingEndDate ? { borderColor: 'primary.main', '& fieldset': { borderColor: 'primary.main', borderWidth: 2 } } : {} }}
                    />
                  </Grid>
                  {isMultiDay && (
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="End Date (BS)"
                        value={formData.end_date ? formatBSDate(formData.end_date, 'medium') : ''}
                        InputProps={{ readOnly: true }}
                        helperText={formData.end_date ? `AD: ${format(formData.end_date, 'MMM d, yyyy')}` : 'Click calendar to select'}
                        variant="outlined"
                        size="small"
                        onClick={() => setIsSelectingEndDate(true)}
                        sx={{ cursor: 'pointer',
                          '& .MuiOutlinedInput-root': isSelectingEndDate ? { '& fieldset': { borderColor: 'secondary.main', borderWidth: 2 } } : {} }}
                      />
                    </Grid>
                  )}
                </Grid>
              ) : (
                // AD mode: date pickers
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={isMultiDay ? 6 : 12}>
                    <DatePicker
                      label={isMultiDay ? 'Start Date' : 'Event Date'}
                      value={formData.start_date}
                      onChange={(date) => setFormData({ ...formData, start_date: date, ...(!isMultiDay && { end_date: date }) })}
                      slotProps={{ 
                        textField: { 
                          fullWidth: true,
                          variant: 'outlined',
                          size: 'small',
                          helperText: formData.start_date ? `BS: ${formatBSDate(formData.start_date, 'medium')}` : ''
                        } 
                      }}
                    />
                  </Grid>
                  {isMultiDay && (
                    <Grid item xs={6}>
                      <DatePicker
                        label="End Date"
                        value={formData.end_date}
                        minDate={formData.start_date}
                        onChange={(date) => setFormData({ ...formData, end_date: date })}
                        slotProps={{ 
                          textField: { 
                            fullWidth: true,
                            variant: 'outlined',
                            size: 'small',
                            helperText: formData.end_date ? `BS: ${formatBSDate(formData.end_date, 'medium')}` : ''
                          } 
                        }}
                      />
                    </Grid>
                  )}
                </Grid>
              )}
              {/* Duration badge for multi-day */}
              {isMultiDay && formData.start_date && formData.end_date && formData.end_date >= formData.start_date && (
                <Alert severity="info" icon={false} sx={{ mb: 3, py: 0.5 }}>
                  📅 Duration: <strong>{differenceInDays(formData.end_date, formData.start_date) + 1} day{differenceInDays(formData.end_date, formData.start_date) > 0 ? 's' : ''}</strong>
                </Alert>
              )}
              
              <TextField
                fullWidth
                select
                label="Event Type"
                value={formData.event_type}
                onChange={(e) => {
                  const selectedType = eventTypeOptions.find(opt => opt.value === e.target.value)
                  setFormData({
                    ...formData,
                    event_type: e.target.value,
                    color: selectedType?.color || '#1976d2'
                  })
                }}
                sx={{ mb: 3 }}
                variant="outlined"
                size="small"
              >
                {eventTypeOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ 
                        width: 20, 
                        height: 20, 
                        backgroundColor: option.color, 
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px'
                      }}>
                        {option.icon}
                      </Box>
                      <Typography>{option.label}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.is_all_day}
                    onChange={(e) => setFormData({ ...formData, is_all_day: e.target.checked })}
                    color="primary"
                  />
                }
                label="All Day Event"
                sx={{ mb: 3 }}
              />
              
              {!formData.is_all_day && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <TimePicker
                      label="Start Time"
                      value={formData.start_time}
                      onChange={(time) => setFormData({ ...formData, start_time: time })}
                      slotProps={{ 
                        textField: { 
                          fullWidth: true,
                          variant: "outlined",
                          size: "small"
                        } 
                      }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TimePicker
                      label="End Time"
                      value={formData.end_time}
                      onChange={(time) => setFormData({ ...formData, end_time: time })}
                      slotProps={{ 
                        textField: { 
                          fullWidth: true,
                          variant: "outlined",
                          size: "small"
                        } 
                      }}
                    />
                  </Grid>
                </Grid>
              )}
              
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                variant="outlined"
                size="small"
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, gap: 1 }}>
            {editingEvent && (
              <Button
                color="error"
                onClick={() => handleDeleteEvent(editingEvent.id)}
                startIcon={<DeleteIcon />}
                sx={{ mr: 'auto' }}
              >
                Delete
              </Button>
            )}
            <Button 
              onClick={() => setOpenDialog(false)}
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEvent} 
              variant="contained"
              sx={{ borderRadius: 2, px: 3 }}
            >
              {editingEvent ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert 
            severity={snackbar.severity} 
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            variant="filled"
            sx={{ borderRadius: 2 }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  )
}
