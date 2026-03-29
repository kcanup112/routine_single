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
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Grid,
  InputAdornment,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  Subject as SubjectIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import { teacherService, departmentService, teacherSubjectService } from '../services'

export default function Teachers() {
  const [teachers, setTeachers] = useState([])
  const [departments, setDepartments] = useState([])
  const [open, setOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editId, setEditId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    abbreviation: '',
    employee_id: '',
    email: '',
    phone: '',
    designation: '',
    qualification: '',
    employment_type: 'full_time',
    max_periods_per_week: 30,
    department_id: '',
    is_active: true,
  })
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Subject management state
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState(null)
  const [assignedSubjects, setAssignedSubjects] = useState([])
  const [availableSubjects, setAvailableSubjects] = useState([])
  const [subjectLoading, setSubjectLoading] = useState(false)
  const [availableSearch, setAvailableSearch] = useState('')
  const [assignedSearch, setAssignedSearch] = useState('')

  const loadTeachers = async () => {
    try {
      const response = await teacherService.getAll()
      setTeachers(response.data)
    } catch (error) {
      console.error('Error loading teachers:', error)
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
    loadTeachers()
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
      abbreviation: '',
      employee_id: '', 
      email: '', 
      phone: '', 
      designation: '', 
      qualification: '',
      employment_type: 'full_time',
      max_periods_per_week: 30,
      department_id: '',
      is_active: true
    })
  }

  const handleEdit = (teacher) => {
    setEditMode(true)
    setEditId(teacher.id)
    setFormData({
      name: teacher.name,
      abbreviation: teacher.abbreviation || '',
      employee_id: teacher.employee_id || '',
      email: teacher.email || '',
      phone: teacher.phone || '',
      designation: teacher.designation || '',
      qualification: teacher.qualification || '',
      employment_type: teacher.employment_type || 'full_time',
      max_periods_per_week: teacher.max_periods_per_week || 30,
      department_id: teacher.department_id || '',
      is_active: teacher.is_active !== undefined ? teacher.is_active : true,
    })
    setOpen(true)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Prepare data - convert empty strings to null for optional fields
      const submitData = {
        ...formData,
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        department_id: formData.department_id === '' ? null : formData.department_id,
      }
      
      if (editMode) {
        await teacherService.update(editId, submitData)
      } else {
        await teacherService.create(submitData)
      }
      await loadTeachers()
      handleClose()
    } catch (error) {
      console.error('Error saving teacher:', error)
      // Show error details if available
      if (error.response?.data?.detail) {
        alert(`Error: ${JSON.stringify(error.response.data.detail)}`)
      }
    }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        await teacherService.delete(id)
        await loadTeachers()
      } catch (error) {
        console.error('Error deleting teacher:', error)
      }
    }
  }

  // Subject management functions
  const handleOpenSubjectDialog = async (teacher) => {
    setSelectedTeacher(teacher)
    setSubjectDialogOpen(true)
    setSubjectLoading(true)
    
    try {
      const [assignedRes, availableRes] = await Promise.all([
        teacherSubjectService.getTeacherSubjects(teacher.id),
        teacherSubjectService.getAvailableSubjects(teacher.id),
      ])
      setAssignedSubjects(assignedRes.data)
      setAvailableSubjects(availableRes.data)
    } catch (error) {
      console.error('Error loading subjects:', error)
    }
    setSubjectLoading(false)
  }

  const handleCloseSubjectDialog = () => {
    setSubjectDialogOpen(false)
    setSelectedTeacher(null)
    setAssignedSubjects([])
    setAvailableSubjects([])
    setAvailableSearch('')
    setAssignedSearch('')
  }

  const handleAssignSubject = async (subjectId) => {
    try {
      await teacherSubjectService.assignSubject(selectedTeacher.id, subjectId)
      
      // Add subject to assigned list (keep it in available list too)
      const subject = availableSubjects.find(s => s.id === subjectId)
      setAssignedSubjects([...assignedSubjects, subject])
      // Don't remove from available - subjects can be assigned to multiple teachers
    } catch (error) {
      console.error('Error assigning subject:', error)
      alert('Failed to assign subject')
    }
  }

  const handleRemoveSubject = async (subjectId) => {
    try {
      await teacherSubjectService.removeSubject(selectedTeacher.id, subjectId)
      
      // Remove subject from assigned list (keep it in available list)
      setAssignedSubjects(assignedSubjects.filter(s => s.id !== subjectId))
      // Subject stays in available list for other teachers
    } catch (error) {
      console.error('Error removing subject:', error)
      alert('Failed to remove subject')
    }
  }

  // Filter subjects based on search
  const filteredAvailableSubjects = availableSubjects.filter(subject =>
    subject.name.toLowerCase().includes(availableSearch.toLowerCase()) ||
    subject.code.toLowerCase().includes(availableSearch.toLowerCase())
  )

  const filteredAssignedSubjects = assignedSubjects.filter(subject =>
    subject.name.toLowerCase().includes(assignedSearch.toLowerCase()) ||
    subject.code.toLowerCase().includes(assignedSearch.toLowerCase())
  )

  const getDepartmentName = (departmentId) => {
    if (!departmentId) return 'Not Assigned'
    const dept = departments.find((d) => d.id === departmentId)
    return dept ? dept.name : 'Unknown'
  }

  // Filter teachers based on search query
  const filteredTeachers = teachers.filter((teacher) => {
    if (!searchQuery) return true
    
    const query = searchQuery.toLowerCase()
    return (
      teacher.name.toLowerCase().includes(query) ||
      (teacher.employee_id && teacher.employee_id.toLowerCase().includes(query)) ||
      (teacher.email && teacher.email.toLowerCase().includes(query)) ||
      (teacher.phone && teacher.phone.includes(query)) ||
      (teacher.designation && teacher.designation.toLowerCase().includes(query)) ||
      getDepartmentName(teacher.department_id).toLowerCase().includes(query)
    )
  })

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'abbreviation', headerName: 'Abbr.', width: 100 },
    { field: 'employee_id', headerName: 'Employee ID', width: 120 },
    { field: 'designation', headerName: 'Designation', width: 150 },
    {
      field: 'employment_type',
      headerName: 'Type',
      width: 110,
      renderCell: (params) => params.value === 'part_time' ? 'Part Time' : 'Full Time',
    },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'phone', headerName: 'Phone', width: 130 },
    { 
      field: 'department_id', 
      headerName: 'Department', 
      width: 150,
      renderCell: (params) => {
        if (!params.row.department_id) return 'Not Assigned'
        const dept = departments.find((d) => d.id === params.row.department_id)
        return dept ? dept.name : 'Unknown'
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 300,
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
            color="secondary" 
            size="small"
            startIcon={<SubjectIcon />}
            onClick={() => handleOpenSubjectDialog(params.row)}
          >
            Subjects
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
        <Typography variant="h4">Teachers</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
          Add Teacher
        </Button>
      </div>

      {/* Search Bar */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search by name, employee ID, email, phone, designation, or department..."
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

      <Paper style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={filteredTeachers}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5, 10, 20]}
        />
      </Paper>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editMode ? 'Edit Teacher' : 'Add Teacher'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Teacher Name"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <TextField
            margin="dense"
            label="Abbreviated Name"
            fullWidth
            value={formData.abbreviation}
            onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
            helperText="Short name shown in routine, e.g., RT for Ram Thapa"
          />
          <TextField
            margin="dense"
            label="Employee ID"
            fullWidth
            value={formData.employee_id}
            onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
            helperText="e.g., EMP001, T123"
            required
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            helperText="Optional"
          />
          <TextField
            margin="dense"
            label="Phone"
            fullWidth
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            helperText="Optional"
          />
          <TextField
            margin="dense"
            label="Designation"
            fullWidth
            value={formData.designation}
            onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
            helperText="e.g., Professor, Associate Professor, Lecturer"
          />
          <TextField
            margin="dense"
            label="Qualification"
            fullWidth
            value={formData.qualification}
            onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
            helperText="e.g., PhD, M.Tech, M.Sc"
          />
          <TextField
            select
            margin="dense"
            label="Employment Type"
            fullWidth
            value={formData.employment_type}
            onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
          >
            <MenuItem value="full_time">Full Time</MenuItem>
            <MenuItem value="part_time">Part Time</MenuItem>
          </TextField>
          <TextField
            margin="dense"
            label="Max Periods Per Week"
            type="number"
            fullWidth
            value={formData.max_periods_per_week}
            onChange={(e) => setFormData({ ...formData, max_periods_per_week: parseInt(e.target.value) || 30 })}
            helperText="Maximum teaching periods per week"
            inputProps={{ min: 1, max: 60 }}
          />
          <TextField
            select
            margin="dense"
            label="Department"
            fullWidth
            value={formData.department_id}
            onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
            helperText="Optional - Leave as 'Not Assigned' if teacher is not in a department"
          >
            <MenuItem value="">Not Assigned</MenuItem>
            {departments.map((dept) => (
              <MenuItem key={dept.id} value={dept.id}>
                {dept.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {editMode ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Subject Management Dialog */}
      <Dialog 
        open={subjectDialogOpen} 
        onClose={handleCloseSubjectDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Manage Subjects for {selectedTeacher?.name}
        </DialogTitle>
        <DialogContent>
          {subjectLoading ? (
            <Typography>Loading subjects...</Typography>
          ) : (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Available Subjects */}
              <Grid item xs={5}>
                <Paper elevation={2} sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Available Subjects
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search subjects..."
                    value={availableSearch}
                    onChange={(e) => setAvailableSearch(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {filteredAvailableSubjects.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        {availableSearch ? 'No subjects found' : 'No available subjects'}
                      </Typography>
                    ) : (
                      filteredAvailableSubjects.map((subject) => (
                        <ListItem
                          key={subject.id}
                          secondaryAction={
                            <IconButton
                              edge="end"
                              color="primary"
                              onClick={() => handleAssignSubject(subject.id)}
                              title="Assign to teacher"
                            >
                              <ArrowForwardIcon />
                            </IconButton>
                          }
                        >
                          <ListItemText
                            primary={subject.name}
                            secondary={subject.code}
                          />
                        </ListItem>
                      ))
                    )}
                  </List>
                </Paper>
              </Grid>

              {/* Center divider */}
              <Grid item xs={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Click arrows to<br/>add or remove
                  </Typography>
                </Box>
              </Grid>

              {/* Assigned Subjects */}
              <Grid item xs={5}>
                <Paper elevation={2} sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                  <Typography variant="h6" gutterBottom>
                    Assigned Subjects
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search subjects..."
                    value={assignedSearch}
                    onChange={(e) => setAssignedSearch(e.target.value)}
                    sx={{ 
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'white',
                      }
                    }}
                  />
                  <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {filteredAssignedSubjects.length === 0 ? (
                      <Typography variant="body2">
                        {assignedSearch ? 'No subjects found' : 'No subjects assigned'}
                      </Typography>
                    ) : (
                      filteredAssignedSubjects.map((subject) => (
                        <ListItem
                          key={subject.id}
                          secondaryAction={
                            <IconButton
                              edge="end"
                              onClick={() => handleRemoveSubject(subject.id)}
                              title="Remove from teacher"
                              sx={{ color: 'primary.contrastText' }}
                            >
                              <ArrowBackIcon />
                            </IconButton>
                          }
                        >
                          <ListItemText
                            primary={subject.name}
                            secondary={subject.code}
                            sx={{ color: 'primary.contrastText' }}
                          />
                        </ListItem>
                      ))
                    )}
                  </List>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSubjectDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
