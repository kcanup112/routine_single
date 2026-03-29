import { useState, useEffect } from 'react'
import {
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Alert,
  Box,
  Chip,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Info as InfoIcon } from '@mui/icons-material'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'
import { periodService, api } from '../services'

export default function Periods() {
  const [periods, setPeriods] = useState([])
  const [shifts, setShifts] = useState([])
  const [open, setOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editId, setEditId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    start_time: null,
    end_time: null,
    shift_id: '',
    period_number: '',
    type: 'teaching',
    is_teaching_period: true,
    is_active: true,
  })
  const [loading, setLoading] = useState(false)

  const loadPeriods = async () => {
    try {
      const response = await periodService.getAll()
      // Enrich periods with shift names
      const enrichedPeriods = response.data.map(period => {
        const shift = shifts.find(s => s.id === period.shift_id)
        return {
          ...period,
          shift_name: shift?.name || 'Unknown Shift'
        }
      })
      setPeriods(enrichedPeriods)
    } catch (error) {
      console.error('Error loading periods:', error)
    }
  }

  const loadShifts = async () => {
    try {
      const response = await api.get('/shifts/')
      setShifts(response.data)
      // Auto-select first shift if available
      if (response.data.length > 0 && !formData.shift_id) {
        setFormData(prev => ({ ...prev, shift_id: response.data[0].id }))
      }
    } catch (error) {
      console.error('Error loading shifts:', error)
    }
  }

  useEffect(() => {
    loadShifts()
  }, [])

  useEffect(() => {
    if (shifts.length > 0) {
      loadPeriods()
    }
  }, [shifts])

  const handleOpen = () => {
    setEditMode(false)
    setEditId(null)
    const defaultShiftId = shifts.length > 0 ? shifts[0].id : ''
    const nextPeriodNumber = periods.length > 0 ? Math.max(...periods.map(p => p.period_number || 0)) + 1 : 1
    setFormData({ 
      name: '', 
      start_time: null, 
      end_time: null, 
      shift_id: defaultShiftId,
      period_number: nextPeriodNumber,
      type: 'teaching',
      is_teaching_period: true,
      is_active: true,
    })
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditMode(false)
    setEditId(null)
    setFormData({ name: '', start_time: null, end_time: null, shift_id: '', period_number: '', type: 'teaching', is_teaching_period: true, is_active: true })
  }

  const handleEdit = (period) => {
    setEditMode(true)
    setEditId(period.id)
    
    // Parse time strings to Date objects
    const parseTime = (timeStr) => {
      if (!timeStr) return null
      const [hours, minutes, seconds] = timeStr.split(':')
      const date = new Date()
      date.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds || 0))
      return date
    }

    setFormData({
      name: period.name,
      start_time: parseTime(period.start_time),
      end_time: parseTime(period.end_time),
      shift_id: period.shift_id || (shifts.length > 0 ? shifts[0].id : ''),
      period_number: period.period_number || 1,
      type: period.type || 'teaching',
      is_teaching_period: period.is_teaching_period !== undefined ? period.is_teaching_period : true,
      is_active: period.is_active !== undefined ? period.is_active : true,
    })
    setOpen(true)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Format time as HH:MM:SS
      const formatTime = (date) => {
        if (!date) return null
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        const seconds = '00'
        return `${hours}:${minutes}:${seconds}`
      }

      const submitData = {
        shift_id: parseInt(formData.shift_id),
        period_number: parseInt(formData.period_number),
        name: formData.name,
        start_time: formatTime(formData.start_time),
        end_time: formatTime(formData.end_time),
        type: formData.type,
        is_teaching_period: formData.is_teaching_period,
        is_active: formData.is_active,
      }

      console.log('Submitting period data:', submitData)

      if (editMode) {
        await periodService.update(editId, submitData)
      } else {
        await periodService.create(submitData)
      }
      await loadPeriods()
      handleClose()
    } catch (error) {
      console.error('Error saving period:', error)
      console.error('Error response:', error.response?.data)
      alert(`Error saving period: ${error.response?.data?.detail || error.message}`)
    }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this period?')) {
      try {
        await periodService.delete(id)
        await loadPeriods()
      } catch (error) {
        console.error('Error deleting period:', error)
      }
    }
  }

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'shift_name', headerName: 'Shift', width: 150 },
    { field: 'period_number', headerName: 'Period #', width: 90 },
    { field: 'name', headerName: 'Period Name', width: 150 },
    { field: 'start_time', headerName: 'Start Time', width: 120 },
    { field: 'end_time', headerName: 'End Time', width: 120 },
    { 
      field: 'type', 
      headerName: 'Type', 
      width: 120,
      renderCell: (params) => {
        const color = params.value === 'teaching' ? 'success' : params.value === 'lunch' ? 'warning' : 'default'
        return <Chip label={params.value} size="small" color={color} />
      }
    },
    {
      field: 'duration',
      headerName: 'Duration',
      width: 100,
      renderCell: (params) => {
        const start = params.row.start_time
        const end = params.row.end_time
        if (start && end) {
          const [sh, sm] = start.split(':').map(Number)
          const [eh, em] = end.split(':').map(Number)
          const minutes = (eh * 60 + em) - (sh * 60 + sm)
          return `${minutes} min`
        }
        return ''
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <>
          <Button
            size="small"
            startIcon={<EditIcon />}
            onClick={() => handleEdit(params.row)}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <Button
            size="small"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => handleDelete(params.row.id)}
          >
            Delete
          </Button>
        </>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Typography variant="h4">Periods</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
          Add Period
        </Button>
      </div>

      <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
        <strong>Note:</strong> Periods are automatically generated when you create or update a shift. 
        You can manually add custom periods here if needed, but they should be linked to a shift.
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption">
            💡 Tip: Go to <strong>Shifts</strong> page to manage shift timings. Periods will be auto-created based on shift configuration (start time, end time, period duration, breaks).
          </Typography>
        </Box>
      </Alert>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={periods}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10]}
          disableSelectionOnClick
        />
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit Period' : 'Add New Period'}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Period Number"
            type="number"
            fullWidth
            value={formData.period_number}
            onChange={(e) => setFormData({ ...formData, period_number: e.target.value })}
            placeholder="e.g., 1, 2, 3"
            sx={{ mb: 2, mt: 1 }}
          />

          <TextField
            margin="dense"
            label="Period Name"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., 1st Period, 2nd Period"
            sx={{ mb: 2 }}
          />

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <TimePicker
              label="Start Time"
              value={formData.start_time}
              onChange={(newValue) => setFormData({ ...formData, start_time: newValue })}
              slotProps={{ textField: { fullWidth: true, margin: 'dense', sx: { mb: 2 } } }}
            />

            <TimePicker
              label="End Time"
              value={formData.end_time}
              onChange={(newValue) => setFormData({ ...formData, end_time: newValue })}
              slotProps={{ textField: { fullWidth: true, margin: 'dense', sx: { mb: 2 } } }}
            />
          </LocalizationProvider>

          {shifts.length > 0 && (
            <TextField
              select
              margin="dense"
              label="Shift"
              fullWidth
              value={formData.shift_id}
              onChange={(e) => setFormData({ ...formData, shift_id: e.target.value })}
              SelectProps={{ native: true }}
              sx={{ mb: 2 }}
            >
              {shifts.map(shift => (
                <option key={shift.id} value={shift.id}>
                  {shift.name}
                </option>
              ))}
            </TextField>
          )}

          <TextField
            select
            margin="dense"
            label="Type"
            fullWidth
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            SelectProps={{ native: true }}
            sx={{ mb: 2 }}
          >
            <option value="teaching">Teaching Period</option>
            <option value="break">Break</option>
            <option value="lunch">Lunch</option>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? 'Saving...' : editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
