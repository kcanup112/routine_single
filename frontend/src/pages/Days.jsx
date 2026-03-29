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
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { dayService } from '../services'

export default function Days() {
  const [days, setDays] = useState([])
  const [open, setOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editId, setEditId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    order: '',
  })
  const [loading, setLoading] = useState(false)

  const loadDays = async () => {
    try {
      const response = await dayService.getAll()
      setDays(response.data)
    } catch (error) {
      console.error('Error loading days:', error)
    }
  }

  useEffect(() => {
    loadDays()
  }, [])

  const handleOpen = () => {
    setEditMode(false)
    setEditId(null)
    setFormData({ name: '', order: '' })
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditMode(false)
    setEditId(null)
    setFormData({ name: '', order: '' })
  }

  const handleEdit = (day) => {
    setEditMode(true)
    setEditId(day.id)
    setFormData({
      name: day.name,
      order: day.order,
    })
    setOpen(true)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const submitData = {
        name: formData.name,
        order: parseInt(formData.order),
      }

      if (editMode) {
        await dayService.update(editId, submitData)
      } else {
        await dayService.create(submitData)
      }
      await loadDays()
      handleClose()
    } catch (error) {
      console.error('Error saving day:', error)
      alert('Error saving day. Please check all fields.')
    }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this day?')) {
      try {
        await dayService.delete(id)
        await loadDays()
      } catch (error) {
        console.error('Error deleting day:', error)
      }
    }
  }

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'order', headerName: 'Order', width: 100 },
    { field: 'name', headerName: 'Day Name', width: 200 },
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
        <Typography variant="h4">Days</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
          Add Day
        </Button>
      </div>

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={days}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10]}
          disableSelectionOnClick
        />
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit Day' : 'Add New Day'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Day Name"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Sunday, Monday"
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense"
            label="Order"
            type="number"
            fullWidth
            value={formData.order}
            onChange={(e) => setFormData({ ...formData, order: e.target.value })}
            placeholder="e.g., 1, 2, 3"
            sx={{ mb: 2 }}
          />
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
