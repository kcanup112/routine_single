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
  Box,
  IconButton,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { classService, semesterService, departmentService, roomService, api } from '../services'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'

export default function Classes() {
  const [classes, setClasses] = useState([])
  const [semesters, setSemesters] = useState([])
  const [departments, setDepartments] = useState([])
  const [rooms, setRooms] = useState([])
  const [shifts, setShifts] = useState([])
  const [open, setOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editId, setEditId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    section: '',
    semester_id: '',
    shift_id: '',
    department_id: '',
    room_no: '',
    effective_date: null,
  })
  const [loading, setLoading] = useState(false)

  const loadClasses = async () => {
    try {
      const response = await classService.getAll()
      // Enrich class data with semester, department, and shift names
      const enrichedClasses = response.data.map(cls => {
        const semester = semesters.find(s => s.id === cls.semester_id)
        const department = departments.find(d => d.id === cls.department_id)
        const shift = shifts.find(sh => sh.id === cls.shift_id)
        return {
          ...cls,
          semester_name: semester?.name || 'N/A',
          department_name: department?.name || 'N/A',
          shift_name: shift?.name || 'No Shift',
        }
      })
      setClasses(enrichedClasses)
    } catch (error) {
      console.error('Error loading classes:', error)
    }
  }

  const loadSemesters = async () => {
    try {
      const response = await semesterService.getAll()
      setSemesters(response.data)
    } catch (error) {
      console.error('Error loading semesters:', error)
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

  const loadRooms = async () => {
    try {
      const response = await roomService.getAll()
      setRooms(response.data)
    } catch (error) {
      console.error('Error loading rooms:', error)
    }
  }

  const loadShifts = async () => {
    try {
      const response = await api.get('/shifts/')
      setShifts(response.data.filter(s => s.is_active))
    } catch (error) {
      console.error('Error loading shifts:', error)
    }
  }

  useEffect(() => {
    loadDepartments()
    loadSemesters()
    loadRooms()
    loadShifts()
  }, [])

  useEffect(() => {
    if (semesters.length > 0 && departments.length > 0 && shifts.length >= 0) {
      loadClasses()
    }
  }, [semesters, departments, shifts])

  const handleOpen = () => {
    setEditMode(false)
    setEditId(null)
    setFormData({
      name: '',
      section: '',
      semester_id: '',
      shift_id: '',
      department_id: '',
      room_no: '',
      effective_date: null,
    })
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditMode(false)
    setEditId(null)
    setFormData({
      name: '',
      section: '',
      semester_id: '',
      shift_id: '',
      department_id: '',
      room_no: '',
      effective_date: null,
    })
  }

  const handleEdit = (classData) => {
    setEditMode(true)
    setEditId(classData.id)
    setFormData({
      name: classData.name,
      section: classData.section,
      semester_id: classData.semester_id || '',
      shift_id: classData.shift_id || '',
      department_id: classData.department_id || '',
      room_no: classData.room_no || '',
      effective_date: classData.effective_date ? new Date(classData.effective_date) : null,
    })
    setOpen(true)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const submitData = {
        ...formData,
        effective_date: formData.effective_date 
          ? formData.effective_date.toISOString().split('T')[0]
          : null,
      }
      
      if (editMode) {
        await classService.update(editId, submitData)
      } else {
        await classService.create(submitData)
      }
      await loadClasses()
      handleClose()
    } catch (error) {
      console.error('Error saving class:', error)
      alert('Error saving class. Please check all fields.')
    }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        await classService.delete(id)
        await loadClasses()
      } catch (error) {
        console.error('Error deleting class:', error)
      }
    }
  }

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Class Name', width: 200 },
    { field: 'section', headerName: 'Section', width: 100 },
    { field: 'semester_name', headerName: 'Semester', width: 150 },
    { field: 'department_name', headerName: 'Department', width: 150 },
    { field: 'shift_name', headerName: 'Shift', width: 130 },
    { field: 'room_no', headerName: 'Room No.', width: 120 },
    { field: 'effective_date', headerName: 'Effective Date', width: 130 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
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
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a2332', mb: 0.25 }}>Classes</Typography>
          <Typography variant="body2" sx={{ color: '#8896a4' }}>Manage class groups, sections and room assignments</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen} sx={{ borderRadius: '10px', px: 2.5, textTransform: 'none', fontWeight: 600, backgroundColor: '#2d6a6f', boxShadow: 'none', '&:hover': { backgroundColor: '#235558', boxShadow: 'none' } }}>
          Add Class
        </Button>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid #e8edf2', borderRadius: '16px', overflow: 'hidden' }}>
        <DataGrid
          rows={classes}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10]}
          disableSelectionOnClick
          autoHeight
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f8fafc', borderBottom: '1px solid #e8edf2' }, '& .MuiDataGrid-cell': { borderColor: '#f0f4f8', fontSize: '0.87rem' }, '& .MuiDataGrid-row:hover': { backgroundColor: '#f8fafc' }, '& .MuiDataGrid-footerContainer': { borderTop: '1px solid #e8edf2', backgroundColor: '#fafcfe' } }}
        />
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle>{editMode ? 'Edit Class' : 'Add New Class'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Class Name"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Section"
            fullWidth
            value={formData.section}
            onChange={(e) => setFormData({ ...formData, section: e.target.value })}
            placeholder="e.g., A, B, C"
            sx={{ mb: 2 }}
          />

          <TextField
            select
            margin="dense"
            label="Department"
            fullWidth
            value={formData.department_id}
            onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
            sx={{ mb: 2 }}
          >
            {departments.map((dept) => (
              <MenuItem key={dept.id} value={dept.id}>
                {dept.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            margin="dense"
            label="Semester"
            fullWidth
            value={formData.semester_id}
            onChange={(e) => setFormData({ ...formData, semester_id: e.target.value })}
            sx={{ mb: 2 }}
          >
            {semesters.map((semester) => (
              <MenuItem key={semester.id} value={semester.id}>
                {semester.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            margin="dense"
            label="Shift"
            fullWidth
            value={formData.shift_id}
            onChange={(e) => setFormData({ ...formData, shift_id: e.target.value })}
            sx={{ mb: 2 }}
            helperText="Select the shift for this class. Periods will be filtered based on this shift."
          >
            <MenuItem value="">
              <em>No Shift (Show all periods)</em>
            </MenuItem>
            {shifts.map((shift) => (
              <MenuItem key={shift.id} value={shift.id}>
                {shift.name} ({shift.start_time} - {shift.end_time})
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            margin="dense"
            label="Room Number"
            fullWidth
            value={formData.room_no}
            onChange={(e) => setFormData({ ...formData, room_no: e.target.value })}
            sx={{ mb: 2 }}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {(() => {
              const grouped = {}
              rooms.forEach(r => {
                const bld = r.building || 'Other'
                if (!grouped[bld]) grouped[bld] = []
                grouped[bld].push(r)
              })
              return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).flatMap(([building, bldRooms]) => [
                <MenuItem key={`header-${building}`} disabled sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  {building}
                </MenuItem>,
                ...bldRooms.map(room => (
                  <MenuItem key={room.id} value={room.room_number} sx={{ pl: 4 }}>
                    {room.room_number}{room.name ? ` - ${room.name}` : ''}
                  </MenuItem>
                ))
              ])
            })()}
          </TextField>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Effective Date"
              value={formData.effective_date}
              onChange={(newValue) => setFormData({ ...formData, effective_date: newValue })}
              renderInput={(params) => <TextField {...params} fullWidth margin="dense" />}
              slotProps={{ textField: { fullWidth: true, margin: 'dense' } }}
            />
          </LocalizationProvider>
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
