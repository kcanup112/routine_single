import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import theme from './theme'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import AdminPortal from './pages/AdminPortal'
import UnauthorizedPage from './components/auth/UnauthorizedPage'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Departments from './pages/Departments'
import Programmes from './pages/Programmes'
import Semesters from './pages/Semesters'
import Teachers from './pages/Teachers'
import Subjects from './pages/Subjects'
import Classes from './pages/Classes'
import Days from './pages/Days'
import Periods from './pages/Periods'
import Shifts from './pages/Shifts'
import Rooms from './pages/Rooms'
import Schedules from './pages/Schedules'
import ClassRoutine from './pages/ClassRoutine'
import TeacherRoutine from './pages/TeacherRoutine'
import Finance from './pages/Finance'
import UserManagement from './pages/UserManagement'
import AcademicCalendar from './pages/AcademicCalendar'
import SystemDashboard from './pages/admin/SystemDashboard'
import TenantList from './pages/admin/TenantList'
import { useEffect } from 'react'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
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
              {/* Public pages */}
              <Route index element={<Dashboard />} />
              <Route path="class-routine" element={<ClassRoutine />} />
              <Route path="teacher-routine" element={<TeacherRoutine />} />
              <Route path="calendar" element={<AcademicCalendar />} />
              
              {/* Protected admin routes - require authentication */}
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
              
              {/* Superadmin only - User Management */}
              <Route path="users" element={
                <ProtectedRoute roles={['super_admin']}>
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
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
