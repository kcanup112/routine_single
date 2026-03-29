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
  List,
  ListItem,
  ListItemText,
  Box,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material'
import { departmentService, teacherService } from '../services'

export default function Departments() {
  const [departments, setDepartments] = useState([])
  const [allTeachers, setAllTeachers] = useState([])
  const [open, setOpen] = useState(false)
  const [teacherDialogOpen, setTeacherDialogOpen] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState(null)
  const [availableTeachers, setAvailableTeachers] = useState([])
  const [departmentTeachers, setDepartmentTeachers] = useState([])
  const [selectedAvailable, setSelectedAvailable] = useState(null)
  const [selectedDepartment_, setSelectedDepartment_] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [editId, setEditId] = useState(null)
  const [formData, setFormData] = useState({ name: '', code: '' })
  const [loading, setLoading] = useState(false)

  const loadDepartments = async () => {
    try {
      const response = await departmentService.getAll()
      setDepartments(response.data)
    } catch (error) {
      console.error('Error loading departments:', error)
    }
  }

  const loadTeachers = async () => {
    try {
      const response = await teacherService.getAll()
      setAllTeachers(response.data)
    } catch (error) {
      console.error('Error loading teachers:', error)
    }
  }

  useEffect(() => {
    loadDepartments()
    loadTeachers()
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
    setFormData({ name: '', code: '' })
  }

  const handleEdit = (department) => {
    setEditMode(true)
    setEditId(department.id)
    setFormData({
      name: department.name,
      code: department.code,
    })
    setOpen(true)
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      if (editMode) {
        await departmentService.update(editId, formData)
      } else {
        await departmentService.create(formData)
      }
      await loadDepartments()
      handleClose()
    } catch (error) {
      console.error('Error saving department:', error)
    }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await departmentService.delete(id)
        await loadDepartments()
      } catch (error) {
        console.error('Error deleting department:', error)
      }
    }
  }

  const handleRowDoubleClick = (params) => {
    setSelectedDepartment(params.row)
    
    // Show all teachers in available list, and teachers for this department on the right
    const deptTeachers = allTeachers.filter(t => t.department_id === params.row.id)
    
    setDepartmentTeachers(deptTeachers)
    setAvailableTeachers(allTeachers) // Show all teachers
    setSelectedAvailable(null)
    setSelectedDepartment_(null)
    setTeacherDialogOpen(true)
  }

  const handleAddTeacher = async () => {
    if (!selectedAvailable) return
    
    try {
      await teacherService.update(selectedAvailable.id, {
        ...selectedAvailable,
        department_id: selectedDepartment.id
      })
      
      // Reload teachers to get updated data
      const response = await teacherService.getAll()
      const updatedTeachers = response.data
      setAllTeachers(updatedTeachers)
      
      // Update lists - keep all teachers in available list
      const deptTeachers = updatedTeachers.filter(t => t.department_id === selectedDepartment.id)
      
      setDepartmentTeachers(deptTeachers)
      setAvailableTeachers(updatedTeachers) // Keep all teachers
      setSelectedAvailable(null)
    } catch (error) {
      console.error('Error adding teacher to department:', error)
    }
  }

  const handleRemoveTeacher = async () => {
    if (!selectedDepartment_) return
    
    try {
      await teacherService.update(selectedDepartment_.id, {
        ...selectedDepartment_,
        department_id: null
      })
      
      // Reload teachers to get updated data
      const response = await teacherService.getAll()
      const updatedTeachers = response.data
      setAllTeachers(updatedTeachers)
      
      // Update lists - keep all teachers in available list
      const deptTeachers = updatedTeachers.filter(t => t.department_id === selectedDepartment.id)
      
      setDepartmentTeachers(deptTeachers)
      setAvailableTeachers(updatedTeachers) // Keep all teachers
      setSelectedDepartment_(null)
    } catch (error) {
      console.error('Error removing teacher from department:', error)
    }
  }

  const handleCloseTeacherDialog = () => {
    setTeacherDialogOpen(false)
    setSelectedDepartment(null)
    setSelectedAvailable(null)
    setSelectedDepartment_(null)
    setSearchQuery('')
    loadDepartments()
    loadTeachers()
  }

  const filterTeachers = (teachers) => {
    if (!searchQuery) return teachers
    
    const query = searchQuery.toLowerCase()
    return teachers.filter(teacher => 
      teacher.name.toLowerCase().includes(query) ||
      teacher.abbreviation.toLowerCase().includes(query)
    )
  }

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'code', headerName: 'Code', width: 150 },
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
        <Typography variant="h4">Departments</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Add Department
        </Button>
      </div>

      <Paper style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={departments}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5, 10, 20]}
          onRowDoubleClick={handleRowDoubleClick}
        />
      </Paper>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editMode ? 'Edit Department' : 'Add Department'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Department Name"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Department Code"
            fullWidth
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {editMode ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Teacher Association Dialog */}
      <Dialog 
        open={teacherDialogOpen} 
        onClose={handleCloseTeacherDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Department: {selectedDepartment?.name}
        </DialogTitle>
        <DialogContent>
          {/* Search Bar */}
          <Box sx={{ mb: 2, mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              label="Search Teacher"
              placeholder="Search by name or abbreviation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="outlined"
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, minHeight: 400 }}>
            {/* All Teachers List */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                All Teachers
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
                  {filterTeachers(availableTeachers).map((teacher) => (
                    <ListItem
                      key={teacher.id}
                      button
                      selected={selectedAvailable?.id === teacher.id}
                      onClick={() => setSelectedAvailable(teacher)}
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
                        primary={teacher.name}
                        secondary={teacher.abbreviation}
                        secondaryTypographyProps={{
                          sx: { color: selectedAvailable?.id === teacher.id ? 'white' : 'text.secondary' }
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
                onClick={handleAddTeacher}
                disabled={!selectedAvailable}
                sx={{ width: '100%' }}
              >
                ADD &gt;&gt;
              </Button>
              <Button
                variant="contained"
                onClick={handleRemoveTeacher}
                disabled={!selectedDepartment_}
                sx={{ width: '100%' }}
              >
                &lt;&lt; Remove
              </Button>
            </Box>

            {/* Department Teachers List */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                Department Teachers
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
                  {filterTeachers(departmentTeachers).map((teacher) => (
                    <ListItem
                      key={teacher.id}
                      button
                      selected={selectedDepartment_?.id === teacher.id}
                      onClick={() => setSelectedDepartment_(teacher)}
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
                        primary={teacher.name}
                        secondary={teacher.abbreviation}
                        secondaryTypographyProps={{
                          sx: { color: selectedDepartment_?.id === teacher.id ? 'white' : 'text.secondary' }
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
          <Button onClick={handleCloseTeacherDialog} variant="contained">
            OK
          </Button>
          <Button onClick={handleCloseTeacherDialog}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}
