import { useState, useMemo } from 'react'
import { useNavigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Collapse,
  Divider,
  Menu,
  MenuItem,
  Avatar,
  Chip,
  Button,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Business as DepartmentIcon,
  School as ProgrammeIcon,
  CalendarMonth as SemesterIcon,
  Person as TeacherIcon,
  MenuBook as SubjectIcon,
  Class as ClassIcon,
  Today as DayIcon,
  AccessTime as PeriodIcon,
  WorkHistory as ShiftIcon,
  Schedule as ScheduleIcon,
  ExpandLess,
  ExpandMore,
  Settings as SettingsIcon,
  GroupWork as AcademicIcon,
  ViewList as RoutineIcon,
  TableChart as ClassRoutineIcon,
  PersonOutline as TeacherRoutineIcon,
  VisibilityOff as HideIcon,
  Visibility as ShowIcon,
  AttachMoney as FinanceIcon,
  AccountCircle,
  Logout,
  Lock as LockIcon,
  ManageAccounts,
  Login as LoginIcon,
  Event as CalendarIcon,
  AdminPanelSettings as AdminIcon,
  Business,
  MeetingRoom as RoomIcon,
  AccountTree as HierarchyIcon,
} from '@mui/icons-material'

const drawerWidth = 240

function buildMenuSections(school) {
  return [
    {
      title: 'Academic Setup',
      icon: <AcademicIcon />,
      items: [
        { text: 'Departments', icon: <DepartmentIcon />, path: '/dashboard/departments' },
        // Programmes only visible in engineering mode
        ...(!school ? [{ text: 'Programmes', icon: <ProgrammeIcon />, path: '/dashboard/programmes' }] : []),
        { text: school ? 'Classes' : 'Semesters', icon: <SemesterIcon />, path: '/dashboard/semesters' },
        { text: school ? 'Sections' : 'Classes', icon: <ClassIcon />, path: '/dashboard/classes' },
      ]
    },
    {
      title: 'Resources',
      icon: <SettingsIcon />,
      items: [
        { text: 'Teachers', icon: <TeacherIcon />, path: '/dashboard/teachers' },
        { text: 'Subjects', icon: <SubjectIcon />, path: '/dashboard/subjects' },
        { text: 'Days', icon: <DayIcon />, path: '/dashboard/days' },
        { text: 'Shifts', icon: <ShiftIcon />, path: '/dashboard/shifts' },
        { text: 'Rooms', icon: <RoomIcon />, path: '/dashboard/rooms' },
        { text: 'Periods', icon: <PeriodIcon />, path: '/dashboard/periods' },
      ]
    },
    {
      title: 'Routine',
      icon: <RoutineIcon />,
      items: [
        { text: 'Class Routine', icon: <ClassRoutineIcon />, path: '/dashboard/class-routine' },
        { text: 'Teacher Routine', icon: <TeacherRoutineIcon />, path: '/dashboard/teacher-routine' },
        { text: 'Academic Hierarchy', icon: <HierarchyIcon />, path: '/dashboard/academic-hierarchy' },
      ]
    },
  ]
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openSections, setOpenSections] = useState({
    'Academic Setup': true,
    'Resources': true,
    'Routine': true,
  })
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [anchorEl, setAnchorEl] = useState(null)
  const navigate = useNavigate()
  const { user, logout, isAdmin, isAuthenticated, isSchool, isViewer } = useAuth()
  const menuSections = useMemo(() => buildMenuSections(isSchool()), [user])

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
    handleClose()
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleNavigation = (path) => {
    navigate(path)
    setMobileOpen(false)
  }

  const handleSectionToggle = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleToggleSidebar = () => {
    setSidebarVisible(!sidebarVisible)
  }

  const drawer = (
    <Box sx={{ 
      height: '100%',
      background: '#ffffff',
      borderRight: '1px solid #e2e8f0',
    }}>
      <Toolbar sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        px: 2,
        borderBottom: '1px solid #e2e8f0',
      }}>
        <Typography variant="h6" noWrap component="div" sx={{ 
          fontWeight: 700,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          📚 {'Routine'}
        </Typography>
        <IconButton 
          size="small" 
          onClick={handleToggleSidebar}
          title="Hide Sidebar"
          sx={{ 
            bgcolor: '#f1f5f9',
            color: '#64748b',
            '&:hover': {
              bgcolor: '#e2e8f0',
              color: '#6366f1',
            },
          }}
        >
          <HideIcon fontSize="small" />
        </IconButton>
      </Toolbar>
      
      <List sx={{ px: 1, py: 2 }}>
          <>
            {/* Dashboard/Home - Always visible */}
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton 
                onClick={() => handleNavigation('/dashboard')}
                sx={{ 
                  borderRadius: 2,
                  py: 1.5,
                  '&:hover': {
                    bgcolor: 'rgba(99, 102, 241, 0.08)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: '#6366f1', minWidth: 40 }}>
                  <DashboardIcon />
                </ListItemIcon>
                <ListItemText 
                  primary={isAuthenticated ? "Dashboard" : "Home"} 
                  primaryTypographyProps={{ fontWeight: 600, color: '#334155', fontSize: '0.9375rem' }}
                />
              </ListItemButton>
            </ListItem>
            
            {/* Class & Teacher Routine - Always visible for all users */}
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton 
                onClick={() => handleNavigation('/dashboard/class-routine')}
                sx={{ 
                  borderRadius: 2,
                  py: 1.5,
                  '&:hover': {
                    bgcolor: 'rgba(99, 102, 241, 0.08)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: '#3b82f6', minWidth: 40 }}>
                  <ClassRoutineIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Class Routine" 
                  primaryTypographyProps={{ fontWeight: 500, color: '#334155', fontSize: '0.9375rem' }}
                />
              </ListItemButton>
            </ListItem>
            
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton 
                onClick={() => handleNavigation('/dashboard/teacher-routine')}
                sx={{ 
                  borderRadius: 2,
                  py: 1.5,
                  '&:hover': {
                    bgcolor: 'rgba(99, 102, 241, 0.08)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: '#3b82f6', minWidth: 40 }}>
                  <TeacherRoutineIcon />
                </ListItemIcon>
                <ListItemText 
                  primary={isAuthenticated ? "My Routine" : "Teacher Routine"} 
                  primaryTypographyProps={{ fontWeight: 500, color: '#334155', fontSize: '0.9375rem' }}
                />
              </ListItemButton>
            </ListItem>
            
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton 
                onClick={() => handleNavigation('/dashboard/calendar')}
                sx={{ 
                  borderRadius: 2,
                  py: 1.5,
                  '&:hover': {
                    bgcolor: 'rgba(99, 102, 241, 0.08)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: '#3b82f6', minWidth: 40 }}>
                  <CalendarIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Academic Calendar" 
                  primaryTypographyProps={{ fontWeight: 500, color: '#334155', fontSize: '0.9375rem' }}
                />
              </ListItemButton>
            </ListItem>
            
            {isAuthenticated && <Divider sx={{ my: 2, borderColor: '#e2e8f0' }} />}
            
            {/* Collapsible Sections - Only for authenticated admin users */}
            {isAuthenticated && isAdmin() && menuSections.map((section) => (
              <Box key={section.title} sx={{ mb: 1 }}>
                <ListItemButton 
                  onClick={() => handleSectionToggle(section.title)}
                  sx={{ 
                    borderRadius: 2,
                    bgcolor: '#f8fafc',
                    mb: 0.5,
                    py: 1,
                    '&:hover': {
                      bgcolor: '#f1f5f9',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: '#64748b', minWidth: 40 }}>{section.icon}</ListItemIcon>
                  <ListItemText 
                    primary={section.title} 
                    primaryTypographyProps={{ fontWeight: 600, fontSize: '0.8125rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  />
                  {openSections[section.title] ? <ExpandLess sx={{ color: '#64748b' }} /> : <ExpandMore sx={{ color: '#64748b' }} />}
                </ListItemButton>
                
                <Collapse in={openSections[section.title]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {section.items.map((item) => (
                      <ListItemButton
                        key={item.text}
                        sx={{ 
                          pl: 4, 
                          py: 1,
                          borderRadius: 2,
                          mx: 1,
                          '&:hover': {
                            bgcolor: 'rgba(99, 102, 241, 0.08)',
                          },
                        }}
                        onClick={() => handleNavigation(item.path)}
                      >
                        <ListItemIcon sx={{ color: '#94a3b8', minWidth: 36 }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText 
                          primary={item.text} 
                          primaryTypographyProps={{ fontSize: '0.875rem', color: '#475569', fontWeight: 500 }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </Box>
            ))}
            
            {isAuthenticated && isAdmin() && <Divider sx={{ my: 2, borderColor: '#e2e8f0' }} />}
            
            {/* Load Report & Finance - Admin only */}
            {isAuthenticated && isAdmin() && (
              <>
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton 
                    onClick={() => handleNavigation('/dashboard/schedules')}
                    sx={{ 
                      borderRadius: 2,
                      py: 1.5,
                      '&:hover': {
                        bgcolor: 'rgba(99, 102, 241, 0.08)',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: '#64748b', minWidth: 40 }}>
                      <ScheduleIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Load Report" 
                      primaryTypographyProps={{ fontWeight: 500, color: '#334155', fontSize: '0.9375rem' }}
                    />
                  </ListItemButton>
                </ListItem>
                
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton 
                    onClick={() => handleNavigation('/dashboard/finance')}
                    sx={{ 
                      borderRadius: 2,
                      py: 1.5,
                      '&:hover': {
                        bgcolor: 'rgba(16, 185, 129, 0.08)',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: '#10b981', minWidth: 40 }}>
                      <FinanceIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Finance" 
                      primaryTypographyProps={{ fontWeight: 500, color: '#10b981', fontSize: '0.9375rem' }}
                    />
                  </ListItemButton>
                </ListItem>
                
                <Divider sx={{ my: 2, borderColor: '#e2e8f0' }} />
                
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton 
                    onClick={() => handleNavigation('/dashboard/users')}
                    sx={{ 
                      borderRadius: 2,
                      py: 1.5,
                      '&:hover': {
                        bgcolor: 'rgba(245, 158, 11, 0.08)',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: '#d97706', minWidth: 40 }}>
                      <ManageAccounts />
                    </ListItemIcon>
                    <ListItemText 
                      primary="User Management" 
                      primaryTypographyProps={{ fontWeight: 600, color: '#d97706', fontSize: '0.9375rem' }}
                    />
                  </ListItemButton>
                </ListItem>
              </>
            )}
          </>
        
        {/* Login button for unauthenticated users */}
        {!isAuthenticated && (
          <>
            <Divider sx={{ my: 2, borderColor: '#e2e8f0' }} />
            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => handleNavigation('/login')}
                sx={{ 
                  borderRadius: 2,
                  py: 1.5,
                  bgcolor: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                  <LoginIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Login" 
                  primaryTypographyProps={{ fontWeight: 600, color: 'white', fontSize: '0.9375rem' }}
                />
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: sidebarVisible ? `calc(100% - ${drawerWidth}px)` : '100%' },
          ml: { sm: sidebarVisible ? `${drawerWidth}px` : 0 },
          transition: 'width 0.3s, margin 0.3s',
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleToggleSidebar}
            sx={{ 
              mr: 2, 
              display: { xs: 'none', sm: 'block' },
              color: '#64748b',
              bgcolor: '#f1f5f9',
              '&:hover': {
                bgcolor: '#e2e8f0',
                color: '#6366f1',
              },
            }}
          >
            {sidebarVisible ? <HideIcon /> : <ShowIcon />}
          </IconButton>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { xs: 'block', sm: 'none' },
              color: '#64748b',
              bgcolor: '#f1f5f9',
              '&:hover': {
                bgcolor: '#e2e8f0',
              },
            }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* KEC Logo */}
          <Box 
            component="img" 
            src="/logo.png" 
            alt="KEC Logo"
            sx={{
              height: 40,
              width: 40,
              mr: 2,
              borderRadius: '12px',
              border: '2px solid #e2e8f0',
              bgcolor: 'white',
              p: 0.3,
            }}
          />
          
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, color: '#0f172a' }}>
            {'Routine Scheduler'}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
              Academic Year 2025
            </Typography>
            
            {/* Show user info and menu for authenticated users */}
            {isAuthenticated ? (
              <>
                <Chip
                  label={user?.role?.toUpperCase()}
                  size="small"
                  sx={{ 
                    fontWeight: 600,
                    bgcolor: user?.role === 'admin' ? 'rgba(245, 158, 11, 0.1)' : user?.role === 'viewer' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                    color: user?.role === 'admin' ? '#d97706' : user?.role === 'viewer' ? '#10b981' : '#2563eb',
                  }}
                />
                <IconButton
                  size="large"
                  onClick={handleMenu}
                  sx={{
                    bgcolor: '#f1f5f9',
                    color: '#64748b',
                    '&:hover': { bgcolor: '#e2e8f0', color: '#6366f1' },
                  }}
                >
                  <AccountCircle />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight="bold" color="#0f172a">
                      {user?.full_name}
                    </Typography>
                    <Typography variant="caption" color="#64748b">
                      {user?.email}
                    </Typography>
                  </Box>
                  <Divider />
                  <MenuItem onClick={() => { handleClose(); navigate('/dashboard/change-password'); }}>
                    <ListItemIcon>
                      <LockIcon fontSize="small" />
                    </ListItemIcon>
                    Change Password
                  </MenuItem>
                  {user?.role === 'admin' && (
                  <MenuItem onClick={() => { handleClose(); navigate('/dashboard/users'); }}>
                    <ListItemIcon>
                      <ManageAccounts fontSize="small" />
                    </ListItemIcon>
                    User Management
                  </MenuItem>
                  )}
                  <MenuItem onClick={handleLogout} sx={{ color: '#ef4444' }}>
                    <ListItemIcon>
                      <Logout fontSize="small" sx={{ color: '#ef4444' }} />
                    </ListItemIcon>
                    Logout
                  </MenuItem>
                </Menu>
              </>
            ) : (
              /* Show Login button for unauthenticated users */
              <Button
                variant="contained"
                startIcon={<LoginIcon />}
                onClick={() => navigate('/login')}
                sx={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  fontWeight: 600,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  },
                }}
              >
                Login
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: sidebarVisible ? drawerWidth : 0 }, flexShrink: { sm: 0 }, transition: 'width 0.3s' }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: sidebarVisible ? 'block' : 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: sidebarVisible ? `calc(100% - ${drawerWidth}px)` : '100%' },
          transition: 'width 0.3s',
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  )
}
