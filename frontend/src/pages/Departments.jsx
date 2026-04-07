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
  IconButton,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material'
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
      width: 250,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <IconButton size="small" onClick={() => handleRowDoubleClick({ row: params.row })} title="Add Teacher" sx={{ color: '#1976d2', backgroundColor: '#1976d218', borderRadius: '8px', p: '5px', '&:hover': { backgroundColor: '#1976d230' } }}>
            <PersonAddIcon fontSize="small" />
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
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a2332', mb: 0.25 }}>Departments</Typography>
          <Typography variant="body2" sx={{ color: '#8896a4' }}>Manage departments and teacher assignments</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen} sx={{ borderRadius: '10px', px: 2.5, textTransform: 'none', fontWeight: 600, backgroundColor: '#2d6a6f', boxShadow: 'none', '&:hover': { backgroundColor: '#235558', boxShadow: 'none' } }}>
          Add Department
        </Button>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid #e8edf2', borderRadius: '16px', overflow: 'hidden' }}>
        <DataGrid
          rows={departments}
          columns={columns}
          pageSize={5}
          rowsPerPageOptions={[5, 10, 20]}
          onRowDoubleClick={handleRowDoubleClick}
          autoHeight
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f8fafc', borderBottom: '1px solid #e8edf2' }, '& .MuiDataGrid-cell': { borderColor: '#f0f4f8', fontSize: '0.87rem' }, '& .MuiDataGrid-row:hover': { backgroundColor: '#f8fafc' }, '& .MuiDataGrid-footerContainer': { borderTop: '1px solid #e8edf2', backgroundColor: '#fafcfe' } }}
        />
      </Paper>

      <Dialog open={open} onClose={handleClose} PaperProps={{ sx: { borderRadius: '16px' } }}>
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
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} sx={{ borderRadius: '8px', textTransform: 'none' }}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} sx={{ borderRadius: '8px', textTransform: 'none', color: '#2d6a6f', fontWeight: 600 }}>
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
        PaperProps={{ sx: { borderRadius: '16px' } }}
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
                          backgroundColor: '#2d6a6f',
                          color: 'white',
                          '&:hover': { backgroundColor: '#235558' }
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
                sx={{ width: '100%', borderRadius: '8px', textTransform: 'none', backgroundColor: '#2d6a6f', '&:hover': { backgroundColor: '#235558' }, boxShadow: 'none' }}
              >
                ADD →
              </Button>
              <Button
                variant="contained"
                onClick={handleRemoveTeacher}
                disabled={!selectedDepartment_}
                sx={{ width: '100%', borderRadius: '8px', textTransform: 'none', backgroundColor: '#ef4444', '&:hover': { backgroundColor: '#dc2626' }, boxShadow: 'none' }}
              >
                ← Remove
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
                          backgroundColor: '#2d6a6f',
                          color: 'white',
                          '&:hover': { backgroundColor: '#235558' }
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
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseTeacherDialog} variant="contained" sx={{ borderRadius: '8px', textTransform: 'none', backgroundColor: '#2d6a6f', boxShadow: 'none', '&:hover': { backgroundColor: '#235558' } }}>
            OK
          </Button>
          <Button onClick={handleCloseTeacherDialog} sx={{ borderRadius: '8px', textTransform: 'none' }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
