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
  FormControlLabel,
  Checkbox,
  Box,
  InputAdornment,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { Add as AddIcon, Edit as EditIcon, Search as SearchIcon, Refresh as RefreshIcon } from '@mui/icons-material'
import { subjectService, departmentService } from '../services'

export default function Subjects() {
  const [subjects, setSubjects] = useState([])
  const [departments, setDepartments] = useState([])
  const [open, setOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editId, setEditId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department_id: '',
    is_lab: false,
    credit_hours: 3,
    description: '',
    is_active: true,
  })
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const loadSubjects = async () => {
    setLoading(true)
    try {
      const response = await subjectService.getAll()
      console.log('Loaded subjects:', response.data) // Debug log
      setSubjects(response.data)
    } catch (error) {
      console.error('Error loading subjects:', error)
      alert('Failed to load subjects: ' + (error.response?.data?.detail || error.message))
    } finally {
      setLoading(false)
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
    loadSubjects()
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
    setFormData({ 
      name: '', 
      code: '', 
      department_id: '', 
      is_lab: false, 
      credit_hours: 3, 
      description: '', 
      is_active: true 
    })
  }

  const handleEdit = (subject) => {
    setEditMode(true)
    setEditId(subject.id)
    setFormData({
      name: subject.name,
      code: subject.code || '',
      department_id: subject.department_id || '',
      is_lab: subject.is_lab || false,
      credit_hours: subject.credit_hours || 3,
      description: subject.description || '',
      is_active: subject.is_active !== undefined ? subject.is_active : true,
    })
    setOpen(true)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      if (editMode) {
        await subjectService.update(editId, formData)
      } else {
        await subjectService.create(formData)
      }
      await loadSubjects()
      handleClose()
    } catch (error) {
      console.error('Error saving subject:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to save subject'
      alert(errorMessage)
    }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        await subjectService.delete(id)
        await loadSubjects()
      } catch (error) {
        console.error('Error deleting subject:', error)
      }
    }
  }

  // Filter subjects based on search query
  const filteredSubjects = subjects.filter((subject) => {
    if (!searchQuery) return true
    
    const query = searchQuery.toLowerCase()
    return (
      subject.name.toLowerCase().includes(query) ||
      subject.code.toLowerCase().includes(query) ||
      (subject.is_lab ? 'lab' : 'theory').includes(query) ||
      subject.credit_hours.toString().includes(query)
    )
  })

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'code', headerName: 'Code', width: 150 },
    {
      field: 'is_lab',
      headerName: 'Is Lab',
      width: 100,
      renderCell: (params) => (params.value ? 'Yes' : 'No'),
    },
    { field: 'credit_hours', headerName: 'Credit Hours', width: 130 },
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
        <Typography variant="h4">Subjects</Typography>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={loadSubjects}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
            Add Subject
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search by name, code, type (lab/theory), or credit hours..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          variant="outlined"
          size="medium"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Paper style={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filteredSubjects}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[5, 10, 20, 50]}
          loading={loading}
          disableSelectionOnClick
        />
      </Paper>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editMode ? 'Edit Subject' : 'Add Subject'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Subject Name"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Subject Code"
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
            helperText="Optional - Leave as 'Not Assigned' if not specific to a department"
          >
            <MenuItem value="">Not Assigned</MenuItem>
            {departments.map((dept) => (
              <MenuItem key={dept.id} value={dept.id}>
                {dept.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            margin="dense"
            label="Credit Hours"
            type="number"
            fullWidth
            value={formData.credit_hours}
            onChange={(e) =>
              setFormData({ ...formData, credit_hours: parseInt(e.target.value) || 0 })
            }
            inputProps={{ min: 0, max: 10 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.is_lab}
                onChange={(e) => setFormData({ ...formData, is_lab: e.target.checked })}
              />
            }
            label="Has Lab Component"
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            helperText="Optional description of the subject"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {editMode ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
