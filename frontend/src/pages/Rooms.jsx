import { useState, useEffect } from 'react'
import {
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Paper,
  Chip,
  Autocomplete,
  createFilterOptions,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { roomService } from '../services'

const filter = createFilterOptions()

export default function Rooms() {
  const [rooms, setRooms] = useState([])
  const [open, setOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    room_number: '',
    name: '',
    building: '',
    floor: '',
    capacity: '',
    type: '',
    description: '',
    is_active: true,
  })

  // Derive unique building names from existing rooms for the autocomplete
  const buildingOptions = [...new Set(rooms.map(r => r.building).filter(Boolean))].sort()

  useEffect(() => {
    loadRooms()
  }, [])

  const loadRooms = async () => {
    try {
      setLoading(true)
      const response = await roomService.getAll()
      setRooms(response.data || [])
    } catch (error) {
      console.error('Error loading rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = () => {
    setEditMode(false)
    setEditId(null)
    setFormData({
      room_number: '',
      name: '',
      building: '',
      floor: '',
      capacity: '',
      type: '',
      description: '',
      is_active: true,
    })
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditMode(false)
    setEditId(null)
  }

  const handleEdit = (room) => {
    setEditMode(true)
    setEditId(room.id)
    setFormData({
      room_number: room.room_number || '',
      name: room.name || '',
      building: room.building || '',
      floor: room.floor || '',
      capacity: room.capacity ?? '',
      type: room.type || '',
      description: room.description || '',
      is_active: room.is_active ?? true,
    })
    setOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.room_number) {
      alert('Room number is required')
      return
    }
    setLoading(true)
    try {
      const submitData = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
      }
      if (editMode) {
        await roomService.update(editId, submitData)
      } else {
        await roomService.create(submitData)
      }
      await loadRooms()
      handleClose()
    } catch (error) {
      console.error('Error saving room:', error)
      const msg = error.response?.data?.detail || 'Error saving room'
      alert(typeof msg === 'string' ? msg : JSON.stringify(msg))
    }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        await roomService.delete(id)
        await loadRooms()
      } catch (error) {
        console.error('Error deleting room:', error)
      }
    }
  }

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'room_number', headerName: 'Room Number', width: 150 },
    { field: 'name', headerName: 'Name', width: 180 },
    { field: 'building', headerName: 'Building', width: 180 },
    { field: 'floor', headerName: 'Floor', width: 100 },
    { field: 'capacity', headerName: 'Capacity', width: 100, type: 'number' },
    {
      field: 'type',
      headerName: 'Type',
      width: 130,
      renderCell: (params) => params.value ? (
        <Chip label={params.value} size="small" color={params.value === 'lab' ? 'warning' : 'default'} />
      ) : null,
    },
    {
      field: 'is_active',
      headerName: 'Active',
      width: 90,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Yes' : 'No'}
          size="small"
          color={params.value ? 'success' : 'default'}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <>
          <Button size="small" startIcon={<EditIcon />} onClick={() => handleEdit(params.row)} sx={{ mr: 1 }}>
            Edit
          </Button>
          <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => handleDelete(params.row.id)}>
            Delete
          </Button>
        </>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Typography variant="h4">Rooms</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
          Add Room
        </Button>
      </div>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={rooms}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10]}
          disableSelectionOnClick
          loading={loading}
        />
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit Room' : 'Add New Room'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Room Number"
            fullWidth
            required
            value={formData.room_number}
            onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
            placeholder="e.g., A-100, Lab-01"
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense"
            label="Room Name"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Computer Lab 1, Lecture Hall A"
            sx={{ mb: 2 }}
          />

          <Autocomplete
            freeSolo
            value={formData.building}
            onChange={(event, newValue) => {
              if (typeof newValue === 'string') {
                setFormData({ ...formData, building: newValue })
              } else if (newValue && newValue.inputValue) {
                // User typed a new value via "Add ..." option
                setFormData({ ...formData, building: newValue.inputValue })
              } else {
                setFormData({ ...formData, building: newValue || '' })
              }
            }}
            filterOptions={(options, params) => {
              const filtered = filter(options, params)
              const { inputValue } = params
              const isExisting = options.some((option) => inputValue === option)
              if (inputValue !== '' && !isExisting) {
                filtered.push({
                  inputValue,
                  label: `Add "${inputValue}"`,
                })
              }
              return filtered
            }}
            selectOnFocus
            clearOnBlur
            handleHomeEndKeys
            options={buildingOptions}
            getOptionLabel={(option) => {
              if (typeof option === 'string') return option
              if (option.inputValue) return option.inputValue
              return option.label || ''
            }}
            renderOption={(props, option) => {
              const { key, ...rest } = props
              return <li key={key} {...rest}>{typeof option === 'string' ? option : option.label}</li>
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                margin="dense"
                label="Building"
                placeholder="Select or type building name"
                fullWidth
                sx={{ mb: 2 }}
              />
            )}
          />

          <TextField
            margin="dense"
            label="Floor"
            fullWidth
            value={formData.floor}
            onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
            placeholder="e.g., 1st Floor, Ground"
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense"
            label="Capacity"
            fullWidth
            type="number"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
            sx={{ mb: 2 }}
          />

          <TextField
            select
            margin="dense"
            label="Room Type"
            fullWidth
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            sx={{ mb: 2 }}
          >
            <MenuItem value="">None</MenuItem>
            <MenuItem value="classroom">Classroom</MenuItem>
            <MenuItem value="lab">Lab</MenuItem>
            <MenuItem value="auditorium">Auditorium</MenuItem>
            <MenuItem value="seminar">Seminar Hall</MenuItem>
            <MenuItem value="workshop">Workshop</MenuItem>
          </TextField>

          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
