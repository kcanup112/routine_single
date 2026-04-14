import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Typography, Grid, Card, CardContent, Box, Skeleton, IconButton, Chip, Tooltip, Avatar } from '@mui/material'
import {
  Business as DepartmentIcon,
  Person as TeacherIcon,
  MenuBook as SubjectIcon,
  Class as ClassIcon,
  ChevronLeft,
  ChevronRight,
  Schedule as ScheduleIcon,
  EventNote as EventNoteIcon,
  TableChart as RoutineIcon,
  CalendarMonth as CalendarIcon,
  AccountTree as ProgrammeIcon,
  Layers as SemesterIcon,
} from '@mui/icons-material'
import { departmentService, teacherService, subjectService, classService, calendarService } from '../services'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { adToBS, formatBSDate, englishToNepaliNumber } from '../utils/nepaliCalendar'
import { useAuth } from '../contexts/AuthContext'

const eventTypeOptions = [
  { value: 'holiday', label: 'Holiday', color: '#e53935' },
  { value: 'exam', label: 'Exam', color: '#f59e0b' },
  { value: 'event', label: 'Event', color: '#1976d2' },
  { value: 'deadline', label: 'Deadline', color: '#9333ea' },
  { value: 'meeting', label: 'Meeting', color: '#10b981' },
  { value: 'welcome_farewell', label: 'Welcome & Farewell', color: '#ec4899' },
  { value: 'orientation', label: 'Orientation', color: '#06b6d4' },
  { value: 'sports', label: 'Sports Week', color: '#84cc16' },
  { value: 'tour', label: 'Educational Tour', color: '#8b5cf6' },
  { value: 'class_test', label: 'Class Test', color: '#f97316' },
  { value: 'conference', label: 'Conference', color: '#0891b2' },
  { value: 'exhibition', label: 'Exhibition', color: '#a855f7' },
]

const StatCard = ({ title, value, icon, color, trend, loading, onClick }) => (
  <Card
    elevation={0}
    onClick={onClick}
    sx={{
      background: '#ffffff',
      border: '1px solid #e8edf2',
      borderRadius: '16px',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.25s ease',
      '&:hover': onClick ? {
        transform: 'translateY(-3px)',
        boxShadow: `0 12px 28px -8px ${color}30`,
        borderColor: `${color}60`,
      } : {},
    }}
  >
    <CardContent sx={{ p: '20px !important' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="caption" sx={{ color: '#8896a4', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', fontSize: '0.7rem' }}>
          {title}
        </Typography>
        <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </Box>
      </Box>
      {loading ? (
        <Skeleton variant="text" width={50} height={42} />
      ) : (
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a2332', fontSize: '2rem', lineHeight: 1 }}>
          {value}
        </Typography>
      )}
      {trend && (
        <Typography variant="caption" sx={{ color: '#52c41a', fontWeight: 600, fontSize: '0.7rem', mt: 0.5, display: 'block' }}>
          {trend}
        </Typography>
      )}
    </CardContent>
  </Card>
)

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stats, setStats] = useState({ departments: 0, teachers: 0, subjects: 0, classes: 0 })
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [events, setEvents] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date())

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    fetchCalendarEvents()
  }, [currentMonth])

  const loadStats = async () => {
    setLoading(true)
    try {
      const [deptRes, teacherRes, subjectRes, classRes] = await Promise.all([
        departmentService.getAll(),
        teacherService.getAll(),
        subjectService.getAll(),
        classService.getAll(),
      ])
      setStats({
        departments: Array.isArray(deptRes.data) ? deptRes.data.length : 0,
        teachers: Array.isArray(teacherRes.data) ? teacherRes.data.length : 0,
        subjects: Array.isArray(subjectRes.data) ? subjectRes.data.length : 0,
        classes: Array.isArray(classRes.data) ? classRes.data.length : 0,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const parseLocalDate = (dateStr) => {
    if (!dateStr) return null
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d)
  }

  const fetchCalendarEvents = async () => {
    try {
      const start = startOfWeek(startOfMonth(currentMonth))
      const end = endOfWeek(endOfMonth(currentMonth))
      const response = await calendarService.getEvents({
        start_date: format(start, 'yyyy-MM-dd'),
        end_date: format(end, 'yyyy-MM-dd'),
      })
      setEvents(response.data || [])
    } catch (err) {
      console.error('Failed to load events', err)
      setEvents([])
    }
  }

  const getEventsForDate = (date) => {
    const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    return events.filter(ev => {
      const s = parseLocalDate(ev.start_date)
      const e = parseLocalDate(ev.end_date)
      return s && e && normalized >= s && normalized <= e
    })
  }

  const getUpcomingEvents = () => {
    const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
    return events
      .filter(ev => {
        const e = parseLocalDate(ev.end_date)
        return e && e >= today
      })
      .sort((a, b) => parseLocalDate(a.start_date) - parseLocalDate(b.start_date))
      .slice(0, 8)
  }

  const getSelectedDateEvents = () => {
    if (!selectedDate) return []
    return getEventsForDate(selectedDate)
  }

  const renderCalendarGrid = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)
    const days = eachDayOfInterval({ start: startDate, end: endDate })

    return (
      <Box>
        {/* Day Headers */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 0.5 }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
            <Box key={i} sx={{ textAlign: 'center', py: 0.75 }}>
              <Typography variant="caption" sx={{ color: '#8896a4', fontWeight: 700, fontSize: '0.68rem' }}>
                {d}
              </Typography>
            </Box>
          ))}
        </Box>
        {/* Day Cells */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
          {days.map((day, idx) => {
            const dayEvents = getEventsForDate(day)
            const isCurrentMonth = isSameMonth(day, currentMonth)
            const isToday = isSameDay(day, new Date())
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            const dayBS = adToBS(day)
            const dow = day.getDay()
            const isSat = dow === 6
            const isFri = dow === 5

            const cellContent = (
              <Box
                key={idx}
                onClick={() => setSelectedDate(day)}
                sx={{
                  aspectRatio: '1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  position: 'relative',
                  backgroundColor: isToday
                    ? '#2d6a6f'
                    : isSelected
                    ? '#e8f5f6'
                    : isSat
                    ? '#fef2f2'
                    : isFri
                    ? '#fff8f0'
                    : 'transparent',
                  border: isSelected && !isToday ? '2px solid #2d6a6f' : '2px solid transparent',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    backgroundColor: isToday ? '#235558' : '#f0fafa',
                  },
                  opacity: isCurrentMonth ? 1 : 0.35,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: isToday || isSelected ? 700 : 500,
                    fontSize: '0.8rem',
                    color: isToday ? '#ffffff' : isSat ? '#e53935' : isFri ? '#f59e0b' : '#1a2332',
                    lineHeight: 1.2,
                  }}
                >
                  {format(day, 'd')}
                </Typography>
                {dayBS && (
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.55rem',
                      color: isToday ? 'rgba(255,255,255,0.75)' : '#a0aec0',
                      lineHeight: 1,
                    }}
                  >
                    {englishToNepaliNumber(dayBS.date)}
                  </Typography>
                )}
                {dayEvents.length > 0 && (
                  <Box sx={{ display: 'flex', gap: '2px', mt: '2px' }}>
                    {dayEvents.slice(0, 3).map((ev, i) => (
                      <Box key={i} sx={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: isToday ? 'rgba(255,255,255,0.9)' : (eventTypeOptions.find(o => o.value === ev.event_type)?.color || '#2d6a6f') }} />
                    ))}
                  </Box>
                )}
              </Box>
            )

            if (dayEvents.length > 0) {
              return (
                <Tooltip
                  key={idx}
                  title={
                    <Box sx={{ p: 0.5 }}>
                      {dayEvents.slice(0, 4).map((ev, i) => (
                        <Typography key={i} variant="caption" sx={{ display: 'block', fontWeight: 600 }}>
                          {ev.title}
                        </Typography>
                      ))}
                      {dayEvents.length > 4 && <Typography variant="caption">+{dayEvents.length - 4} more</Typography>}
                    </Box>
                  }
                  placement="top"
                  arrow
                >
                  {cellContent}
                </Tooltip>
              )
            }
            return cellContent
          })}
        </Box>
      </Box>
    )
  }

  const todayBS = adToBS(new Date())
  const todayLabel = format(new Date(), 'EEEE')
  const todayMonthYear = format(new Date(), 'MMM, dd')
  const selectedEvents = getSelectedDateEvents()
  const upcomingEvents = getUpcomingEvents()

  // ─── Quick-action cards ───────────────────────────────────────────────────
  const quickLinks = [
    { label: 'Class Routine', icon: <RoutineIcon sx={{ fontSize: 22, color: '#6366f1' }} />, color: '#6366f1', path: '/dashboard/class-routine' },
    { label: 'Teacher Routine', icon: <TeacherIcon sx={{ fontSize: 22, color: '#ec4899' }} />, color: '#ec4899', path: '/dashboard/teacher-routine' },
    { label: 'Schedules', icon: <ScheduleIcon sx={{ fontSize: 22, color: '#f59e0b' }} />, color: '#f59e0b', path: '/dashboard/schedules' },
    { label: 'Academic Calendar', icon: <CalendarIcon sx={{ fontSize: 22, color: '#10b981' }} />, color: '#10b981', path: '/dashboard/calendar' },
    { label: 'Programmes', icon: <ProgrammeIcon sx={{ fontSize: 22, color: '#06b6d4' }} />, color: '#06b6d4', path: '/dashboard/programmes' },
    { label: 'Semesters', icon: <SemesterIcon sx={{ fontSize: 22, color: '#8b5cf6' }} />, color: '#8b5cf6', path: '/dashboard/semesters' },
  ]

  return (
    <Box sx={{ display: 'flex', gap: 0, minHeight: 'calc(100vh - 64px)', backgroundColor: '#f4f7fb', m: -3 }}>

      {/* ════════════════ LEFT PANEL ════════════════ */}
      <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, overflowY: 'auto' }}>

        {/* ── Top header ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              component="img"
              src="/logo.png"
              alt="KEC"
              sx={{ width: 44, height: 44, objectFit: 'contain', borderRadius: '50%', border: '2px solid #e8edf2' }}
              onError={(e) => { e.target.style.display = 'none' }}
            />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a2332', lineHeight: 1.2, fontSize: '1.05rem' }}>
                KEC Routine
              </Typography>
              <Typography variant="caption" sx={{ color: '#8896a4', fontSize: '0.7rem' }}>
                Kantipur Engineering College
              </Typography>
            </Box>
          </Box>
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                {user.full_name || user.username}
              </Typography>
              <Avatar sx={{ width: 34, height: 34, bgcolor: '#2d6a6f', fontSize: '0.85rem' }}>
                {(user.full_name || user.username || 'U')[0].toUpperCase()}
              </Avatar>
            </Box>
          )}
        </Box>

        {/* ── Main title ── */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a2332', mb: 0.5 }}>
            Main Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: '#8896a4' }}>
            Class Schedule &amp; Academic Management
          </Typography>
        </Box>

        {/* ── Stats row ── */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <StatCard title="Departments" value={stats.departments} icon={<DepartmentIcon sx={{ fontSize: 18, color: '#6366f1' }} />} color="#6366f1" loading={loading} onClick={() => navigate('/dashboard/departments')} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard title="Teachers" value={stats.teachers} icon={<TeacherIcon sx={{ fontSize: 18, color: '#ec4899' }} />} color="#ec4899" loading={loading} onClick={() => navigate('/dashboard/teachers')} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard title="Subjects" value={stats.subjects} icon={<SubjectIcon sx={{ fontSize: 18, color: '#06b6d4' }} />} color="#06b6d4" loading={loading} onClick={() => navigate('/dashboard/subjects')} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard title="Classes" value={stats.classes} icon={<ClassIcon sx={{ fontSize: 18, color: '#10b981' }} />} color="#10b981" loading={loading} onClick={() => navigate('/dashboard/classes')} />
          </Grid>
        </Grid>

        {/* ── KEC Banner ── */}
        <Box
          sx={{
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #1a3a4a 0%, #2d6a6f 60%, #3a8a7a 100%)',
            p: { xs: 2.5, md: 3 },
            mb: 3,
            position: 'relative',
            overflow: 'hidden',
            minHeight: 120,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Box sx={{ position: 'absolute', right: -20, top: -20, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          <Box sx={{ position: 'absolute', right: 60, bottom: -40, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <Box sx={{ zIndex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#ffffff', mb: 0.5 }}>
              Kantipur Engineering College 🎓
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', fontWeight: 400 }}>
              Building Future Engineers Since 1998 · Lalitpur, Nepal
            </Typography>
            {todayBS && (
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', mt: 0.5, display: 'block' }}>
                आज: {formatBSDate(new Date(), 'long')}
              </Typography>
            )}
          </Box>
        </Box>

        {/* ── Quick Links ── */}
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1a2332' }}>
              Quick Navigation
            </Typography>
          </Box>
          <Grid container spacing={2}>
            {quickLinks.map((link, i) => (
              <Grid item xs={6} sm={4} key={i}>
                <Box
                  onClick={() => navigate(link.path)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 2,
                    borderRadius: '12px',
                    background: '#ffffff',
                    border: '1px solid #e8edf2',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': { borderColor: `${link.color}60`, boxShadow: `0 4px 16px -4px ${link.color}25`, transform: 'translateY(-2px)' },
                  }}
                >
                  <Box sx={{ width: 38, height: 38, borderRadius: '10px', background: `${link.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {link.icon}
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151', fontSize: '0.8rem', lineHeight: 1.3 }}>
                    {link.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>

      {/* ════════════════ RIGHT PANEL – Calendar ════════════════ */}
      <Box
        sx={{
          width: { xs: '100%', md: 340, lg: 380 },
          flexShrink: 0,
          borderLeft: '1px solid #e8edf2',
          backgroundColor: '#ffffff',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          overflowY: 'auto',
          position: 'sticky',
          top: 0,
          maxHeight: 'calc(100vh - 64px)',
        }}
      >
        {/* ── Date header ── */}
        <Box sx={{ px: 3, pt: 3, pb: 2, borderBottom: '1px solid #f0f4f8' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a2332' }}>
              {format(new Date(), 'MMM, dd')}
              <Typography component="span" variant="body2" sx={{ color: '#8896a4', fontWeight: 500, ml: 1 }}>
                {todayLabel}
              </Typography>
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <IconButton size="small" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} sx={{ width: 30, height: 30, color: '#64748b', '&:hover': { backgroundColor: '#f0f4f8' } }}>
                <ChevronLeft fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} sx={{ width: 30, height: 30, color: '#64748b', '&:hover': { backgroundColor: '#f0f4f8' } }}>
                <ChevronRight fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          {todayBS && (
            <Typography variant="caption" sx={{ color: '#a0aec0', fontSize: '0.7rem' }}>
              {formatBSDate(new Date(), 'long')}
            </Typography>
          )}
        </Box>

        {/* ── Month navigation label ── */}
        <Box sx={{ px: 3, pt: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2d6a6f', letterSpacing: '0.3px' }}>
              {format(currentMonth, 'MMMM yyyy')}
            </Typography>
            <Typography variant="caption" sx={{ color: '#a0aec0', fontSize: '0.68rem' }}>
              {formatBSDate(currentMonth, 'medium')}
            </Typography>
          </Box>

          {/* ── Calendar grid ── */}
          {renderCalendarGrid()}
        </Box>

        {/* ── Selected/Upcoming Events ── */}
        <Box sx={{ flex: 1, px: 3, pb: 3, pt: 1 }}>
          <Box sx={{ borderTop: '1px solid #f0f4f8', pt: 2, mt: 1 }}>
            {/* selected-date events */}
            {selectedDate && (
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#8896a4', textTransform: 'uppercase', letterSpacing: '0.6px', fontSize: '0.68rem', display: 'block', mb: 1.5 }}>
                {isSameDay(selectedDate, new Date())
                  ? 'Today\'s Events'
                  : format(selectedDate, 'MMM d') + ' Events'}
              </Typography>
            )}
            {selectedEvents.length > 0 ? (
              selectedEvents.map((ev, i) => {
                const evColor = eventTypeOptions.find(o => o.value === ev.event_type)?.color || '#2d6a6f'
                const evStartD = parseLocalDate(ev.start_date)
                const evEndD = parseLocalDate(ev.end_date)
                const evIsMultiDay = evStartD && evEndD && evEndD > evStartD
                return (
                  <Box
                    key={ev.id || i}
                    sx={{
                      mb: 1.5,
                      p: 1.5,
                      borderRadius: '12px',
                      background: `${evColor}0d`,
                      borderLeft: `4px solid ${evColor}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      '&:hover': { background: `${evColor}18` },
                    }}
                    onClick={() => navigate('/dashboard/calendar')}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a2332', fontSize: '0.82rem', mb: 0.25 }}>
                      {ev.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={eventTypeOptions.find(o => o.value === ev.event_type)?.label || ev.event_type}
                        size="small"
                        sx={{ height: 18, fontSize: '0.62rem', backgroundColor: `${evColor}20`, color: evColor, fontWeight: 700, '& .MuiChip-label': { px: 1 } }}
                      />
                      {evIsMultiDay ? (
                        <Typography variant="caption" sx={{ color: '#8896a4', fontSize: '0.68rem' }}>
                          {format(evStartD, 'MMM d')} → {format(evEndD, 'MMM d')}
                        </Typography>
                      ) : !ev.is_all_day && ev.start_time ? (
                        <Typography variant="caption" sx={{ color: '#8896a4', fontSize: '0.68rem' }}>
                          {ev.start_time.substring(0, 5)}{ev.end_time && ` — ${ev.end_time.substring(0, 5)}`}
                        </Typography>
                      ) : null}
                    </Box>
                  </Box>
                )
              })
            ) : (
              selectedDate && (
                <Box sx={{ py: 2, textAlign: 'center' }}>
                  <EventNoteIcon sx={{ fontSize: 28, color: '#d1d9e0', mb: 0.5 }} />
                  <Typography variant="caption" sx={{ color: '#b0bec5', display: 'block' }}>
                    No events on {format(selectedDate, 'MMM d')}
                  </Typography>
                </Box>
              )
            )}

            {/* Upcoming section */}
            {upcomingEvents.length > 0 && (
              <>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#8896a4', textTransform: 'uppercase', letterSpacing: '0.6px', fontSize: '0.68rem', display: 'block', mt: 2, mb: 1.5 }}>
                  Upcoming Events
                </Typography>
                {upcomingEvents.filter(ev => !selectedEvents.find(se => se.id === ev.id)).slice(0, 5).map((ev, i) => {
                  const upColor = eventTypeOptions.find(o => o.value === ev.event_type)?.color || '#2d6a6f'
                  const upStartD = parseLocalDate(ev.start_date)
                  const upEndD = parseLocalDate(ev.end_date)
                  const upIsMultiDay = upStartD && upEndD && upEndD > upStartD
                  return (
                    <Box
                      key={ev.id || i}
                      sx={{
                        mb: 1.5,
                        p: 1.5,
                        borderRadius: '12px',
                        background: '#f8fafc',
                        borderLeft: `4px solid ${upColor}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        '&:hover': { background: '#f0f4f8' },
                      }}
                      onClick={() => navigate('/dashboard/calendar')}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#1a2332', fontSize: '0.82rem', mb: 0.25 }}>
                        {ev.title}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="caption" sx={{ color: '#8896a4', fontSize: '0.68rem' }}>
                          {upStartD && format(upStartD, 'MMM d, yyyy')}{upIsMultiDay && upEndD ? ` → ${format(upEndD, 'MMM d')}` : ''}
                        </Typography>
                        <Chip
                          label={eventTypeOptions.find(o => o.value === ev.event_type)?.label || ev.event_type}
                          size="small"
                          sx={{ height: 16, fontSize: '0.6rem', backgroundColor: `${upColor}18`, color: upColor, fontWeight: 700, '& .MuiChip-label': { px: 0.75 } }}
                        />
                      </Box>
                    </Box>
                  )
                })}
              </>
            )}

            {upcomingEvents.length === 0 && !selectedEvents.length && (
              <Box sx={{ py: 3, textAlign: 'center' }}>
                <CalendarIcon sx={{ fontSize: 32, color: '#d1d9e0', mb: 1 }} />
                <Typography variant="caption" sx={{ color: '#b0bec5', display: 'block' }}>
                  No upcoming events this month
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
