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
  List,
  ListItem,
  ListItemText,
  Box,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material'
import { semesterService, programmeService, subjectService, semesterSubjectService } from '../services'

export default function Semesters() {
  const [semesters, setSemesters] = useState([])
  const [programmes, setProgrammes] = useState([])
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
    loadProgrammes()
    loadSubjects()
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
    setFormData({ name: '', semester_number: 1, programme_id: '', is_active: true })
  }

  const handleEdit = (semester) => {
    setEditMode(true)
    setEditId(semester.id)
    setFormData({
      name: semester.name,
      semester_number: semester.semester_number,
      programme_id: semester.programme_id || '',
      is_active: semester.is_active,
    })
    setOpen(true)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      if (editMode) {
        await semesterService.update(editId, formData)
      } else {
        await semesterService.create(formData)
      }
      await loadSemesters()
      handleClose()
    } catch (error) {
      console.error('Error saving semester:', error)
    }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this semester?')) {
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

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Semester', width: 150 },
    { field: 'semester_number', headerName: 'Semester #', width: 120 },
    {
      field: 'programme_id',
      headerName: 'Programme',
      width: 250,
      renderCell: (params) => getProgrammeName(params.value),
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
        <Typography variant="h4">Semesters</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
          Add Semester
        </Button>
      </div>

      <Paper style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={semesters}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5, 10, 20]}
          onRowDoubleClick={handleRowDoubleClick}
        />
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit Semester' : 'Add Semester'}</DialogTitle>
        <DialogContent>
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
          <TextField
            autoFocus
            margin="dense"
            label="Semester Name"
            placeholder="e.g., BCT I/I"
            fullWidth
            helperText="Format: [Programme Code] [Year]/[Part] (e.g., BCT I/I, BCT I/II, BCT II/I)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Semester Number"
            type="number"
            fullWidth
            helperText="1 for I/I, 2 for I/II, 3 for II/I, etc."
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
            label="Active Semester"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} variant="contained">
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
                          backgroundColor: '#1976d2',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: '#1565c0',
                          }
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
                sx={{ width: '100%' }}
              >
                ADD &gt;&gt;
              </Button>
              <Button
                variant="contained"
                onClick={handleRemoveSubject}
                disabled={!selectedSemester_}
                sx={{ width: '100%' }}
              >
                &lt;&lt; Remove
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
                          backgroundColor: '#1976d2',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: '#1565c0',
                          }
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
        <DialogActions>
          <Button onClick={handleCloseSubjectDialog} variant="contained">
            OK
          </Button>
          <Button onClick={handleCloseSubjectDialog}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
