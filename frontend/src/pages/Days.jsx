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
  Box,
  IconButton,
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
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a2332', mb: 0.25 }}>Days</Typography>
          <Typography variant="body2" sx={{ color: '#8896a4' }}>Manage academic week days</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen} sx={{ borderRadius: '10px', px: 2.5, textTransform: 'none', fontWeight: 600, backgroundColor: '#2d6a6f', boxShadow: 'none', '&:hover': { backgroundColor: '#235558', boxShadow: 'none' } }}>
          Add Day
        </Button>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid #e8edf2', borderRadius: '16px', overflow: 'hidden' }}>
        <DataGrid
          rows={days}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10]}
          disableSelectionOnClick
          autoHeight
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f8fafc', borderBottom: '1px solid #e8edf2' }, '& .MuiDataGrid-cell': { borderColor: '#f0f4f8', fontSize: '0.87rem' }, '& .MuiDataGrid-row:hover': { backgroundColor: '#f8fafc' }, '& .MuiDataGrid-footerContainer': { borderTop: '1px solid #e8edf2', backgroundColor: '#fafcfe' } }}
        />
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
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
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} sx={{ borderRadius: '8px', textTransform: 'none' }}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading} sx={{ borderRadius: '8px', textTransform: 'none', backgroundColor: '#2d6a6f', boxShadow: 'none', '&:hover': { backgroundColor: '#235558' } }}>
            {loading ? 'Saving...' : editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
