import { useState, useEffect } from 'react'
import { Typography, Paper, Grid, Card, CardContent, Box, Container, Skeleton } from '@mui/material'
import {
  Business as DepartmentIcon,
  Person as TeacherIcon,
  MenuBook as SubjectIcon,
  Schedule as ScheduleIcon,
  Class as ClassIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material'
import { departmentService, teacherService, subjectService, classService } from '../services'

const StatCard = ({ title, value, icon, color, loading }) => (
  <Card 
    elevation={0}
    sx={{ 
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: 3,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'visible',
      '&:hover': {
        transform: 'translateY(-6px)',
        boxShadow: '0 20px 40px -12px rgba(99, 102, 241, 0.15)',
        borderColor: color,
      },
    }}
  >
    <CardContent sx={{ p: 3.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#64748b',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontSize: '0.75rem',
              mb: 1,
            }}
          >
            {title}
          </Typography>
          {loading ? (
            <Skeleton variant="text" width={60} height={48} />
          ) : (
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700,
                color: '#1e293b',
                fontSize: '2.5rem',
                lineHeight: 1,
              }}
            >
              {value}
            </Typography>
          )}
        </Box>
        <Box sx={{ 
          background: `linear-gradient(135deg, ${color}15 0%, ${color}25 100%)`,
          borderRadius: 2.5,
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
)

export default function Dashboard() {
  const [stats, setStats] = useState({
    departments: 0,
    teachers: 0,
    subjects: 0,
    classes: 0,
    schedules: 0,
    days: 5,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

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
        schedules: 0, // This would need a schedules endpoint
        days: 5,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Header Section */}
        <Box 
          sx={{ 
            mb: 5, 
            textAlign: 'center',
            position: 'relative',
            minHeight: '180px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Background Logo */}
          <Box
            component="img"
            src="/kec logo.png"
            alt="KEC Logo Background"
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '280px',
              height: '280px',
              opacity: 0.04,
              zIndex: 0,
              objectFit: 'contain',
              filter: 'grayscale(100%)',
            }}
          />
          
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 800,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
              backgroundClip: 'text',
              textFillColor: 'transparent',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1.5,
              position: 'relative',
              zIndex: 1,
              letterSpacing: '-0.02em',
            }}
          >
            Routine Scheduler
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#64748b',
              position: 'relative', 
              zIndex: 1,
              fontWeight: 500,
              letterSpacing: '0.5px',
            }}
          >
            Class Schedule Management System
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Departments"
              value={stats.departments}
              icon={<DepartmentIcon sx={{ fontSize: 32, color: '#6366f1' }} />}
              color="#6366f1"
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Teachers"
              value={stats.teachers}
              icon={<TeacherIcon sx={{ fontSize: 32, color: '#ec4899' }} />}
              color="#ec4899"
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Subjects"
              value={stats.subjects}
              icon={<SubjectIcon sx={{ fontSize: 32, color: '#06b6d4' }} />}
              color="#06b6d4"
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Classes"
              value={stats.classes}
              icon={<ClassIcon sx={{ fontSize: 32, color: '#10b981' }} />}
              color="#10b981"
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Schedules"
              value={stats.schedules}
              icon={<ScheduleIcon sx={{ fontSize: 32, color: '#f59e0b' }} />}
              color="#f59e0b"
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Active Days"
              value={stats.days}
              icon={<CalendarIcon sx={{ fontSize: 32, color: '#8b5cf6' }} />}
              color="#8b5cf6"
              loading={loading}
            />
          </Grid>
        </Grid>

        {/* Welcome Section */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 4, 
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: 'white',
            borderRadius: 4,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              right: 0,
              width: '40%',
              height: '100%',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%)',
              borderRadius: '50% 0 0 50%',
            }
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1.5, position: 'relative', zIndex: 1 }}>
            Kantipur Engineering College 🎓
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              fontSize: '1.1rem', 
              opacity: 0.9, 
              lineHeight: 1.8,
              position: 'relative',
              zIndex: 1,
              fontWeight: 400,
            }}
          >
            Building Future Since 1998
          </Typography>
        </Paper>

        {/* Quick Actions */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3.5, 
                borderRadius: 3,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 24px -6px rgba(99, 102, 241, 0.1)',
                  borderColor: '#6366f1',
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box sx={{ 
                  background: 'linear-gradient(135deg, #6366f115 0%, #6366f125 100%)',
                  borderRadius: 2,
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <ScheduleIcon sx={{ fontSize: 28, color: '#6366f1' }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                    Getting Started
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.7 }}>
                    Set up your departments, add teachers and subjects, then create class routines with our intuitive interface.
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3.5, 
                borderRadius: 3,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100%',
              }}
            >
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                © {new Date().getFullYear()} Routine Scheduler. All rights reserved.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  )
}
