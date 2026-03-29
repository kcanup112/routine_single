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
  MenuItem,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material'
import { programmeService, departmentService } from '../services'

export default function Programmes() {
  const [programmes, setProgrammes] = useState([])
  const [departments, setDepartments] = useState([])
  const [open, setOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editId, setEditId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department_id: '',
  })
  const [loading, setLoading] = useState(false)

  const loadProgrammes = async () => {
    try {
      const response = await programmeService.getAll()
      setProgrammes(response.data)
    } catch (error) {
      console.error('Error loading programmes:', error)
    }
  }

  const loadDepartments = async () => {
    try {
      const response = await departmentService.getAll()
      setDepartments(response.data)
    } catch (error) {
      console.error('Error loading departments:', error)
    }
  }

  useEffect(() => {
    loadProgrammes()
    loadDepartments()
  }, [])

  const handleOpen = () => {
    setEditMode(false)
    setEditId(null)
    setOpen(true)
  }
  
  const handleClose = () => {
    setOpen(false)
    setEditMode(false)
    setEditId(null)
    setFormData({ name: '', code: '', department_id: '' })
  }

  const handleEdit = (programme) => {
    setEditMode(true)
    setEditId(programme.id)
    setFormData({
      name: programme.name,
      code: programme.code,
      department_id: programme.department_id,
    })
    setOpen(true)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      if (editMode) {
        await programmeService.update(editId, formData)
      } else {
        await programmeService.create(formData)
      }
      await loadProgrammes()
      handleClose()
    } catch (error) {
      console.error('Error saving programme:', error)
    }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this programme?')) {
      try {
        await programmeService.delete(id)
        await loadProgrammes()
      } catch (error) {
        console.error('Error deleting programme:', error)
      }
    }
  }

  const getDepartmentName = (departmentId) => {
    const dept = departments.find(d => d.id === departmentId)
    return dept ? dept.name : 'N/A'
  }

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Programme Name', width: 250 },
    { field: 'code', headerName: 'Code', width: 120 },
    {
      field: 'department_id',
      headerName: 'Department',
      width: 200,
      renderCell: (params) => getDepartmentName(params.value),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            color="primary"
            size="small"
            startIcon={<EditIcon />}
            onClick={() => handleEdit(params.row)}
          >
            Edit
          </Button>
          <Button 
            color="error" 
            size="small"
            onClick={() => handleDelete(params.row.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography variant="h4">Programmes</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
          Add Programme
        </Button>
      </div>

      <Paper style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={programmes}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5, 10, 20]}
        />
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit Programme' : 'Add Programme'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Programme Name"
            placeholder="e.g., Computer Engineering"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Programme Code"
            placeholder="e.g., BCT"
            fullWidth
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          />
          <TextField
            select
            margin="dense"
            label="Department"
            fullWidth
            value={formData.department_id}
            onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
          >
            {departments.map((dept) => (
              <MenuItem key={dept.id} value={dept.id}>
                {dept.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} variant="contained">
            {editMode ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
