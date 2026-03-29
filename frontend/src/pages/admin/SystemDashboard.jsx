import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  Business as BusinessIcon,
  CheckCircle as ActiveIcon,
  Schedule as TrialIcon,
  Block as SuspendedIcon,
  People as PeopleIcon,
  TrendingUp as GrowthIcon,
  AttachMoney as RevenueIcon
} from '@mui/icons-material';
import { adminService } from '../../services/adminService';

const StatCard = ({ title, value, icon: Icon, color = 'primary' }) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="textSecondary" variant="body2" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4">{value}</Typography>
        </Box>
        <Icon sx={{ fontSize: 48, color: `${color}.main`, opacity: 0.7 }} />
      </Box>
    </CardContent>
  </Card>
);

export default function SystemDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await adminService.getSystemStats();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error">Error loading dashboard: {error}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        System Dashboard
      </Typography>

      {/* Main Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Tenants"
            value={stats?.total_tenants || 0}
            icon={BusinessIcon}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Tenants"
            value={stats?.active_tenants || 0}
            icon={ActiveIcon}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Trial Tenants"
            value={stats?.trial_tenants || 0}
            icon={TrialIcon}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Suspended"
            value={stats?.suspended_tenants || 0}
            icon={SuspendedIcon}
            color="error"
          />
        </Grid>
      </Grid>

      {/* Secondary Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Total Users"
            value={stats?.total_users || 0}
            icon={PeopleIcon}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Growth This Month"
            value={stats?.growth_this_month || 0}
            icon={GrowthIcon}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Revenue This Month"
            value={`NPR ${(stats?.revenue_this_month || 0).toFixed(2)}`}
            icon={RevenueIcon}
            color="primary"
          />
        </Grid>
      </Grid>

      {/* Tenants by Plan */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Tenants by Plan
        </Typography>
        <Grid container spacing={2}>
          {stats?.tenants_by_plan && Object.entries(stats.tenants_by_plan).map(([plan, count]) => (
            <Grid item xs={6} sm={3} key={plan}>
              <Box textAlign="center">
                <Typography variant="h5" color="primary">{count}</Typography>
                <Typography variant="body2" color="textSecondary" textTransform="capitalize">
                  {plan}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Container>
  );
}
