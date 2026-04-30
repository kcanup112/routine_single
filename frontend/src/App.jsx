import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import theme from './theme'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import Layout from './components/Layout'
import { lazy, Suspense } from 'react'
import { CircularProgress, Box } from '@mui/material'
import ReloadPrompt from './components/ReloadPrompt'

// Lazy-loaded pages
const LandingPage = lazy(() => import('./pages/LandingPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
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
            {/* Root landing page */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<Navigate to="/login" replace />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            
            {/* Authenticated layout */}
            <Route path="/dashboard" element={<Layout />}>
              {/* Pages accessible to all authenticated users (admin + viewer) */}
              <Route index element={<Dashboard />} />
              <Route path="class-routine" element={<ClassRoutine />} />
              <Route path="teacher-routine" element={<TeacherRoutine />} />
              <Route path="calendar" element={<AcademicCalendar />} />
              <Route path="change-password" element={<ChangePassword />} />
              
              {/* Admin-only routes */}
              <Route path="departments" element={
                <ProtectedRoute roles={['admin']}>
                  <Departments />
                </ProtectedRoute>
              } />
              <Route path="programmes" element={
                <ProtectedRoute roles={['admin']}>
                  <Programmes />
                </ProtectedRoute>
              } />
              <Route path="semesters" element={
                <ProtectedRoute roles={['admin']}>
                  <Semesters />
                </ProtectedRoute>
              } />
              <Route path="teachers" element={
                <ProtectedRoute roles={['admin']}>
                  <Teachers />
                </ProtectedRoute>
              } />
              <Route path="subjects" element={
                <ProtectedRoute roles={['admin']}>
                  <Subjects />
                </ProtectedRoute>
              } />
              <Route path="classes" element={
                <ProtectedRoute roles={['admin']}>
                  <Classes />
                </ProtectedRoute>
              } />
              <Route path="days" element={
                <ProtectedRoute roles={['admin']}>
                  <Days />
                </ProtectedRoute>
              } />
              <Route path="periods" element={
                <ProtectedRoute roles={['admin']}>
                  <Periods />
                </ProtectedRoute>
              } />
              <Route path="shifts" element={
                <ProtectedRoute roles={['admin']}>
                  <Shifts />
                </ProtectedRoute>
              } />
              <Route path="rooms" element={
                <ProtectedRoute roles={['admin']}>
                  <Rooms />
                </ProtectedRoute>
              } />
              <Route path="schedules" element={
                <ProtectedRoute roles={['admin']}>
                  <Schedules />
                </ProtectedRoute>
              } />
              <Route path="finance" element={
                <ProtectedRoute roles={['admin']}>
                  <Finance />
                </ProtectedRoute>
              } />
              <Route path="academic-hierarchy" element={
                <ProtectedRoute roles={['admin']}>
                  <AcademicHierarchy />
                </ProtectedRoute>
              } />
              
              {/* Admin - User Management */}
              <Route path="users" element={
                <ProtectedRoute roles={['admin']}>
                  <UserManagement />
                </ProtectedRoute>
              } />
            </Route>
          </Routes>
          </Suspense>
        </Router>
        <ReloadPrompt />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
