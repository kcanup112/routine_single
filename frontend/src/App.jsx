import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import theme from './theme'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import Layout from './components/Layout'
import { lazy, Suspense, useEffect } from 'react'
import { CircularProgress, Box } from '@mui/material'

// Lazy-loaded pages — each becomes a separate chunk
const LandingPage = lazy(() => import('./pages/LandingPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const SignupPage = lazy(() => import('./pages/SignupPage'))
const AdminPortal = lazy(() => import('./pages/AdminPortal'))
const UnauthorizedPage = lazy(() => import('./components/auth/UnauthorizedPage'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Departments = lazy(() => import('./pages/Departments'))
const Programmes = lazy(() => import('./pages/Programmes'))
const Semesters = lazy(() => import('./pages/Semesters'))
const Teachers = lazy(() => import('./pages/Teachers'))
const Subjects = lazy(() => import('./pages/Subjects'))
const Classes = lazy(() => import('./pages/Classes'))
const Days = lazy(() => import('./pages/Days'))
const Periods = lazy(() => import('./pages/Periods'))
const Shifts = lazy(() => import('./pages/Shifts'))
const Rooms = lazy(() => import('./pages/Rooms'))
const Schedules = lazy(() => import('./pages/Schedules'))
const ClassRoutine = lazy(() => import('./pages/ClassRoutine'))
const TeacherRoutine = lazy(() => import('./pages/TeacherRoutine'))
const Finance = lazy(() => import('./pages/Finance'))
const UserManagement = lazy(() => import('./pages/UserManagement'))
const AcademicCalendar = lazy(() => import('./pages/AcademicCalendar'))
const AcademicHierarchy = lazy(() => import('./pages/AcademicHierarchy'))
const ChangePassword = lazy(() => import('./pages/ChangePassword'))
const SystemDashboard = lazy(() => import('./pages/admin/SystemDashboard'))
const TenantList = lazy(() => import('./pages/admin/TenantList'))

const PageLoader = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
    <CircularProgress />
  </Box>
)

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Landing page - root path */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Public routes - no authentication required */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/admin" element={<AdminPortal />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            
            {/* Authenticated layout - requires subdomain */}
            <Route path="/dashboard" element={<Layout />}>
              {/* Pages accessible to all authenticated users (admin + viewer) */}
              <Route index element={<Dashboard />} />
              <Route path="class-routine" element={<ClassRoutine />} />
              <Route path="teacher-routine" element={<TeacherRoutine />} />
              <Route path="calendar" element={<AcademicCalendar />} />
              <Route path="change-password" element={<ChangePassword />} />
              
              {/* Protected admin routes - require admin or super_admin */}
              <Route path="departments" element={
                <ProtectedRoute roles={['super_admin', 'admin']}>
                  <Departments />
                </ProtectedRoute>
              } />
              <Route path="programmes" element={
                <ProtectedRoute roles={['super_admin', 'admin']}>
                  <Programmes />
                </ProtectedRoute>
              } />
              <Route path="semesters" element={
                <ProtectedRoute roles={['super_admin', 'admin']}>
                  <Semesters />
                </ProtectedRoute>
              } />
              <Route path="teachers" element={
                <ProtectedRoute roles={['super_admin', 'admin']}>
                  <Teachers />
                </ProtectedRoute>
              } />
              <Route path="subjects" element={
                <ProtectedRoute roles={['super_admin', 'admin']}>
                  <Subjects />
                </ProtectedRoute>
              } />
              <Route path="classes" element={
                <ProtectedRoute roles={['super_admin', 'admin']}>
                  <Classes />
                </ProtectedRoute>
              } />
              <Route path="days" element={
                <ProtectedRoute roles={['super_admin', 'admin']}>
                  <Days />
                </ProtectedRoute>
              } />
              <Route path="periods" element={
                <ProtectedRoute roles={['super_admin', 'admin']}>
                  <Periods />
                </ProtectedRoute>
              } />
              <Route path="shifts" element={
                <ProtectedRoute roles={['super_admin', 'admin']}>
                  <Shifts />
                </ProtectedRoute>
              } />
              <Route path="rooms" element={
                <ProtectedRoute roles={['super_admin', 'admin']}>
                  <Rooms />
                </ProtectedRoute>
              } />
              <Route path="schedules" element={
                <ProtectedRoute roles={['super_admin', 'admin']}>
                  <Schedules />
                </ProtectedRoute>
              } />
              <Route path="finance" element={
                <ProtectedRoute roles={['super_admin', 'admin']}>
                  <Finance />
                </ProtectedRoute>
              } />
              <Route path="academic-hierarchy" element={
                <ProtectedRoute roles={['super_admin', 'admin']}>
                  <AcademicHierarchy />
                </ProtectedRoute>
              } />
              
              {/* Superadmin and Admin - User Management */}
              <Route path="users" element={
                <ProtectedRoute roles={['super_admin', 'admin']}>
                  <UserManagement />
                </ProtectedRoute>
              } />
              
              {/* Superadmin only - System Admin Panel */}
              <Route path="admin/dashboard" element={
                <ProtectedRoute roles={['super_admin']}>
                  <SystemDashboard />
                </ProtectedRoute>
              } />
              <Route path="admin/tenants" element={
                <ProtectedRoute roles={['super_admin']}>
                  <TenantList />
                </ProtectedRoute>
              } />
            </Route>
          </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
