import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Alert
} from '@mui/material';
import { AdminPanelSettings } from '@mui/icons-material';

export default function AdminPortal() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If authenticated as superadmin, redirect to admin dashboard
    if (isAuthenticated && user?.role === 'super_admin') {
      navigate('/dashboard/admin/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = () => {
    // Redirect to login with return URL
    navigate('/login?redirect=/admin');
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <AdminPanelSettings sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            System Administration
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            This area is restricted to system administrators only.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleLogin}
            sx={{ mt: 2 }}
          >
            Administrator Login
          </Button>
        </Paper>
      </Container>
    );
  }

  if (user?.role !== 'super_admin') {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="error">
          <Typography variant="h6">Access Denied</Typography>
          <Typography>
            You do not have permission to access the admin portal.
          </Typography>
        </Alert>
      </Container>
    );
  }

  return null; // Will redirect to dashboard
}
