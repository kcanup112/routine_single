import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Tabs,
  Tab,
  MenuItem,
  Alert,
  Snackbar,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material'
import { Save as SaveIcon } from '@mui/icons-material'
import api from '../services/api'

// TabPanel component
function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const Finance = () => {
  const [tabValue, setTabValue] = useState(0)
  const [positionRates, setPositionRates] = useState([])
  const [teachers, setTeachers] = useState([])
  const [teacherLoads, setTeacherLoads] = useState([])
  const [filterType, setFilterType] = useState('all') // 'all', 'full-time', 'part-time'
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const positions = [
    'Assistant Lecturer',
    'Lecturer',
    'Senior Lecturer',
    'Junior Associate Professor',
    'Associate Professor',
    'Professor',
    'Part-Time Lecturer 1',
    'Part-Time Lecturer 2',
    'Part-Time Lecturer 3'
  ]

  useEffect(() => {
    loadPositionRates()
    loadTeachers()
  }, [])

  const loadPositionRates = async () => {
    try {
      const response = await api.get('/finance/position-rates')
      const existingRates = response.data || []
      
      // Create a map of existing rates
      const ratesMap = {}
      existingRates.forEach(rate => {
        ratesMap[rate.position] = rate.rate
      })
      
      // Initialize all positions with existing rates or empty
      const allRates = positions.map(position => ({
        position: position,
        rate: ratesMap[position] || ''
      }))
      
      setPositionRates(allRates)
    } catch (error) {
      console.error('Error loading position rates:', error)
      // Initialize with empty rates if API fails
      const emptyRates = positions.map(position => ({
        position: position,
        rate: ''
      }))
      setPositionRates(emptyRates)
    }
  }

  const loadTeachers = async () => {
    try {
      console.log('Fetching teachers...')
      const response = await api.get('/teachers/')
      console.log('Teachers response:', response.data)
      const teachersData = response.data || []
      setTeachers(teachersData)
      
      // Load existing effective loads
      console.log('Fetching effective loads...')
      const loadsResponse = await api.get('/finance/effective-loads')
      console.log('Effective loads response:', loadsResponse.data)
      const existingLoads = loadsResponse.data || []
      
      // Create a map of existing loads
      const loadsMap = {}
      existingLoads.forEach(load => {
        loadsMap[load.teacher_id] = {
          effective_load: load.effective_load,
          position: load.position
        }
      })
      
      // Initialize teacher loads with existing data or defaults
      const loads = teachersData.map(teacher => ({
        teacher_id: teacher.id,
        teacher_name: teacher.name,
        effective_load: loadsMap[teacher.id]?.effective_load !== undefined ? loadsMap[teacher.id].effective_load : 20,
        position: loadsMap[teacher.id]?.position || ''
      }))
      
      console.log('Final teacher loads:', loads)
      setTeacherLoads(loads)
    } catch (error) {
      console.error('Error loading teachers:', error)
      console.error('Error details:', error.response?.data)
    }
  }

  const handleRateChange = (position, value) => {
    setPositionRates(prevRates =>
      prevRates.map(rate =>
        rate.position === position
          ? { ...rate, rate: value }
          : rate
      )
    )
  }

  const handleSaveRates = async () => {
    try {
      // Filter out empty rates and convert to numbers
      const ratesToSave = positionRates
        .filter(rate => rate.rate !== '')
        .map(rate => ({
          position: rate.position,
          rate: parseFloat(rate.rate)
        }))

      await api.post('/finance/position-rates', ratesToSave)
      
      setSnackbar({
        open: true,
        message: 'Position rates saved successfully!',
        severity: 'success'
      })
      
      loadPositionRates()
    } catch (error) {
      console.error('Error saving position rates:', error)
      setSnackbar({
        open: true,
        message: 'Failed to save position rates. Please try again.',
        severity: 'error'
      })
    }
  }

  const handleLoadChange = (teacherId, value) => {
    setTeacherLoads(prevLoads =>
      prevLoads.map(load =>
        load.teacher_id === teacherId
          ? { ...load, effective_load: value }
          : load
      )
    )
  }

  const handlePositionChange = (teacherId, value) => {
    setTeacherLoads(prevLoads =>
      prevLoads.map(load =>
        load.teacher_id === teacherId
          ? { ...load, position: value }
          : load
      )
    )
  }

  const handleSaveLoads = async () => {
    try {
      // Convert to numbers and prepare data
      const loadsToSave = teacherLoads.map(load => ({
        teacher_id: load.teacher_id,
        effective_load: parseFloat(load.effective_load),
        position: load.position
      }))

      await api.post('/finance/effective-loads', loadsToSave)
      
      setSnackbar({
        open: true,
        message: 'Effective loads saved successfully!',
        severity: 'success'
      })
      
      loadTeachers()
    } catch (error) {
      console.error('Error saving effective loads:', error)
      setSnackbar({
        open: true,
        message: 'Failed to save effective loads. Please try again.',
        severity: 'error'
      })
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const handleFilterChange = (event, newFilter) => {
    if (newFilter !== null) {
      setFilterType(newFilter)
    }
  }

  // Filter teachers based on employment type
  const filteredTeacherLoads = teacherLoads.filter(load => {
    const teacher = teachers.find(t => t.id === load.teacher_id)
    if (!teacher) return false
    
    if (filterType === 'all') return true
    if (filterType === 'full-time') return teacher.employment_type === 'full_time'
    if (filterType === 'part-time') return teacher.employment_type === 'part_time'
    return true
  })

  return (
    <Box sx={{ p: 2 }}>
      {/* Header Section */}
      <Box sx={{ 
        mb: 3, 
        p: 3, 
        borderRadius: 2,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        boxShadow: 3,
      }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          💰 Finance Management
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          Manage position rates and teacher workload configurations
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ mb: 2, borderRadius: 2, overflow: 'hidden' }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{
            bgcolor: '#f5f7fa',
            '& .MuiTab-root': {
              fontWeight: 600,
              fontSize: '0.95rem',
            },
            '& .Mui-selected': {
              color: '#667eea',
            },
          }}
          TabIndicatorProps={{
            style: {
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              height: 3,
            }
          }}
        >
          <Tab label="⚙️ Settings" />
          <Tab label="📊 Effective Load" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ 
            p: 3,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            borderRadius: 2,
            mb: 3,
          }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#667eea', mb: 1 }}>
              💵 Position Payment Rates
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Set the payment rates for different teaching positions. Rates will be used to calculate teacher payments.
            </Typography>
          </Box>

          <TableContainer 
            component={Paper} 
            elevation={2}
            sx={{ 
              mt: 3,
              border: '2px solid #e0e7ff',
              borderRadius: 2,
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                }}>
                  <TableCell sx={{ color: '#111111', fontWeight: 700, fontSize: '0.95rem' }}>
                    Position
                  </TableCell>
                  <TableCell sx={{ color: '#111111', fontWeight: 700, fontSize: '0.95rem' }}>
                    Rate (NPR per period)
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {positionRates.map((item, index) => (
                  <TableRow 
                    key={index} 
                    hover
                    sx={{
                      '&:hover': {
                        bgcolor: 'rgba(102, 126, 234, 0.05)',
                      },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body1" fontWeight={600} color="#667eea">
                        {item.position}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={item.rate}
                        onChange={(e) => handleRateChange(item.position, e.target.value)}
                        placeholder="Enter rate"
                        size="small"
                        fullWidth
                        inputProps={{ min: 0, step: 0.01 }}
                        sx={{ maxWidth: 300 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveRates}
              size="large"
              sx={{
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                color: 'white',
                px: 3,
                py: 1.5,
                fontWeight: 600,
                boxShadow: '0 3px 5px 2px rgba(102, 126, 234, .3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #764ba2 30%, #667eea 90%)',
                  boxShadow: '0 4px 8px 3px rgba(102, 126, 234, .4)',
                },
              }}
            >
              Save Rates
            </Button>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ 
            p: 3,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            borderRadius: 2,
            mb: 3,
          }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#667eea', mb: 1 }}>
              📊 Teacher Effective Load
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Set the effective load and position for each teacher. This automatically syncs with the Teachers list.
            </Typography>
          </Box>

          {/* Filter Toggle Buttons */}
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <ToggleButtonGroup
              value={filterType}
              exclusive
              onChange={handleFilterChange}
              aria-label="teacher filter"
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  fontWeight: 600,
                  '&.Mui-selected': {
                    background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #764ba2 30%, #667eea 90%)',
                    },
                  },
                },
              }}
            >
              <ToggleButton value="all" aria-label="all teachers">
                👥 All Teachers
              </ToggleButton>
              <ToggleButton value="full-time" aria-label="full time">
                ⏰ Full Time
              </ToggleButton>
              <ToggleButton value="part-time" aria-label="part time">
                🕐 Part Time
              </ToggleButton>
            </ToggleButtonGroup>
            <Typography variant="body2" sx={{ 
              fontWeight: 600,
              color: '#667eea',
              bgcolor: '#f3f4f6',
              px: 2,
              py: 1,
              borderRadius: 2,
            }}>
              Showing {filteredTeacherLoads.length} teacher(s)
            </Typography>
          </Box>

          <TableContainer 
            component={Paper} 
            elevation={2}
            sx={{ 
              mt: 3,
              border: '2px solid #e0e7ff',
              borderRadius: 2,
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                }}>
                  <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>
                    Teacher
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>
                    Position
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>
                    Effective Load
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTeacherLoads.map((item, index) => (
                  <TableRow 
                    key={index} 
                    hover
                    sx={{
                      '&:hover': {
                        bgcolor: 'rgba(102, 126, 234, 0.05)',
                      },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body1" fontWeight={600} color="#667eea">
                        {item.teacher_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <TextField
                        select
                        value={item.position}
                        onChange={(e) => handlePositionChange(item.teacher_id, e.target.value)}
                        size="small"
                        fullWidth
                        sx={{ maxWidth: 300 }}
                      >
                        <MenuItem value="">Select Position</MenuItem>
                        {positions.map((pos) => (
                          <MenuItem key={pos} value={pos}>
                            {pos}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        value={item.effective_load}
                        onChange={(e) => handleLoadChange(item.teacher_id, e.target.value)}
                        placeholder="Enter effective load"
                        size="small"
                        fullWidth
                        inputProps={{ min: 0, step: 0.5, pattern: "[0-9]*" }}
                        sx={{ maxWidth: 200 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveLoads}
              size="large"
              sx={{
                background: 'linear-gradient(45deg, #43e97b 30%, #38f9d7 90%)',
                color: 'white',
                px: 3,
                py: 1.5,
                fontWeight: 600,
                boxShadow: '0 3px 5px 2px rgba(67, 233, 123, .3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #38f9d7 30%, #43e97b 90%)',
                  boxShadow: '0 4px 8px 3px rgba(67, 233, 123, .4)',
                },
              }}
            >
              Save Effective Loads
            </Button>
          </Box>
        </TabPanel>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default Finance
