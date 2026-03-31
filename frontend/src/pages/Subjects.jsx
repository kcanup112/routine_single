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
  FormControlLabel,
  Checkbox,
  Box,
  InputAdornment,
  IconButton,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, Refresh as RefreshIcon, CloudUpload as CloudUploadIcon, Download as DownloadIcon } from '@mui/icons-material'
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
  const csvInputRef = useRef(null)
  const [csvImportOpen, setCsvImportOpen] = useState(false)
  const [csvProcessing, setCsvProcessing] = useState(false)
  const [csvResults, setCsvResults] = useState(null)

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

  const handleDownloadSubjectTemplate = () => {
    const headers = 'name,code,department_name,is_lab,credit_hours,description'
    const example = 'Mathematics,MTH101,Computer,false,3,Core mathematics subject'
    const csv = headers + '\n' + example
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'subjects_template.csv'
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
            code: row.code || '',
            department_id: dept ? dept.id : null,
            is_lab: row.is_lab === 'true' || row.is_lab === 'TRUE' || row.is_lab === '1',
            credit_hours: parseInt(row.credit_hours) || 3,
            description: row.description || '',
            is_active: true,
          }
          await subjectService.create(data)
          success++
        } catch (err) {
          errors.push(`"${row.name}": ${err.response?.data?.detail || err.message}`)
        }
      }
      setCsvResults({ success, errors })
      await loadSubjects()
    } catch (err) {
      setCsvResults({ success: 0, errors: [`Failed to parse file: ${err.message}`] })
    }
    setCsvProcessing(false)
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
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a2332', mb: 0.25 }}>Subjects</Typography>
          <Typography variant="body2" sx={{ color: '#8896a4' }}>Manage academic subjects, codes and lab assignments</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadSubjects} disabled={loading} sx={{ borderRadius: '10px', px: 2, textTransform: 'none', fontWeight: 600, borderColor: '#e8edf2', color: '#8896a4', '&:hover': { borderColor: '#2d6a6f', color: '#2d6a6f', backgroundColor: '#2d6a6f10' } }}>
            Refresh
          </Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadSubjectTemplate} sx={{ borderRadius: '10px', px: 2, textTransform: 'none', fontWeight: 600, borderColor: '#e8edf2', color: '#2d6a6f', '&:hover': { borderColor: '#2d6a6f', backgroundColor: '#2d6a6f10' } }}>
            Template
          </Button>
          <Button variant="outlined" startIcon={<CloudUploadIcon />} onClick={() => csvInputRef.current.click()} sx={{ borderRadius: '10px', px: 2, textTransform: 'none', fontWeight: 600, borderColor: '#e8edf2', color: '#2d6a6f', '&:hover': { borderColor: '#2d6a6f', backgroundColor: '#2d6a6f10' } }}>
            Import CSV
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen} sx={{ borderRadius: '10px', px: 2.5, textTransform: 'none', fontWeight: 600, backgroundColor: '#2d6a6f', boxShadow: 'none', '&:hover': { backgroundColor: '#235558', boxShadow: 'none' } }}>
            Add Subject
          </Button>
        </Box>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search by name, code, type (lab/theory), or credit hours..."
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
          rows={filteredSubjects}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[5, 10, 20, 50]}
          loading={loading}
          disableSelectionOnClick
          autoHeight
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f8fafc', borderBottom: '1px solid #e8edf2' }, '& .MuiDataGrid-cell': { borderColor: '#f0f4f8', fontSize: '0.87rem' }, '& .MuiDataGrid-row:hover': { backgroundColor: '#f8fafc' }, '& .MuiDataGrid-footerContainer': { borderTop: '1px solid #e8edf2', backgroundColor: '#fafcfe' } }}
        />
      </Paper>

      <Dialog open={open} onClose={handleClose} PaperProps={{ sx: { borderRadius: '16px' } }}>
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
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} sx={{ borderRadius: '8px', textTransform: 'none' }}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} sx={{ borderRadius: '8px', textTransform: 'none', color: '#2d6a6f', fontWeight: 600 }}>
            {editMode ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <input type="file" accept=".csv" ref={csvInputRef} onChange={handleCsvImport} style={{ display: 'none' }} />

      <Dialog open={csvImportOpen} onClose={() => !csvProcessing && setCsvImportOpen(false)} PaperProps={{ sx: { borderRadius: '16px', minWidth: 420 } }}>
        <DialogTitle>CSV Import Results</DialogTitle>
        <DialogContent>
          {csvProcessing ? (
            <Typography sx={{ py: 1 }}>Importing subjects, please wait...</Typography>
          ) : csvResults ? (
            <Box>
              <Typography sx={{ color: '#16a34a', fontWeight: 600, mb: 0.5 }}>✓ {csvResults.success} subject(s) imported successfully</Typography>
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
