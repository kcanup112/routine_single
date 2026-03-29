import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Grid
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Block as SuspendIcon,
  CheckCircle as ActivateIcon,
  Upgrade as UpgradeIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { adminService } from '../../services/adminService';

const StatusChip = ({ status }) => {
  const colorMap = {
    active: 'success',
    trial: 'info',
    suspended: 'error',
    cancelled: 'default'
  };
  return <Chip label={status} color={colorMap[status] || 'default'} size="small" />;
};

const PlanChip = ({ plan }) => {
  const colorMap = {
    trial: 'default',
    basic: 'primary',
    standard: 'secondary',
    premium: 'warning'
  };
  return <Chip label={plan} color={colorMap[plan] || 'default'} size="small" variant="outlined" />;
};

export default function TenantList() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [actionDialog, setActionDialog] = useState({ open: false, type: null });
  const [actionReason, setActionReason] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, tenant: null });
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    loadTenants();
  }, [statusFilter, planFilter, searchQuery]);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const data = await adminService.getTenants({
        status: statusFilter,
        plan: planFilter,
        search: searchQuery
      });
      setTenants(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (tenantId, newStatus) => {
    try {
      await adminService.updateTenantStatus(tenantId, newStatus, actionReason);
      setActionDialog({ open: false, type: null });
      setActionReason('');
      loadTenants();
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const openActionDialog = (tenant, type) => {
    setSelectedTenant(tenant);
    setActionDialog({ open: true, type });
  };

  const handleDeleteTenant = async (tenantId) => {
    try {
      await adminService.deleteTenant(tenantId, true); // permanent=true to delete schema
      setDeleteDialog({ open: false, tenant: null });
      setDeleteConfirmText('');
      loadTenants();
    } catch (err) {
      alert('Error deleting tenant: ' + err.message);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Tenant Management</Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search"
              placeholder="Name, subdomain, or email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="trial">Trial</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Plan</InputLabel>
              <Select
                value={planFilter}
                label="Plan"
                onChange={(e) => setPlanFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="trial">Trial</MenuItem>
                <MenuItem value="basic">Basic</MenuItem>
                <MenuItem value="standard">Standard</MenuItem>
                <MenuItem value="premium">Premium</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Subdomain</TableCell>
                <TableCell>Admin Email</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Users</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id} hover>
                  <TableCell>{tenant.name}</TableCell>
                  <TableCell>
                    <code>{tenant.subdomain}</code>
                  </TableCell>
                  <TableCell>{tenant.admin_email}</TableCell>
                  <TableCell>
                    <PlanChip plan={tenant.plan} />
                  </TableCell>
                  <TableCell>
                    <StatusChip status={tenant.status} />
                  </TableCell>
                  <TableCell>{tenant.user_count}</TableCell>
                  <TableCell>
                    {new Date(tenant.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => window.location.href = `/admin/tenants/${tenant.id}`}
                      title="View Details"
                    >
                      <ViewIcon />
                    </IconButton>
                    {tenant.status !== 'suspended' && (
                      <IconButton
                        size="small"
                        color="warning"
                        onClick={() => openActionDialog(tenant, 'suspend')}
                        title="Suspend Tenant"
                      >
                        <SuspendIcon />
                      </IconButton>
                    )}
                    {tenant.status === 'suspended' && (
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => openActionDialog(tenant, 'activate')}
                        title="Activate Tenant"
                      >
                        <ActivateIcon />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteDialog({ open: true, tenant })}
                      title="Delete Tenant Permanently"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onClose={() => setActionDialog({ open: false, type: null })}>
        <DialogTitle>
          {actionDialog.type === 'suspend' ? 'Suspend Tenant' : 'Activate Tenant'}
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to {actionDialog.type} <strong>{selectedTenant?.name}</strong>?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason (optional)"
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog({ open: false, type: null })}>Cancel</Button>
          <Button
            variant="contained"
            color={actionDialog.type === 'suspend' ? 'error' : 'success'}
            onClick={() => handleStatusUpdate(
              selectedTenant?.id,
              actionDialog.type === 'suspend' ? 'suspended' : 'active'
            )}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialog.open} 
        onClose={() => { setDeleteDialog({ open: false, tenant: null }); setDeleteConfirmText(''); }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: '#dc2626', fontWeight: 700 }}>
          ⚠️ Permanently Delete Tenant
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <strong>WARNING:</strong> This action cannot be undone! All tenant data including:
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>Database schema and all tables</li>
              <li>Users, Teachers, Students</li>
              <li>Departments, Classes, Routines</li>
              <li>All associated records</li>
            </ul>
            will be permanently deleted.
          </Alert>
          <Typography gutterBottom>
            To confirm deletion of <strong>{deleteDialog.tenant?.name}</strong> ({deleteDialog.tenant?.subdomain}), 
            please type the subdomain <code style={{ background: '#fee2e2', padding: '2px 6px', borderRadius: '4px', color: '#dc2626' }}>{deleteDialog.tenant?.subdomain}</code> below:
          </Typography>
          <TextField
            fullWidth
            label="Type subdomain to confirm"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            sx={{ mt: 2 }}
            error={deleteConfirmText !== '' && deleteConfirmText !== deleteDialog.tenant?.subdomain}
            helperText={deleteConfirmText !== '' && deleteConfirmText !== deleteDialog.tenant?.subdomain ? 'Subdomain does not match' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDeleteDialog({ open: false, tenant: null }); setDeleteConfirmText(''); }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleteConfirmText !== deleteDialog.tenant?.subdomain}
            onClick={() => handleDeleteTenant(deleteDialog.tenant?.id)}
          >
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
