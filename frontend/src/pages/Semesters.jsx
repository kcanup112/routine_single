import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
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
  List,
  ListItem,
  ListItemText,
  Box,
  IconButton,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, LibraryAdd as LibraryAddIcon } from '@mui/icons-material'
import { semesterService, programmeService, subjectService, semesterSubjectService, departmentService } from '../services'

export default function Semesters() {
  const { isSchool } = useAuth()
  const school = isSchool()
  const [semesters, setSemesters] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [departments, setDepartments] = useState([])
  const [allSubjects, setAllSubjects] = useState([])
  const [open, setOpen] = useState(false)
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false)
  const [selectedSemester, setSelectedSemester] = useState(null)
  const [availableSubjects, setAvailableSubjects] = useState([])
  const [semesterSubjects, setSemesterSubjects] = useState([])
  const [selectedAvailable, setSelectedAvailable] = useState(null)
  const [selectedSemester_, setSelectedSemester_] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [editId, setEditId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    semester_number: 1,
    programme_id: '',
    department_id: '',  // used in school mode
    is_active: true,
  })
  const [loading, setLoading] = useState(false)

  const loadSemesters = async () => {
    try {
      const response = await semesterService.getAll()
      setSemesters(response.data)
    } catch (error) {
      console.error('Error loading semesters:', error)
    }
  }

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

  const loadSubjects = async () => {
    try {
      const response = await subjectService.getAll()
      setAllSubjects(response.data)
    } catch (error) {
      console.error('Error loading subjects:', error)
    }
  }

  useEffect(() => {
    loadSemesters()
    loadSubjects()
    if (school) {
      loadDepartments()
      loadProgrammes()  // needed for department name lookup in column renderer
    } else {
      loadProgrammes()
    }
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
    setFormData({ name: '', semester_number: 1, programme_id: '', department_id: '', is_active: true })
  }

  const handleEdit = (semester) => {
    setEditMode(true)
    setEditId(semester.id)
    setFormData({
      name: semester.name,
      semester_number: semester.semester_number,
      programme_id: semester.programme_id || '',
      department_id: '',
      is_active: semester.is_active,
    })
    setOpen(true)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Build payload — school mode sends department_id; engineering sends programme_id
      const payload = {
        name: formData.name,
        semester_number: formData.semester_number,
        is_active: formData.is_active,
        ...(school
          ? { department_id: formData.department_id }
          : { programme_id: formData.programme_id }),
      }
      if (editMode) {
        await semesterService.update(editId, payload)
      } else {
        await semesterService.create(payload)
      }
      await loadSemesters()
      handleClose()
    } catch (error) {
      console.error('Error saving semester:', error)
    }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (window.confirm(`Are you sure you want to delete this ${school ? 'class' : 'semester'}?`)) {
      try {
        await semesterService.delete(id)
        await loadSemesters()
      } catch (error) {
        console.error('Error deleting semester:', error)
      }
    }
  }

  const handleRowDoubleClick = async (params) => {
    setSelectedSemester(params.row)
    
    try {
      // Get subjects already in this semester
      const response = await semesterSubjectService.getSemesterSubjects(params.row.id)
      const semSubjects = response.data
      
      // Show all subjects in available list
      setSemesterSubjects(semSubjects)
      setAvailableSubjects(allSubjects) // Keep all subjects
      setSelectedAvailable(null)
      setSelectedSemester_(null)
      setSearchQuery('')
      setSubjectDialogOpen(true)
    } catch (error) {
      console.error('Error loading semester subjects:', error)
    }
  }

  const handleAddSubject = async () => {
    if (!selectedAvailable) return
    
    try {
      await semesterSubjectService.addSubject(selectedSemester.id, selectedAvailable.id)
      
      // Reload subjects for this semester
      const response = await semesterSubjectService.getSemesterSubjects(selectedSemester.id)
      const semSubjects = response.data
      
      setSemesterSubjects(semSubjects)
      setAvailableSubjects(allSubjects) // Keep all subjects
      setSelectedAvailable(null)
    } catch (error) {
      console.error('Error adding subject to semester:', error)
      alert('Error adding subject. It may already be in the semester.')
    }
  }

  const handleRemoveSubject = async () => {
    if (!selectedSemester_) return
    
    try {
      await semesterSubjectService.removeSubject(selectedSemester.id, selectedSemester_.id)
      
      // Reload subjects for this semester
      const response = await semesterSubjectService.getSemesterSubjects(selectedSemester.id)
      const semSubjects = response.data
      
      setSemesterSubjects(semSubjects)
      setAvailableSubjects(allSubjects) // Keep all subjects
      setSelectedSemester_(null)
    } catch (error) {
      console.error('Error removing subject from semester:', error)
    }
  }

  const handleCloseSubjectDialog = () => {
    setSubjectDialogOpen(false)
    setSelectedSemester(null)
    setSelectedAvailable(null)
    setSelectedSemester_(null)
    setSearchQuery('')
  }

  const filterSubjects = (subjects) => {
    if (!searchQuery) return subjects
    
    const query = searchQuery.toLowerCase()
    return subjects.filter(subject => 
      subject.name.toLowerCase().includes(query) ||
      subject.code.toLowerCase().includes(query)
    )
  }

  const getProgrammeName = (programmeId) => {
    const prog = programmes.find(p => p.id === programmeId)
    return prog ? `${prog.code} - ${prog.name}` : 'N/A'
  }

  const getDepartmentName = (programmeId) => {
    // For school mode: resolve department via the programme
    const prog = programmes.find(p => p.id === programmeId)
    if (!prog) return 'N/A'
    const dept = departments.find(d => d.id === prog.department_id)
    return dept ? dept.name : 'N/A'
  }

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: school ? 'Class' : 'Semester', width: 150 },
    { field: 'semester_number', headerName: school ? 'Class No.' : 'Semester #', width: 120 },
    {
      field: 'programme_id',
      headerName: school ? 'Department' : 'Programme',
      width: 250,
      renderCell: (params) => school ? getDepartmentName(params.value) : getProgrammeName(params.value),
    },
    {
      field: 'is_active',
      headerName: 'Active',
      width: 100,
      renderCell: (params) => (params.value ? 'Yes' : 'No'),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 250,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <IconButton size="small" onClick={() => handleRowDoubleClick({ row: params.row })} title={school ? 'Add Subject' : 'Add Subject'} sx={{ color: '#1976d2', backgroundColor: '#1976d218', borderRadius: '8px', p: '5px', '&:hover': { backgroundColor: '#1976d230' } }}>
            <LibraryAddIcon fontSize="small" />
          </IconButton>
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
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a2332', mb: 0.25 }}>{school ? 'Classes' : 'Semesters'}</Typography>
          <Typography variant="body2" sx={{ color: '#8896a4' }}>Manage {school ? 'classes' : 'semesters'} and subject assignments</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen} sx={{ borderRadius: '10px', px: 2.5, textTransform: 'none', fontWeight: 600, backgroundColor: '#2d6a6f', boxShadow: 'none', '&:hover': { backgroundColor: '#235558', boxShadow: 'none' } }}>
          Add {school ? 'Class' : 'Semester'}
        </Button>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid #e8edf2', borderRadius: '16px', overflow: 'hidden' }}>
        <DataGrid
          rows={semesters}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5, 10, 20]}
          onRowDoubleClick={handleRowDoubleClick}
          autoHeight
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f8fafc', borderBottom: '1px solid #e8edf2' }, '& .MuiDataGrid-cell': { borderColor: '#f0f4f8', fontSize: '0.87rem' }, '& .MuiDataGrid-row:hover': { backgroundColor: '#f8fafc' }, '& .MuiDataGrid-footerContainer': { borderTop: '1px solid #e8edf2', backgroundColor: '#fafcfe' } }}
        />
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle>{editMode ? `Edit ${school ? 'Class' : 'Semester'}` : `Add ${school ? 'Class' : 'Semester'}`}</DialogTitle>
        <DialogContent>
          {school ? (
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
          ) : (
            <TextField
              select
              margin="dense"
              label="Programme"
              fullWidth
              value={formData.programme_id}
              onChange={(e) => setFormData({ ...formData, programme_id: e.target.value })}
            >
              {programmes.map((prog) => (
                <MenuItem key={prog.id} value={prog.id}>
                  {prog.code} - {prog.name}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            autoFocus
            margin="dense"
            label={school ? 'Class Name' : 'Semester Name'}
            placeholder={school ? 'e.g., Grade 8' : 'e.g., BCT I/I'}
            fullWidth
            helperText={school ? 'Name of the class/grade' : 'Format: [Programme Code] [Year]/[Part] (e.g., BCT I/I, BCT I/II, BCT II/I)'}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label={school ? 'Class Number' : 'Semester Number'}
            type="number"
            fullWidth
            helperText={school ? 'Grade/class order number' : '1 for I/I, 2 for I/II, 3 for II/I, etc.'}
            value={formData.semester_number}
            onChange={(e) =>
              setFormData({ ...formData, semester_number: parseInt(e.target.value) })
            }
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
            }
            label={school ? 'Active Class' : 'Active Semester'}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} sx={{ borderRadius: '8px', textTransform: 'none' }}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} variant="contained" sx={{ borderRadius: '8px', textTransform: 'none', backgroundColor: '#2d6a6f', boxShadow: 'none', '&:hover': { backgroundColor: '#235558' } }}>
            {editMode ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Subject Association Dialog */}
      <Dialog 
        open={subjectDialogOpen} 
        onClose={handleCloseSubjectDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle>
          Semester: {selectedSemester?.name}
        </DialogTitle>
        <DialogContent>
          {/* Search Bar */}
          <Box sx={{ mb: 2, mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              label="Search Subject"
              placeholder="Search by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="outlined"
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, minHeight: 400 }}>
            {/* All Subjects List */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                All Subjects
              </Typography>
              <Paper 
                variant="outlined" 
                sx={{ 
                  height: 350, 
                  overflow: 'auto',
                  border: '1px solid #ccc'
                }}
              >
                <List dense>
                  {filterSubjects(availableSubjects).map((subject) => (
                    <ListItem
                      key={subject.id}
                      button
                      selected={selectedAvailable?.id === subject.id}
                      onClick={() => setSelectedAvailable(subject)}
                      sx={{
                        '&.Mui-selected': {
                          backgroundColor: '#2d6a6f',
                          color: 'white',
                          '&:hover': { backgroundColor: '#235558' }
                        }
                      }}
                    >
                      <ListItemText 
                        primary={subject.name}
                        secondary={`${subject.code} - ${subject.is_lab ? 'Lab' : 'Theory'}`}
                        secondaryTypographyProps={{
                          sx: { color: selectedAvailable?.id === subject.id ? 'white' : 'text.secondary' }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Box>

            {/* Add/Remove Buttons */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center',
              gap: 2,
              minWidth: 120
            }}>
              <Button
                variant="contained"
                onClick={handleAddSubject}
                disabled={!selectedAvailable}
                sx={{ width: '100%', borderRadius: '8px', textTransform: 'none', backgroundColor: '#2d6a6f', '&:hover': { backgroundColor: '#235558' }, boxShadow: 'none' }}
              >
                ADD →
              </Button>
              <Button
                variant="contained"
                onClick={handleRemoveSubject}
                disabled={!selectedSemester_}
                sx={{ width: '100%', borderRadius: '8px', textTransform: 'none', backgroundColor: '#ef4444', '&:hover': { backgroundColor: '#dc2626' }, boxShadow: 'none' }}
              >
                ← Remove
              </Button>
            </Box>

            {/* Semester Subjects List */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                Semester Subjects
              </Typography>
              <Paper 
                variant="outlined" 
                sx={{ 
                  height: 350, 
                  overflow: 'auto',
                  border: '1px solid #ccc'
                }}
              >
                <List dense>
                  {filterSubjects(semesterSubjects).map((subject) => (
                    <ListItem
                      key={subject.id}
                      button
                      selected={selectedSemester_?.id === subject.id}
                      onClick={() => setSelectedSemester_(subject)}
                      sx={{
                        '&.Mui-selected': {
                          backgroundColor: '#2d6a6f',
                          color: 'white',
                          '&:hover': { backgroundColor: '#235558' }
                        }
                      }}
                    >
                      <ListItemText 
                        primary={subject.name}
                        secondary={`${subject.code} - ${subject.is_lab ? 'Lab' : 'Theory'}`}
                        secondaryTypographyProps={{
                          sx: { color: selectedSemester_?.id === subject.id ? 'white' : 'text.secondary' }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseSubjectDialog} variant="contained" sx={{ borderRadius: '8px', textTransform: 'none', backgroundColor: '#2d6a6f', boxShadow: 'none', '&:hover': { backgroundColor: '#235558' } }}>
            OK
          </Button>
          <Button onClick={handleCloseSubjectDialog} sx={{ borderRadius: '8px', textTransform: 'none' }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
