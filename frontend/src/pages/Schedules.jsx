import { useState, useEffect } from 'react'
import {
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  CircularProgress,
  Alert,
  Button,
  TextField,
  MenuItem,
} from '@mui/material'
import { Download as DownloadIcon, Refresh as RefreshIcon } from '@mui/icons-material'
import * as XLSX from 'xlsx-js-style'
import { classRoutineService, teacherService, departmentService } from '../services'
import api from '../services/api'

export default function Schedules() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [loadData, setLoadData] = useState([])
  const [departments, setDepartments] = useState([])
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedRecruitment, setSelectedRecruitment] = useState('all')

  useEffect(() => {
    fetchLoadData()
  }, [])

  const fetchLoadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all class routines
      const routinesResponse = await classRoutineService.getAll()
      const routines = routinesResponse.data

      // Fetch all teachers
      const teachersResponse = await teacherService.getAll()
      const teachers = teachersResponse.data

      // Fetch all departments
      const departmentsResponse = await departmentService.getAll()
      const depts = departmentsResponse.data
      setDepartments(depts)

      // Fetch effective loads
      const effectiveLoadsResponse = await api.get('/finance/effective-loads')
      const effectiveLoads = effectiveLoadsResponse.data || []
      
      // Fetch position rates
      const positionRatesResponse = await api.get('/finance/position-rates')
      const positionRates = positionRatesResponse.data || []
      
      // Create effective load lookup map
      const effectiveLoadMap = {}
      effectiveLoads.forEach(load => {
        effectiveLoadMap[load.teacher_id] = {
          effective_load: load.effective_load,
          position: load.position
        }
      })
      
      // Create position rate lookup map
      const positionRateMap = {}
      positionRates.forEach(rate => {
        positionRateMap[rate.position] = rate.rate
      })

      // Create department lookup map
      const departmentMap = {}
      depts.forEach(dept => {
        departmentMap[dept.id] = dept.name
      })

      // Calculate load for each teacher
      const teacherLoadMap = {}

      teachers.forEach(teacher => {
        const effectiveLoadInfo = effectiveLoadMap[teacher.id] || { effective_load: 20, position: null }
        
        teacherLoadMap[teacher.id] = {
          teacher_id: teacher.id,
          teacher_name: teacher.name,
          abbreviation: teacher.abbreviation,
          department_id: teacher.department_id,
          department_name: teacher.department_id ? departmentMap[teacher.department_id] : 'Not Assigned',
          employment_type: teacher.employment_type,
          effective_load: effectiveLoadInfo.effective_load,
          position: effectiveLoadInfo.position,
          subjects: {},
          total_periods: 0,
          total_workload: 0,
          extra_load: 0,
          total_payment: 0
        }
      })

      // Process all routine entries
      routines.forEach(routine => {
        // Skip if no subject (BREAK or LC)
        if (!routine.subject) return

        const teacherIds = [
          routine.lead_teacher_id,
          routine.assist_teacher_1_id,
          routine.assist_teacher_2_id,
          routine.assist_teacher_3_id
        ].filter(id => id != null)

        teacherIds.forEach(teacherId => {
          if (teacherLoadMap[teacherId]) {
            const subjectName = routine.subject.name
            const subjectKey = `${subjectName}_${routine.is_lab ? 'P' : 'T'}`
            
            if (!teacherLoadMap[teacherId].subjects[subjectKey]) {
              teacherLoadMap[teacherId].subjects[subjectKey] = {
                subject_name: subjectName,
                type: routine.is_lab ? 'P' : 'T',
                periods: 0,
                workload: 0
              }
            }

            // Add periods
            const periods = routine.num_periods || 1
            teacherLoadMap[teacherId].subjects[subjectKey].periods += periods
            
            // Calculate workload (Theory = 1.0, Full Lab = 0.8, Half Lab = 0.4 per period)
            let workload
            if (routine.is_lab) {
              workload = routine.is_half_lab ? periods * 0.4 : periods * 0.8
            } else {
              workload = periods * 1.0
            }
            teacherLoadMap[teacherId].subjects[subjectKey].workload += workload
            
            teacherLoadMap[teacherId].total_periods += periods
            teacherLoadMap[teacherId].total_workload += workload
          }
        })
      })

      // Calculate extra load and total payment for each teacher
      Object.values(teacherLoadMap).forEach(teacher => {
        // Extra load = total workload - effective load
        teacher.extra_load = teacher.total_workload - teacher.effective_load
        
        // Total payment = extra load * position rate * 15 (only if positive extra load and position is assigned)
        if (teacher.extra_load > 0 && teacher.position && positionRateMap[teacher.position]) {
          teacher.total_payment = teacher.extra_load * positionRateMap[teacher.position] * 15
        } else {
          teacher.total_payment = 0
        }
      })

      // Convert to array and sort by teacher name
      const loadArray = Object.values(teacherLoadMap)
        .filter(teacher => teacher.total_periods > 0) // Only include teachers with assignments
        .sort((a, b) => a.teacher_name.localeCompare(b.teacher_name))

      setLoadData(loadArray)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching load data:', err)
      setError('Failed to fetch load data. Please try again.')
      setLoading(false)
    }
  }

  const exportToExcel = () => {
    try {
      // Use filtered data for export
      const dataToExport = filteredLoadData
      
      // Prepare data for Excel
      const excelData = []
      
      // Add title with filter info
      let title = 'Teacher Load Report'
      const filters = []
      
      if (selectedDepartment !== 'all') {
        const deptName = selectedDepartment === 'unassigned' 
          ? 'Not Assigned' 
          : departments.find(d => d.id === selectedDepartment)?.name
        filters.push(deptName)
      }
      
      if (selectedRecruitment !== 'all') {
        filters.push(selectedRecruitment)
      }
      
      if (filters.length > 0) {
        title += ` - ${filters.join(', ')}`
      }
      
      excelData.push([title])
      excelData.push([]) // Empty row
      
      // Add headers
      excelData.push([
        'SN',
        'Teacher',
        'Subject',
        'T/P',
        '#Period',
        'Workload',
        'Total Workload',
        'Effective Load',
        'Extra Load',
        'Position',
        'Total Payment'
      ])

      // Add data rows
      dataToExport.forEach((teacher, teacherIndex) => {
        const subjectArray = Object.values(teacher.subjects)
        subjectArray.forEach((subject, subjectIndex) => {
          excelData.push([
            subjectIndex === 0 ? teacherIndex + 1 : '',
            subjectIndex === 0 ? teacher.teacher_name : '',
            subject.subject_name,
            subject.type,
            subject.periods,
            parseFloat(subject.workload.toFixed(1)),
            subjectIndex === 0 ? parseFloat(teacher.total_workload.toFixed(1)) : '',
            subjectIndex === 0 ? parseFloat(teacher.effective_load.toFixed(1)) : '',
            subjectIndex === 0 ? parseFloat(teacher.extra_load.toFixed(1)) : '',
            subjectIndex === 0 ? (teacher.position || 'N/A') : '',
            subjectIndex === 0 ? parseFloat(teacher.total_payment.toFixed(2)) : ''
          ])
        })
      })

      // Add note at the bottom
      excelData.push([])
      excelData.push(['Note: Theory sessions (T) = 1.0 per period | Lab sessions (P) = 0.8 per period | Half Lab = 0.4 per period'])

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(excelData)

      // Set column widths
      ws['!cols'] = [
        { wch: 5 },   // SN
        { wch: 30 },  // Teacher
        { wch: 40 },  // Subject
        { wch: 8 },   // T/P
        { wch: 10 },  // #Period
        { wch: 12 },  // Workload
        { wch: 15 },  // Total Workload
        { wch: 15 },  // Effective Load
        { wch: 12 },  // Extra Load
        { wch: 25 },  // Position
        { wch: 15 },  // Total Payment
      ]

      // Style the title row
      const titleStyle = {
        font: { bold: true, sz: 14 },
        alignment: { horizontal: "center", vertical: "center" }
      }
      const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 })
      if (ws[titleCell]) {
        ws[titleCell].s = titleStyle
      }
      // Merge title cells
      ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }]

      // Style the header row (now row 2 because of title)
      const headerStyle = {
        fill: { fgColor: { rgb: "1976D2" } },
        font: { bold: true, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center", vertical: "center" }
      }

      // Apply header style
      for (let col = 0; col < 7; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 2, c: col })
        if (!ws[cellAddress]) continue
        ws[cellAddress].s = headerStyle
      }

      // Style data cells (start from row 3 because of title and empty row)
      for (let row = 3; row < excelData.length - 2; row++) {
        for (let col = 0; col < 7; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
          if (!ws[cellAddress]) continue
          
          ws[cellAddress].s = {
            alignment: { 
              horizontal: col >= 4 ? "center" : "left",
              vertical: "center"
            },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } }
            }
          }

          // Bold for Total Workload column
          if (col === 7 && ws[cellAddress].v) {
            ws[cellAddress].s.font = { bold: true }
            ws[cellAddress].s.fill = { fgColor: { rgb: "F5F5F5" } }
          }
        }
      }

      // Create workbook and add worksheet
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Teacher Load Report')

      // Generate file name with current date and department filter
      const date = new Date().toISOString().split('T')[0]
      let fileName = `Teacher_Load_Report_${date}`
      if (selectedDepartment !== 'all') {
        const deptName = selectedDepartment === 'unassigned' 
          ? 'Unassigned' 
          : departments.find(d => d.id === selectedDepartment)?.name.replace(/\s+/g, '_')
        fileName += `_${deptName}`
      }
      fileName += '.xlsx'

      // Save file
      XLSX.writeFile(wb, fileName)
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      alert('Failed to export to Excel. Please try again.')
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  // Filter load data by department and recruitment
  const filteredLoadData = loadData.filter(teacher => {
    // Department filter
    if (selectedDepartment !== 'all') {
      if (selectedDepartment === 'unassigned') {
        if (teacher.department_id) return false
      } else {
        if (teacher.department_id !== selectedDepartment) return false
      }
    }
    
    // Recruitment filter
    if (selectedRecruitment !== 'all') {
      if (teacher.employment_type !== selectedRecruitment) return false
    }
    
    return true
  })

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          Teacher Load Report
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            select
            label="Filter by Department"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="all">All Departments</MenuItem>
            <MenuItem value="unassigned">Not Assigned</MenuItem>
            {departments.map((dept) => (
              <MenuItem key={dept.id} value={dept.id}>
                {dept.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Filter by Recruitment"
            value={selectedRecruitment}
            onChange={(e) => setSelectedRecruitment(e.target.value)}
            size="small"
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="full_time">Full Time</MenuItem>
            <MenuItem value="part_time">Part Time</MenuItem>
          </TextField>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={fetchLoadData}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<DownloadIcon />}
            onClick={exportToExcel}
            disabled={filteredLoadData.length === 0}
          >
            Export to Excel
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>SN</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Teacher</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Subject</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>T/P</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>#Period</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Workload</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Total Workload</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Effective Load</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Extra Load</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Position</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'right' }}>Total Payment</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLoadData.map((teacher, teacherIndex) => {
              const subjectArray = Object.values(teacher.subjects)
              return subjectArray.map((subject, subjectIndex) => (
                <TableRow key={`${teacherIndex}-${subjectIndex}`} hover>
                  {subjectIndex === 0 && (
                    <>
                      <TableCell rowSpan={subjectArray.length} sx={{ verticalAlign: 'top', borderRight: '1px solid #e0e0e0' }}>
                        {teacherIndex + 1}
                      </TableCell>
                      <TableCell rowSpan={subjectArray.length} sx={{ verticalAlign: 'top', borderRight: '1px solid #e0e0e0' }}>
                        <strong>{teacher.teacher_name}</strong>
                      </TableCell>
                    </>
                  )}
                  <TableCell>{subject.subject_name}</TableCell>
                  <TableCell sx={{ textAlign: 'center', fontWeight: 'bold', color: subject.type === 'P' ? 'primary.main' : 'inherit' }}>
                    ({subject.type})
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>{subject.periods}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>{subject.workload.toFixed(1)}</TableCell>
                  {subjectIndex === 0 && (
                    <>
                      <TableCell 
                        rowSpan={subjectArray.length} 
                        sx={{ 
                          textAlign: 'center', 
                          fontWeight: 'bold', 
                          fontSize: '1.1rem',
                          bgcolor: 'action.hover',
                          verticalAlign: 'middle'
                        }}
                      >
                        {teacher.total_workload.toFixed(1)}
                      </TableCell>
                      <TableCell 
                        rowSpan={subjectArray.length} 
                        sx={{ 
                          textAlign: 'center', 
                          verticalAlign: 'middle',
                          borderLeft: '2px solid #e0e0e0'
                        }}
                      >
                        {teacher.effective_load.toFixed(1)}
                      </TableCell>
                      <TableCell 
                        rowSpan={subjectArray.length} 
                        sx={{ 
                          textAlign: 'center', 
                          fontWeight: 'bold',
                          color: teacher.extra_load > 0 ? 'error.main' : teacher.extra_load < 0 ? 'success.main' : 'inherit',
                          verticalAlign: 'middle'
                        }}
                      >
                        {teacher.extra_load.toFixed(1)}
                      </TableCell>
                      <TableCell 
                        rowSpan={subjectArray.length} 
                        sx={{ 
                          verticalAlign: 'middle'
                        }}
                      >
                        {teacher.position || 'N/A'}
                      </TableCell>
                      <TableCell 
                        rowSpan={subjectArray.length} 
                        sx={{ 
                          textAlign: 'right', 
                          fontWeight: 'bold',
                          fontSize: '1.1rem',
                          bgcolor: teacher.total_payment > 0 ? 'success.light' : 'inherit',
                          verticalAlign: 'middle'
                        }}
                      >
                        NPR {teacher.total_payment.toFixed(2)}
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          <strong>Note:</strong> Theory sessions (T) = 1.0 per period | Lab sessions (P) = 0.8 per period | Half Lab = 0.4 per period
        </Typography>
      </Box>
    </Box>
  )
}
