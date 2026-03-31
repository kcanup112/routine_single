import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Typography,
  IconButton,
  Chip,
  FormControlLabel,
  Switch,
  Alert,
  Grid,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { shiftService } from '../services'

export default function Shifts() {
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editId, setEditId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_time: '',
    end_time: '',
    working_days: [0, 1, 2, 3, 4, 5], // Sunday-Friday by default
    period_duration: 50,
    break_after_periods: '2,4',
    break_durations: '15,60',
    is_active: true,
    is_default: false,
  })
  const [error, setError] = useState('')

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  useEffect(() => {
    loadShifts()
  }, [])

  const loadShifts = async () => {
    try {
      setLoading(true)
      const response = await shiftService.getAll()
      const data = response.data || response
      setShifts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading shifts:', error)
      setError('Failed to load shifts')
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = () => {
    setFormData({
      name: '',
      description: '',
      start_time: '',
      end_time: '',
      working_days: [0, 1, 2, 3, 4, 5],
      period_duration: 50,
      break_after_periods: '2,4',
      break_durations: '15,60',
      is_active: true,
      is_default: false,
    })
    setEditMode(false)
    setEditId(null)
    setError('')
    setOpen(true)
  }

  const handleEdit = (shift) => {
    setFormData({
      name: shift.name,
      description: shift.description || '',
      start_time: shift.start_time || '',
      end_time: shift.end_time || '',
      working_days: Array.isArray(shift.working_days) ? shift.working_days : [],
      period_duration: shift.period_duration || 50,
      break_after_periods: Array.isArray(shift.break_after_periods) 
        ? shift.break_after_periods.join(',') 
        : '',
      break_durations: Array.isArray(shift.break_durations) 
        ? shift.break_durations.join(',') 
        : '',
      is_active: shift.is_active !== false,
      is_default: shift.is_default === true,
    })
    setEditMode(true)
    setEditId(shift.id)
    setError('')
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditMode(false)
    setEditId(null)
    setError('')
  }

  const handleChange = (e) => {
    const { name, value, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: e.target.type === 'checkbox' ? checked : value
    }))
  }

  const handleDayToggle = (dayIndex) => {
    setFormData(prev => ({
      ...prev,
      working_days: prev.working_days.includes(dayIndex)
        ? prev.working_days.filter(d => d !== dayIndex)
        : [...prev.working_days, dayIndex].sort()
    }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    
    try {
      // Parse arrays from comma-separated strings
      const breakAfterPeriods = formData.break_after_periods
        ? formData.break_after_periods.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
        : []
      
      const breakDurations = formData.break_durations
        ? formData.break_durations.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
        : []

      const submitData = {
        name: formData.name,
        description: formData.description,
        start_time: formData.start_time,
        end_time: formData.end_time,
        working_days: formData.working_days,
        period_duration: parseInt(formData.period_duration),
        break_after_periods: breakAfterPeriods,
        break_durations: breakDurations,
        is_active: formData.is_active,
        is_default: formData.is_default,
      }

      console.log('Submitting shift data:', submitData)

      if (editMode) {
        await shiftService.update(editId, submitData)
      } else {
        await shiftService.create(submitData)
      }
      
      await loadShifts()
      handleClose()
    } catch (error) {
      console.error('Error saving shift:', error)
      console.error('Error response:', error.response?.data)
      setError(error.response?.data?.detail || error.message || 'Failed to save shift')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this shift?')) return
    
    try {
      setLoading(true)
      await shiftService.delete(id)
      await loadShifts()
    } catch (error) {
      console.error('Error deleting shift:', error)
      setError('Failed to delete shift')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Shift Name', width: 180, flex: 1 },
    { field: 'description', headerName: 'Description', width: 200, flex: 1 },
    { 
      field: 'start_time', 
      headerName: 'Start Time', 
      width: 120,
      renderCell: (params) => params.value || 'N/A'
    },
    { 
      field: 'end_time', 
      headerName: 'End Time', 
      width: 120,
      renderCell: (params) => params.value || 'N/A'
    },
    { 
      field: 'working_days', 
      headerName: 'Working Days', 
      width: 250,
      renderCell: (params) => {
        const days = Array.isArray(params.value) ? params.value : []
        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {days.map(day => (
              <Chip key={day} label={dayNames[day]} size="small" color="primary" variant="outlined" />
            ))}
          </Box>
        )
      }
    },
    { 
      field: 'period_duration', 
      headerName: 'Period (min)', 
      width: 110,
      renderCell: (params) => `${params.value || 50} min`
    },
    { 
      field: 'is_active', 
      headerName: 'Status', 
      width: 100,
      renderCell: (params) => (
        <Chip 
          label={params.value ? 'Active' : 'Inactive'} 
          color={params.value ? 'success' : 'default'} 
          size="small" 
        />
      )
    },
    { 
      field: 'is_default', 
      headerName: 'Default', 
      width: 90,
      renderCell: (params) => params.value ? (
        <Chip label="Default" color="primary" size="small" variant="outlined" />
      ) : null
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <IconButton size="small" onClick={() => handleEdit(params.row)} sx={{ color: '#2d6a6f', backgroundColor: '#2d6a6f18', borderRadius: '8px', p: '5px', '&:hover': { backgroundColor: '#2d6a6f30' } }}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => handleDelete(params.row.id)} sx={{ color: '#ef4444', backgroundColor: '#ef444418', borderRadius: '8px', p: '5px', '&:hover': { backgroundColor: '#ef444430' } }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ]

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a2332', mb: 0.25 }}>Shifts</Typography>
          <Typography variant="body2" sx={{ color: '#8896a4' }}>Manage shift timings, working days and breaks</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen} sx={{ borderRadius: '10px', px: 2.5, textTransform: 'none', fontWeight: 600, backgroundColor: '#2d6a6f', boxShadow: 'none', '&:hover': { backgroundColor: '#235558', boxShadow: 'none' } }}>
          Add Shift
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={{ border: '1px solid #e8edf2', borderRadius: '16px', overflow: 'hidden' }}>
        <DataGrid
          rows={shifts}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          loading={loading}
          disableSelectionOnClick
          autoHeight
          getRowHeight={() => 'auto'}
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f8fafc', borderBottom: '1px solid #e8edf2' }, '& .MuiDataGrid-cell': { borderColor: '#f0f4f8', fontSize: '0.87rem', py: 1 }, '& .MuiDataGrid-row:hover': { backgroundColor: '#f8fafc' }, '& .MuiDataGrid-footerContainer': { borderTop: '1px solid #e8edf2', backgroundColor: '#fafcfe' } }}
        />
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle>{editMode ? 'Edit Shift' : 'Add New Shift'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Shift Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Start Time"
                name="start_time"
                type="time"
                value={formData.start_time}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="End Time"
                name="end_time"
                type="time"
                value={formData.end_time}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Working Days
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {dayNames.map((day, index) => (
                  <Chip
                    key={index}
                    label={day}
                    onClick={() => handleDayToggle(index)}
                    color={formData.working_days.includes(index) ? 'primary' : 'default'}
                    variant={formData.working_days.includes(index) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Period Duration (minutes)"
                name="period_duration"
                type="number"
                value={formData.period_duration}
                onChange={handleChange}
                helperText="Duration of each teaching period in minutes"
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Break After Periods"
                name="break_after_periods"
                value={formData.break_after_periods}
                onChange={handleChange}
                helperText="Comma-separated (e.g., 2,4)"
                placeholder="2,4"
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Break Durations (minutes)"
                name="break_durations"
                value={formData.break_durations}
                onChange={handleChange}
                helperText="Comma-separated (e.g., 15,60)"
                placeholder="15,60"
              />
            </Grid>

            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={handleChange}
                    name="is_active"
                  />
                }
                label="Active"
              />
            </Grid>

            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_default}
                    onChange={handleChange}
                    name="is_default"
                  />
                }
                label="Set as Default"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} sx={{ borderRadius: '8px', textTransform: 'none' }}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading} sx={{ borderRadius: '8px', textTransform: 'none', backgroundColor: '#2d6a6f', boxShadow: 'none', '&:hover': { backgroundColor: '#235558' } }}>
            {editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
