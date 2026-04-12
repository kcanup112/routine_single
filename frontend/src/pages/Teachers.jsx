import { useState, useEffect, useRef } from 'react'
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
  Alert,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  ArrowForward as ArrowForwardIcon,
  ArrowBack as ArrowBackIcon,
  Subject as SubjectIcon,
  Search as SearchIcon,
  CloudUpload as CloudUploadIcon,
  Download as DownloadIcon,
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
    account_role: 'viewer',
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
  const csvInputRef = useRef(null)
  const [csvImportOpen, setCsvImportOpen] = useState(false)
  const [csvProcessing, setCsvProcessing] = useState(false)
  const [csvResults, setCsvResults] = useState(null)

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
      is_active: true,
      account_role: 'viewer',
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

  // State for temp password alert
  const [tempPasswordInfo, setTempPasswordInfo] = useState(null)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Prepare data - convert empty strings to null for optional fields
      const { account_role, ...rest } = formData
      const submitData = {
        ...rest,
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        department_id: formData.department_id === '' ? null : formData.department_id,
      }
      
      if (editMode) {
        await teacherService.update(editId, submitData)
      } else {
        const response = await teacherService.create(submitData, account_role)
        const data = response.data
        // Show default password info if account was auto-created
        if (data.temp_password) {
          setTempPasswordInfo({
            name: data.name,
            email: data.email,
          })
        }
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

  const parseCSV = (text) => {
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    return lines.slice(1).filter(l => l.trim()).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      const obj = {}
      headers.forEach((h, i) => { obj[h] = values[i] || '' })
      return obj
    })
  }

  const handleDownloadTeacherTemplate = () => {
    const headers = 'name,abbreviation,employee_id,email,phone,designation,qualification,employment_type,max_periods_per_week,department_name'
    const example = 'Ram Thapa,RT,EMP001,ram@example.com,9800000001,Lecturer,M.Tech,full_time,30,Computer'
    const csv = headers + '\n' + example
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'teachers_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCsvImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''
    setCsvProcessing(true)
    setCsvResults(null)
    setCsvImportOpen(true)
    try {
      const text = await file.text()
      const rows = parseCSV(text)
      let success = 0
      const errors = []
      for (const row of rows) {
        try {
          const dept = departments.find(d => d.name.toLowerCase() === (row.department_name || '').toLowerCase())
          const data = {
            name: row.name,
            abbreviation: row.abbreviation || null,
            employee_id: row.employee_id,
            email: row.email || null,
            phone: row.phone || null,
            designation: row.designation || null,
            qualification: row.qualification || null,
            employment_type: row.employment_type || 'full_time',
            max_periods_per_week: parseInt(row.max_periods_per_week) || 30,
            department_id: dept ? dept.id : null,
            is_active: true,
          }
          await teacherService.create(data)
          success++
        } catch (err) {
          errors.push(`"${row.name}": ${err.response?.data?.detail || err.message}`)
        }
      }
      setCsvResults({ success, errors })
      await loadTeachers()
    } catch (err) {
      setCsvResults({ success: 0, errors: [`Failed to parse file: ${err.message}`] })
    }
    setCsvProcessing(false)
  }

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
      field: 'has_account',
      headerName: 'Account',
      width: 100,
      renderCell: (params) => params.row.has_account ? (
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: '#10b981', fontSize: '0.75rem', fontWeight: 600 }}>
          ✓ Active
        </Box>
      ) : (
        <Box sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>No account</Box>
      ),
    },
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
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <IconButton size="small" onClick={() => handleEdit(params.row)} sx={{ color: '#2d6a6f', backgroundColor: '#2d6a6f18', borderRadius: '8px', p: '5px', '&:hover': { backgroundColor: '#2d6a6f30' } }}>
            <EditIcon fontSize="small" />
          </IconButton>
          <Button size="small" variant="outlined" startIcon={<SubjectIcon />} onClick={() => handleOpenSubjectDialog(params.row)} sx={{ borderRadius: '8px', textTransform: 'none', fontSize: '0.75rem', px: 1.2, py: 0.3, borderColor: '#8b5cf618', color: '#8b5cf6', backgroundColor: '#8b5cf608', '&:hover': { borderColor: '#8b5cf6', backgroundColor: '#8b5cf612' } }}>
            Subjects
          </Button>
          <IconButton size="small" onClick={() => handleDelete(params.row.id)} sx={{ color: '#ef4444', backgroundColor: '#ef444418', borderRadius: '8px', p: '5px', '&:hover': { backgroundColor: '#ef444430' } }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ]

  return (
    <Box>
      {/* Temp password alert after teacher creation */}
      {tempPasswordInfo && (
        <Alert 
          severity="info" 
          sx={{ mb: 2 }}
          onClose={() => setTempPasswordInfo(null)}
        >
          <strong>Viewer account created for {tempPasswordInfo.name}</strong><br />
          Email: <strong>{tempPasswordInfo.email}</strong><br />
          Default Password: <strong>kec123</strong><br />
          <em>Teachers can change their password from the dashboard after logging in.</em>
        </Alert>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a2332', mb: 0.25 }}>Teachers</Typography>
          <Typography variant="body2" sx={{ color: '#8896a4' }}>Manage teaching staff, designations and subject assignments</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadTeacherTemplate} sx={{ borderRadius: '10px', px: 2, textTransform: 'none', fontWeight: 600, borderColor: '#e8edf2', color: '#2d6a6f', '&:hover': { borderColor: '#2d6a6f', backgroundColor: '#2d6a6f10' } }}>
            Template
          </Button>
          <Button variant="outlined" startIcon={<CloudUploadIcon />} onClick={() => csvInputRef.current.click()} sx={{ borderRadius: '10px', px: 2, textTransform: 'none', fontWeight: 600, borderColor: '#e8edf2', color: '#2d6a6f', '&:hover': { borderColor: '#2d6a6f', backgroundColor: '#2d6a6f10' } }}>
            Import CSV
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen} sx={{ borderRadius: '10px', px: 2.5, textTransform: 'none', fontWeight: 600, backgroundColor: '#2d6a6f', boxShadow: 'none', '&:hover': { backgroundColor: '#235558', boxShadow: 'none' } }}>
            Add Teacher
          </Button>
        </Box>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search by name, employee ID, email, phone, designation, or department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          variant="outlined"
          size="medium"
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', backgroundColor: '#ffffff' } }}
          InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ color: '#a0aec0' }} /></InputAdornment>) }}
        />
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid #e8edf2', borderRadius: '16px', overflow: 'hidden' }}>
        <DataGrid
          rows={filteredTeachers}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5, 10, 20]}
          autoHeight
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f8fafc', borderBottom: '1px solid #e8edf2' }, '& .MuiDataGrid-cell': { borderColor: '#f0f4f8', fontSize: '0.87rem' }, '& .MuiDataGrid-row:hover': { backgroundColor: '#f8fafc' }, '& .MuiDataGrid-footerContainer': { borderTop: '1px solid #e8edf2', backgroundColor: '#fafcfe' } }}
        />
      </Paper>

      <Dialog open={open} onClose={handleClose} PaperProps={{ sx: { borderRadius: '16px' } }}>
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
          {!editMode && (
            <TextField
              select
              margin="dense"
              label="Account Role"
              fullWidth
              value={formData.account_role}
              onChange={(e) => setFormData({ ...formData, account_role: e.target.value })}
              helperText="Role for the auto-created login account (requires email)"
            >
              <MenuItem value="viewer">Viewer (Read-only)</MenuItem>
              <MenuItem value="admin">Admin (Full access)</MenuItem>
            </TextField>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} sx={{ borderRadius: '8px', textTransform: 'none' }}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} sx={{ borderRadius: '8px', textTransform: 'none', color: '#2d6a6f', fontWeight: 600 }}>
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
        PaperProps={{ sx: { borderRadius: '16px' } }}
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
                <Paper elevation={0} sx={{ p: 2, bgcolor: '#2d6a6f', borderRadius: '12px' }}>
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
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseSubjectDialog} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}>Close</Button>
        </DialogActions>
      </Dialog>

      <input type="file" accept=".csv" ref={csvInputRef} onChange={handleCsvImport} style={{ display: 'none' }} />

      <Dialog open={csvImportOpen} onClose={() => !csvProcessing && setCsvImportOpen(false)} PaperProps={{ sx: { borderRadius: '16px', minWidth: 420 } }}>
        <DialogTitle>CSV Import Results</DialogTitle>
        <DialogContent>
          {csvProcessing ? (
            <Typography sx={{ py: 1 }}>Importing teachers, please wait...</Typography>
          ) : csvResults ? (
            <Box>
              <Typography sx={{ color: '#16a34a', fontWeight: 600, mb: 0.5 }}>✓ {csvResults.success} teacher(s) imported successfully</Typography>
              {csvResults.errors.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography sx={{ color: '#ef4444', fontWeight: 600, mb: 0.5 }}>✗ {csvResults.errors.length} row(s) failed:</Typography>
                  {csvResults.errors.map((err, i) => (
                    <Typography key={i} variant="body2" sx={{ color: '#ef4444', mt: 0.5, pl: 1, fontSize: '0.8rem' }}>{err}</Typography>
                  ))}
                </Box>
              )}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCsvImportOpen(false)} disabled={csvProcessing} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, color: '#2d6a6f' }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
