import { useState, useEffect } from 'react'
import {
  Typography,
  Paper,
  Box,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Autocomplete,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import { 
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  FileDownload as ExportIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import * as XLSX from 'xlsx-js-style'
import { 
  teacherService,
  dayService,
  periodService,
  classRoutineService,
  departmentService,
} from '../services'

export default function TeacherRoutine() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [teachers, setTeachers] = useState([])
  const [departments, setDepartments] = useState([])
  const [days, setDays] = useState([])
  const [periods, setPeriods] = useState([])
  const [selectedTeacher, setSelectedTeacher] = useState(null)
  const [teacherRoutine, setTeacherRoutine] = useState({})
  const [loading, setLoading] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [totalLoad, setTotalLoad] = useState(0)
  const [mobileShowAllDays, setMobileShowAllDays] = useState(false)

  // Load initial data
  useEffect(() => {
    loadTeachers()
    loadDepartments()
    loadDays()
    loadPeriods()
  }, [])

  // Load teacher routine when teacher is selected
  useEffect(() => {
    if (selectedTeacher) {
      loadTeacherRoutine()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTeacher])

  const handleRefresh = async () => {
    await loadTeachers()
    await loadDepartments()
    await loadDays()
    await loadPeriods()
    if (selectedTeacher) {
      await loadTeacherRoutine()
    }
  }

  const loadTeachers = async () => {
    try {
      const response = await teacherService.getAll()
      console.log('Teachers response:', response)
      const data = response.data
      setTeachers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading teachers:', error)
      setTeachers([])
    }
  }

  const loadDepartments = async () => {
    try {
      const response = await departmentService.getAll()
      setDepartments(response.data)
    } catch (error) {
      console.error('Error loading departments:', error)
      setDepartments([])
    }
  }

  const loadDays = async () => {
    try {
      const response = await dayService.getAll()
      console.log('Days response:', response)
      const data = response.data
      setDays(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading days:', error)
      setDays([])
    }
  }

  const loadPeriods = async () => {
    try {
      const response = await periodService.getAll()
      console.log('Periods response:', response)
      const data = response.data
      setPeriods(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading periods:', error)
      setPeriods([])
    }
  }

  const loadTeacherRoutine = async () => {
    setLoading(true)
    try {
      // Get all class routines and filter for this teacher
      const response = await classRoutineService.getAll()
      const routines = response.data || []
      
      // Build routine data structure
      const routineMap = {}
      let calculatedLoad = 0
      
      if (routines && Array.isArray(routines)) {
        routines.forEach(entry => {
          // Check if this teacher is involved (as lead or assistant)
          const teacherId = selectedTeacher?.id
          const isLeadTeacher = entry.lead_teacher_id === teacherId
          const isAssistant1 = entry.assist_teacher_1_id === teacherId
          const isAssistant2 = entry.assist_teacher_2_id === teacherId
          const isAssistant3 = entry.assist_teacher_3_id === teacherId
          
          if (isLeadTeacher || isAssistant1 || isAssistant2 || isAssistant3) {
            const key = `${entry.day_id}-${entry.period_id}`
            
            // Calculate load for this entry
            const periods = entry.num_periods || 1
            const workload = entry.is_lab ? periods * 0.8 : periods * 1.0
            calculatedLoad += workload
            
            // Get partner teachers for lab sessions
            let partners = []
            if (entry.is_lab) {
              if (isLeadTeacher) {
                if (entry.assist_teacher_1_id) partners.push(entry.assist_teacher_1_id)
                if (entry.assist_teacher_2_id) partners.push(entry.assist_teacher_2_id)
                if (entry.assist_teacher_3_id) partners.push(entry.assist_teacher_3_id)
              } else if (isAssistant1) {
                partners.push(entry.lead_teacher_id)
                if (entry.assist_teacher_2_id) partners.push(entry.assist_teacher_2_id)
                if (entry.assist_teacher_3_id) partners.push(entry.assist_teacher_3_id)
              } else if (isAssistant2) {
                partners.push(entry.lead_teacher_id)
                if (entry.assist_teacher_1_id) partners.push(entry.assist_teacher_1_id)
                if (entry.assist_teacher_3_id) partners.push(entry.assist_teacher_3_id)
              } else if (isAssistant3) {
                partners.push(entry.lead_teacher_id)
                if (entry.assist_teacher_1_id) partners.push(entry.assist_teacher_1_id)
                if (entry.assist_teacher_2_id) partners.push(entry.assist_teacher_2_id)
              }
            }
            
            routineMap[key] = {
              subject_name: entry.subject?.name || 'N/A',
              subject_code: entry.subject?.code || '',
              class_name: entry.class?.name || 'N/A',
              section: entry.class?.section || '',
              room_no: entry.class?.room_no || '',
              is_lab: entry.is_lab,
              num_periods: entry.num_periods,
              role: isLeadTeacher ? 'Lead' : 'Assistant',
              partner_ids: partners,
              programme_code: entry.class?.programme?.code || '',
              semester_name: entry.class?.semester?.name || '',
            }
          }
        })
      }
      
      setTeacherRoutine(routineMap)
      setTotalLoad(calculatedLoad)
    } catch (error) {
      console.error('Error loading teacher routine:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTeacherName = () => {
    return selectedTeacher ? selectedTeacher.name : ''
  }

  const getPartnerNames = (partnerIds) => {
    if (!partnerIds || partnerIds.length === 0) return ''
    
    const names = partnerIds.map(id => {
      const teacher = teachers.find(t => t.id === id)
      return teacher ? `(${teacher.abbreviation || teacher.name})` : 'Unknown'
    })
    
    return names.join(', ')
  }

  const getCellData = (dayId, periodId) => {
    const key = `${dayId}-${periodId}`
    return teacherRoutine[key]
  }

  const isCellSpanned = (dayId, periodId) => {
    // Check if this cell is part of a multi-period span from an earlier period
    for (let i = 1; i < 5; i++) {
      const prevPeriodId = periodId - i
      const prevKey = `${dayId}-${prevPeriodId}`
      const prevData = teacherRoutine[prevKey]
      
      if (prevData && prevData.num_periods > i) {
        return true
      }
    }
    return false
  }

  const handleExportAllTeachers = async () => {
    if (teachers.length === 0) {
      alert('No teachers available to export')
      return
    }

    try {
      // Fetch all class routines to get effective date
      const routinesResponse = await classRoutineService.getAll()
      const allRoutines = routinesResponse.data || []
      
      // Get effective date from first routine entry
      const effectiveDate = allRoutines.length > 0 && allRoutines[0].effective_date
        ? new Date(allRoutines[0].effective_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : 'N/A'

      // Create workbook
      const wb = XLSX.utils.book_new()

      // Process each teacher
      for (const teacher of teachers) {
        // Fetch all class routines
        const response = await classRoutineService.getAll()
        const allClassRoutines = response.data || []
        
        // Build teacher routine from class routines
        const teacherRoutineData = {}
        let teacherTotalLoad = 0

        if (allClassRoutines && Array.isArray(allClassRoutines)) {
          allClassRoutines.forEach(entry => {
            // Check if this teacher is involved
            const isLeadTeacher = entry.lead_teacher_id === teacher.id
            const isAssistant1 = entry.assist_teacher_1_id === teacher.id
            const isAssistant2 = entry.assist_teacher_2_id === teacher.id
            const isAssistant3 = entry.assist_teacher_3_id === teacher.id
            
            if (isLeadTeacher || isAssistant1 || isAssistant2 || isAssistant3) {
              const key = `${entry.day_id}-${entry.period_id}`
              
              // Calculate load for this entry
              const periods = entry.num_periods || 1
              const workload = entry.is_lab ? periods * 0.8 : periods * 1.0
              teacherTotalLoad += workload
              
              // Get partner teachers for lab sessions
              let partners = []
              if (entry.is_lab) {
                if (isLeadTeacher) {
                  if (entry.assist_teacher_1_id) partners.push(entry.assist_teacher_1_id)
                  if (entry.assist_teacher_2_id) partners.push(entry.assist_teacher_2_id)
                  if (entry.assist_teacher_3_id) partners.push(entry.assist_teacher_3_id)
                } else if (isAssistant1) {
                  partners.push(entry.lead_teacher_id)
                  if (entry.assist_teacher_2_id) partners.push(entry.assist_teacher_2_id)
                  if (entry.assist_teacher_3_id) partners.push(entry.assist_teacher_3_id)
                } else if (isAssistant2) {
                  partners.push(entry.lead_teacher_id)
                  if (entry.assist_teacher_1_id) partners.push(entry.assist_teacher_1_id)
                  if (entry.assist_teacher_3_id) partners.push(entry.assist_teacher_3_id)
                } else if (isAssistant3) {
                  partners.push(entry.lead_teacher_id)
                  if (entry.assist_teacher_1_id) partners.push(entry.assist_teacher_1_id)
                  if (entry.assist_teacher_2_id) partners.push(entry.assist_teacher_2_id)
                }
              }
              
              teacherRoutineData[key] = {
                subject_name: entry.subject?.name || 'N/A',
                class_name: entry.class?.name || 'N/A',
                section: entry.class?.section || '',
                is_lab: entry.is_lab,
                room_no: entry.class?.room_no || '',
                num_periods: entry.num_periods || 1,
                partner_ids: partners,
              }
            }
          })
        }

        // Create worksheet data
        const wsData = []

        // Row 1: Kantipur Engineering College
        wsData.push(['Kantipur Engineering College'])
        
        // Row 2: Teacher's Routine
        wsData.push(["Teacher's Routine"])
        
        // Row 3: Department and Effective From
        const row3 = new Array(periods.length + 1).fill('')
        const departmentName = teacher.department_id 
          ? (departments.find(d => d.id === teacher.department_id)?.name || 'N/A')
          : 'Not Assigned'
        row3[0] = `Department: ${departmentName}`
        row3[8] = `Effective From: ${effectiveDate}`
        wsData.push(row3)
        
        // Row 4: Teacher name and Total Load
        const row4 = new Array(periods.length + 1).fill('')
        row4[0] = `Teacher: ${teacher.name}`
        row4[8] = `Total Load: ${teacherTotalLoad.toFixed(1)}`
        wsData.push(row4)
        
        // Row 5: Empty row
        wsData.push([])
        
        // Row 6: Header row with periods
        const headerRow = ['Days \\ Time']
        periods.forEach(period => {
          headerRow.push(`${period.start_time?.substring(0, 5)}-${period.end_time?.substring(0, 5)}`)
        })
        wsData.push(headerRow)
        
        // Rows 7+: Routine data
        days.forEach(day => {
          const row = [day.name]
          
          let skipCount = 0
          periods.forEach((period) => {
            if (skipCount > 0) {
              skipCount--
              row.push('') // Add empty cell for merged periods
              return
            }
            
            const key = `${day.id}-${period.id}`
            const cellData = teacherRoutineData[key]
            
            if (!cellData) {
              row.push('-')
            } else {
              let cellContent = cellData.subject_name
              
              if (cellData.is_lab) {
                cellContent += ' (Lab)'
              }
              
              cellContent += `\n[${cellData.class_name}${cellData.section ? ' - ' + cellData.section : ''}]`
              
              if (cellData.room_no) {
                cellContent += `\nRoom: ${cellData.room_no}`
              }
              
              if (cellData.partner_ids && cellData.partner_ids.length > 0) {
                const partnerNames = cellData.partner_ids
                  .map(pid => {
                    const partner = teachers.find(t => t.id === pid)
                    return partner ? `(${partner.abbreviation || partner.name})` : ''
                  })
                  .filter(name => name)
                  .join(', ')
                cellContent += `\nWith: ${partnerNames}`
              }
              
              row.push(cellContent)
              
              if (cellData.num_periods > 1) {
                skipCount = cellData.num_periods - 1
              }
            }
          })
          
          wsData.push(row)
        })

        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(wsData)

        // Set column widths
        const colWidths = [{ wch: 11.27 }]
        periods.forEach(() => {
          colWidths.push({ wch: 11.27 })
        })
        ws['!cols'] = colWidths

        // Set row heights
        const rowHeights = []
        rowHeights[0] = { hpt: 24 }
        rowHeights[1] = { hpt: 20 }
        rowHeights[2] = { hpt: 18 }
        rowHeights[3] = { hpt: 18 }
        rowHeights[4] = { hpt: 5 }
        rowHeights[5] = { hpt: 20 }
        for (let i = 6; i < 6 + days.length; i++) {
          rowHeights[i] = { hpt: 85.50 }
        }
        ws['!rows'] = rowHeights

        // Merge cells for title rows and multi-period entries
        const merges = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: periods.length } },
          { s: { r: 1, c: 0 }, e: { r: 1, c: periods.length } },
          { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
          { s: { r: 2, c: 8 }, e: { r: 2, c: 10 } },
          { s: { r: 3, c: 0 }, e: { r: 3, c: 3 } },
          { s: { r: 3, c: 8 }, e: { r: 3, c: 10 } },
        ]
        
        // Add merges for multi-period classes
        days.forEach((day, dayIdx) => {
          let skipCount = 0
          periods.forEach((period, periodIdx) => {
            if (skipCount > 0) {
              skipCount--
              return
            }
            
            const key = `${day.id}-${period.id}`
            const cellData = teacherRoutineData[key]
            
            if (cellData && cellData.num_periods > 1) {
              const rowIndex = 6 + dayIdx
              const startCol = periodIdx + 1
              const endCol = startCol + cellData.num_periods - 1
              
              merges.push({
                s: { r: rowIndex, c: startCol },
                e: { r: rowIndex, c: endCol }
              })
              
              skipCount = cellData.num_periods - 1
            }
          })
        })
        
        ws['!merges'] = merges

        // Apply styles
        const range = XLSX.utils.decode_range(ws['!ref'])
        for (let R = range.s.r; R <= range.e.r; ++R) {
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
            if (!ws[cellAddress]) continue
            
            ws[cellAddress].s = {
              border: {
                top: { style: 'thin' },
                bottom: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' }
              },
              alignment: {
                wrapText: true,
                vertical: 'center',
                horizontal: 'center'
              }
            }
            
            if (R === 0) {
              ws[cellAddress].s = {
                font: { bold: true, sz: 16 },
                alignment: { horizontal: 'center', vertical: 'center' }
              }
            }
            if (R === 1) {
              ws[cellAddress].s = {
                font: { bold: true, sz: 14 },
                alignment: { horizontal: 'center', vertical: 'center' }
              }
            }
            if (R === 2) {
              ws[cellAddress].s = {
                font: { bold: true },
                alignment: { 
                  horizontal: C >= 8 ? 'right' : 'left',
                  vertical: 'center'
                }
              }
            }
            if (R === 3) {
              ws[cellAddress].s = {
                font: { bold: true },
                alignment: { 
                  horizontal: C >= 8 ? 'right' : 'left',
                  vertical: 'center'
                }
              }
            }
            if (R === 4) {
              ws[cellAddress].s = {}
            }
            if (R === 5) {
              ws[cellAddress].s = {
                font: { bold: true },
                fill: { fgColor: { rgb: 'D3D3D3' } },
                border: {
                  top: { style: 'thin' },
                  bottom: { style: 'thin' },
                  left: { style: 'thin' },
                  right: { style: 'thin' }
                },
                alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
              }
            }
            if (R >= 6 && C === 0) {
              ws[cellAddress].s = {
                font: { bold: true },
                fill: { fgColor: { rgb: 'F0F0F0' } },
                border: {
                  top: { style: 'thin' },
                  bottom: { style: 'thin' },
                  left: { style: 'thin' },
                  right: { style: 'thin' }
                },
                alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
              }
            }
            if (R >= 6 && C > 0) {
              ws[cellAddress].s = {
                border: {
                  top: { style: 'thin' },
                  bottom: { style: 'thin' },
                  left: { style: 'thin' },
                  right: { style: 'thin' }
                },
                alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
              }
            }
          }
        }

        // Page setup
        ws['!pageSetup'] = {
          paperSize: 9,
          orientation: 'landscape',
          scale: 100,
          fitToWidth: 1,
          fitToHeight: 0,
          fitToPage: true,
          horizontalDpi: 300,
          verticalDpi: 300
        }

        ws['!margins'] = {
          left: 0.5,
          right: 0.5,
          top: 0.75,
          bottom: 0.75,
          header: 0.3,
          footer: 0.3
        }

        // Set print area
        const maxCol = periods.length
        const maxRow = 5 + days.length
        ws['!printArea'] = `A1:${XLSX.utils.encode_col(maxCol)}${maxRow + 1}`

        // Sanitize sheet name
        let sheetName = teacher.name.replace(/[:\\\/\?\*\[\]]/g, '-')
        if (sheetName.length > 31) {
          sheetName = sheetName.substring(0, 31)
        }

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, sheetName)
      }

      // Save file
      const filename = `All_Teachers_Routines_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, filename)

    } catch (error) {
      console.error('Error exporting all teachers routines:', error)
      alert('Failed to export all teachers routines. Please try again.')
    }
  }

  const handleExportTeacherRoutine = async () => {
    if (!selectedTeacher) {
      alert('Please select a teacher first')
      return
    }

    try {
      // Fetch all class routines to get effective date
      const routinesResponse = await classRoutineService.getAll()
      const allRoutines = routinesResponse.data || []
      
      // Get effective date from first routine entry (assuming all have same date)
      const effectiveDate = allRoutines.length > 0 && allRoutines[0].effective_date
        ? new Date(allRoutines[0].effective_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : 'N/A'

      // Create workbook
      const wb = XLSX.utils.book_new()
      const wsData = []

      // Row 1: Kantipur Engineering College
      wsData.push(['Kantipur Engineering College'])
      
      // Row 2: Teacher's Routine
      wsData.push(["Teacher's Routine"])
      
      // Row 3: Department (A3) and Effective From (I3-K3)
      const row3 = new Array(periods.length + 1).fill('')
      const departmentName = selectedTeacher.department_id 
        ? (departments.find(d => d.id === selectedTeacher.department_id)?.name || 'N/A')
        : 'Not Assigned'
      row3[0] = `Department: ${departmentName}`
      row3[8] = `Effective From: ${effectiveDate}` // Column I (index 8)
      wsData.push(row3)
      
      // Row 4: Teacher name (A4) and Total Load (I4-K4)
      const row4 = new Array(periods.length + 1).fill('')
      row4[0] = `Teacher: ${selectedTeacher.name}`
      row4[8] = `Total Load: ${totalLoad.toFixed(1)}` // Column I (index 8)
      wsData.push(row4)
      
      // Row 5: Empty row
      wsData.push([])
      
      // Row 6: Header row with periods
      const headerRow = ['Days \\ Time']
      periods.forEach(period => {
        headerRow.push(`${period.start_time?.substring(0, 5)}-${period.end_time?.substring(0, 5)}`)
      })
      wsData.push(headerRow)
      
      // Rows 7+: Routine data
      days.forEach(day => {
        const row = [day.name]
        
        let skipCount = 0
        periods.forEach((period) => {
          if (skipCount > 0) {
            skipCount--
            row.push('') // Add empty cell for merged periods
            return
          }
          
          const cellData = getCellData(day.id, period.id)
          
          if (!cellData) {
            row.push('-')
          } else {
            let cellContent = cellData.subject_name
            
            if (cellData.is_lab) {
              cellContent += ' (Lab)'
            }
            
            cellContent += `\n[${cellData.class_name}${cellData.section ? ' - ' + cellData.section : ''}]`
            
            if (cellData.room_no) {
              cellContent += `\nRoom: ${cellData.room_no}`
            }
            
            if (cellData.partner_ids && cellData.partner_ids.length > 0) {
              const partnerNames = getPartnerNames(cellData.partner_ids)
              cellContent += `\nWith: ${partnerNames}`
            }
            
            row.push(cellContent)
            
            if (cellData.num_periods > 1) {
              skipCount = cellData.num_periods - 1
            }
          }
        })
        
        wsData.push(row)
      })

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData)

      // Set column widths
      const colWidths = [{ wch: 11.27 }]
      periods.forEach(() => {
        colWidths.push({ wch: 11.27 })
      })
      ws['!cols'] = colWidths

      // Set row heights
      const rowHeights = []
      rowHeights[0] = { hpt: 24 }
      rowHeights[1] = { hpt: 20 }
      rowHeights[2] = { hpt: 18 }
      rowHeights[3] = { hpt: 18 }
      rowHeights[4] = { hpt: 5 }
      rowHeights[5] = { hpt: 20 }
      for (let i = 6; i < 6 + days.length; i++) {
        rowHeights[i] = { hpt: 85.50 }
      }
      ws['!rows'] = rowHeights

      // Merge cells for title rows and multi-period entries
      const merges = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: periods.length } }, // Row 1: Full width
        { s: { r: 1, c: 0 }, e: { r: 1, c: periods.length } }, // Row 2: Full width
        { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } }, // Row 3: Department A3-D3
        { s: { r: 2, c: 8 }, e: { r: 2, c: 10 } }, // Row 3: Effective From I3-K3
        { s: { r: 3, c: 0 }, e: { r: 3, c: 3 } }, // Row 4: Teacher Name A4-D4
        { s: { r: 3, c: 8 }, e: { r: 3, c: 10 } }, // Row 4: Total Load I4-K4
      ]
      
      // Add merges for multi-period classes
      days.forEach((day, dayIdx) => {
        let skipCount = 0
        periods.forEach((period, periodIdx) => {
          if (skipCount > 0) {
            skipCount--
            return
          }
          
          const cellData = getCellData(day.id, period.id)
          
          if (cellData && cellData.num_periods > 1) {
            const rowIndex = 6 + dayIdx
            const startCol = periodIdx + 1
            const endCol = startCol + cellData.num_periods - 1
            
            merges.push({
              s: { r: rowIndex, c: startCol },
              e: { r: rowIndex, c: endCol }
            })
            
            skipCount = cellData.num_periods - 1
          }
        })
      })
      
      ws['!merges'] = merges

      // Apply styles
      const range = XLSX.utils.decode_range(ws['!ref'])
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
          if (!ws[cellAddress]) continue
          
          ws[cellAddress].s = {
            border: {
              top: { style: 'thin' },
              bottom: { style: 'thin' },
              left: { style: 'thin' },
              right: { style: 'thin' }
            },
            alignment: {
              wrapText: true,
              vertical: 'center',
              horizontal: 'center'
            }
          }
          
          if (R === 0) {
            ws[cellAddress].s = {
              font: { bold: true, sz: 16 },
              alignment: { horizontal: 'center', vertical: 'center' }
            }
          }
          if (R === 1) {
            ws[cellAddress].s = {
              font: { bold: true, sz: 14 },
              alignment: { horizontal: 'center', vertical: 'center' }
            }
          }
          if (R === 2) {
            // Row 3: Department and Effective From - no borders
            ws[cellAddress].s = {
              font: { bold: true },
              alignment: { 
                horizontal: C >= 8 ? 'right' : 'left',
                vertical: 'center'
              }
            }
          }
          if (R === 3) {
            // Row 4: Teacher Name and Total Load - no borders
            ws[cellAddress].s = {
              font: { bold: true },
              alignment: { 
                horizontal: C >= 8 ? 'right' : 'left',
                vertical: 'center'
              }
            }
          }
          if (R === 4) {
            ws[cellAddress].s = {}
          }
          if (R === 5) {
            ws[cellAddress].s = {
              font: { bold: true },
              fill: { fgColor: { rgb: 'D3D3D3' } },
              border: {
                top: { style: 'thin' },
                bottom: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' }
              },
              alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
            }
          }
          if (R >= 6 && C === 0) {
            ws[cellAddress].s = {
              font: { bold: true },
              fill: { fgColor: { rgb: 'F0F0F0' } },
              border: {
                top: { style: 'thin' },
                bottom: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' }
              },
              alignment: { horizontal: 'center', vertical: 'center' }
            }
          }
        }
      }

      // Page setup for A4 landscape printing
      ws['!pageSetup'] = {
        orientation: 'landscape',
        paperSize: 9,
        fitToWidth: 1,
        fitToHeight: 0,
        scale: 100,
        horizontalDpi: 300,
        verticalDpi: 300
      }

      ws['!margins'] = {
        left: 0.5,
        right: 0.5,
        top: 0.75,
        bottom: 0.75,
        header: 0.3,
        footer: 0.3
      }

      // Set print area
      const maxRow = 5 + days.length
      const maxCol = periods.length
      ws['!printArea'] = `A1:${XLSX.utils.encode_col(maxCol)}${maxRow + 1}`

      // Add worksheet
      XLSX.utils.book_append_sheet(wb, ws, 'Teacher Routine')

      // Save file
      const filename = `Teacher_Routine_${selectedTeacher.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, filename)

    } catch (error) {
      console.error('Error exporting teacher routine:', error)
      alert('Failed to export teacher routine. Please try again.')
    }
  }

  // Determine today's day name
  const todayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()]

  const renderMobileRoutine = () => {
    const visibleDays = mobileShowAllDays
      ? days
      : days.filter(d => d.name.toLowerCase() === todayName.toLowerCase())

    const todayInDays = days.some(d => d.name.toLowerCase() === todayName.toLowerCase())

    return (
      <Box sx={{ mt: 1 }}>
        {/* Day filter toggle */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Button
            size="small"
            variant={!mobileShowAllDays ? 'contained' : 'outlined'}
            onClick={() => setMobileShowAllDays(false)}
            sx={{
              flex: 1,
              borderRadius: '20px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
              ...(!mobileShowAllDays ? {
                bgcolor: '#2d6a6f',
                color: 'white',
                '&:hover': { bgcolor: '#235558' },
              } : {
                borderColor: '#2d6a6f',
                color: '#2d6a6f',
              }),
            }}
          >
            Today ({todayName})
          </Button>
          <Button
            size="small"
            variant={mobileShowAllDays ? 'contained' : 'outlined'}
            onClick={() => setMobileShowAllDays(true)}
            sx={{
              flex: 1,
              borderRadius: '20px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
              ...(mobileShowAllDays ? {
                bgcolor: '#2d6a6f',
                color: 'white',
                '&:hover': { bgcolor: '#235558' },
              } : {
                borderColor: '#2d6a6f',
                color: '#2d6a6f',
              }),
            }}
          >
            All Days
          </Button>
        </Box>

        {/* No schedule message for today */}
        {!mobileShowAllDays && !todayInDays && (
          <Paper elevation={0} sx={{ p: 3, textAlign: 'center', border: '1px solid #e8edf2', borderRadius: '12px' }}>
            <Typography variant="body2" sx={{ color: '#8896a4' }}>
              No schedule configured for {todayName}.
            </Typography>
          </Paper>
        )}

        {visibleDays.map((day) => {
          const isToday = day.name.toLowerCase() === todayName.toLowerCase()
          return (
            <Paper
              key={day.id}
              elevation={0}
              sx={{ mb: 2, border: `1px solid ${isToday ? '#2d6a6f' : '#e8edf2'}`, borderRadius: '12px', overflow: 'hidden' }}
            >
              {/* Day header */}
              <Box sx={{
                bgcolor: isToday ? '#2d6a6f' : '#f8fafc',
                color: isToday ? 'white' : '#1a2332',
                px: 2,
                py: 1.25,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
                  {day.name}
                </Typography>
                {isToday && (
                  <Box sx={{
                    bgcolor: 'rgba(255,255,255,0.25)',
                    color: 'white',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    px: 1,
                    py: 0.2,
                    borderRadius: '10px',
                    letterSpacing: 0.5,
                  }}>
                    TODAY
                  </Box>
                )}
              </Box>

              {/* Period rows */}
              {(() => {
                let skipCount = 0
                return periods.map((period, periodIdx) => {
                  if (skipCount > 0) {
                    skipCount--
                    return null
                  }

                  const cellData = getCellData(day.id, period.id)
                  const hasContent = !!cellData

                  // For multi-period entries, find the end time from the last spanned period
                  let endTime = period.end_time
                  if (cellData && cellData.num_periods > 1) {
                    const lastPeriodIdx = Math.min(periodIdx + cellData.num_periods - 1, periods.length - 1)
                    endTime = periods[lastPeriodIdx].end_time
                    skipCount = cellData.num_periods - 1
                  }

                  return (
                    <Box
                      key={`${day.id}-${period.id}`}
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        borderBottom: '1px solid #e8edf2',
                        p: 1.5,
                        bgcolor: hasContent && cellData?.is_lab ? '#E3F2FD' : hasContent ? '#E8F5E9' : 'inherit',
                        '&:last-child': { borderBottom: 'none' },
                        minHeight: 56,
                      }}
                    >
                      {/* Time column */}
                      <Box sx={{ minWidth: 72, mr: 1.5, pt: 0.25 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#2d6a6f', display: 'block', lineHeight: 1.4 }}>
                          {period.start_time?.substring(0, 5)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#8896a4', display: 'block', lineHeight: 1.4 }}>
                          {endTime?.substring(0, 5)}
                        </Typography>
                        {cellData && cellData.num_periods > 1 && (
                          <Typography variant="caption" sx={{ color: '#bbb', display: 'block', fontSize: '0.6rem' }}>
                            ×{cellData.num_periods} periods
                          </Typography>
                        )}
                      </Box>

                      {/* Content column */}
                      <Box sx={{ flex: 1 }}>
                        {hasContent ? (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1a2332' }}>
                              {cellData.subject_name}
                              {cellData.is_lab && ' (Lab)'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#555', display: 'block' }}>
                              [{cellData.class_name}{cellData.section ? ' - ' + cellData.section : ''}]
                              {cellData.room_no && ` | Room: ${cellData.room_no}`}
                            </Typography>
                            {cellData.role && (
                              <Typography variant="caption" sx={{ color: cellData.role === 'Lead' ? '#2d6a6f' : '#e67e22', fontWeight: 600, display: 'block' }}>
                                {cellData.role} Teacher
                              </Typography>
                            )}
                            {cellData.partner_ids && cellData.partner_ids.length > 0 && (
                              <Typography variant="caption" sx={{ color: '#8896a4', display: 'block' }}>
                                With: {getPartnerNames(cellData.partner_ids)}
                              </Typography>
                            )}
                            {cellData.programme_code && (
                              <Typography variant="caption" sx={{ color: '#8896a4', display: 'block' }}>
                                {cellData.programme_code}{cellData.semester_name ? ` / ${cellData.semester_name}` : ''}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ color: '#ccc', fontStyle: 'italic' }}>Free</Typography>
                        )}
                      </Box>
                    </Box>
                  )
                })
              })()}
            </Paper>
          )
        })}
      </Box>
    )
  }

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a2332', mb: 0.25 }}>Teacher Routine</Typography>
          <Typography variant="body2" sx={{ color: '#8896a4' }}>View and export individual teacher schedules</Typography>
        </Box>
      </Box>

      {/* Teacher Selection */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, border: '1px solid #e8edf2', borderRadius: '16px', backgroundColor: '#f8fafc' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: isMobile ? 'stretch' : 'center', flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
          <Autocomplete
            options={teachers}
            getOptionLabel={(option) => {
              const deptName = option.department_id 
                ? (departments.find(d => d.id === option.department_id)?.name || 'N/A')
                : 'Not Assigned'
              return `${option.name} (${deptName})`
            }}
            value={selectedTeacher}
            onChange={(event, newValue) => setSelectedTeacher(newValue)}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            disablePortal
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Teacher"
                placeholder="Type to search..."
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: '#ffffff' } }}
              />
            )}
            sx={{ minWidth: isMobile ? 'auto' : 340, flex: 1, width: isMobile ? '100%' : 'auto' }}
          />
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              sx={{ borderRadius: '10px', px: 2.5, textTransform: 'none', fontWeight: 600, borderColor: '#e8edf2', color: '#8896a4', '&:hover': { borderColor: '#2d6a6f', color: '#2d6a6f', backgroundColor: '#2d6a6f10' }, flex: isMobile ? 1 : 'none' }}
            >
              Refresh
            </Button>
            
            {!isMobile && (
              <Button
                variant="outlined"
                startIcon={<ExportIcon />}
                onClick={handleExportAllTeachers}
                sx={{ borderRadius: '10px', px: 2.5, textTransform: 'none', fontWeight: 600, borderColor: '#e8edf2', color: '#2d6a6f', '&:hover': { borderColor: '#2d6a6f', backgroundColor: '#2d6a6f10' } }}
              >
                Export All Teachers
              </Button>
            )}
          </Box>
          
          {selectedTeacher && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', width: isMobile ? '100%' : 'auto' }}>
              <Box 
                sx={{ 
                  bgcolor: '#2d6a6f', 
                  color: 'white', 
                  px: 2.5, 
                  py: 1, 
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  flex: isMobile ? 1 : 'none',
                  justifyContent: isMobile ? 'center' : 'flex-start',
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Total Load:
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  {totalLoad.toFixed(1)}
                </Typography>
              </Box>

              {!isMobile && (
                <Button
                  variant="contained"
                  startIcon={<ExportIcon />}
                  onClick={handleExportTeacherRoutine}
                  sx={{ borderRadius: '10px', px: 2.5, textTransform: 'none', fontWeight: 600, backgroundColor: '#2d6a6f', boxShadow: 'none', '&:hover': { backgroundColor: '#235558', boxShadow: 'none' } }}
                >
                  Export to Excel
                </Button>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      {/* Routine Table */}
      {selectedTeacher && (
        <Box sx={{ 
          mt: isMobile ? 1 : 3,
          ...(!isMobile && isFullscreen ? {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1300,
            bgcolor: 'white',
          } : {}),
        }}>
          {!isMobile && (
            <Box sx={{ 
              bgcolor: '#2d6a6f', 
              color: 'white', 
              p: 2, 
              mb: 0,
              borderRadius: isFullscreen ? 0 : '12px 12px 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Typography variant="h6">
                ROUTINE for Teacher: {getTeacherName()}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {loading && (
                  <Typography variant="body2">
                    Loading routine...
                  </Typography>
                )}
                <IconButton 
                  color="inherit"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                  size="small"
                >
                  {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
            </Box>
          </Box>
          )}

          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography>Loading routine data...</Typography>
            </Box>
          ) : isMobile ? (
            renderMobileRoutine()
          ) : (
            <TableContainer 
              component={Paper} 
              sx={{ 
                border: '1px solid #e8edf2', 
                height: isFullscreen ? 'calc(100vh - 64px)' : 'calc(100vh - 280px)',
                overflow: 'auto',
                borderRadius: isFullscreen ? 0 : '0 0 12px 12px',
              }}
            >
              <Table size="small" sx={{ 
                '& td, & th': { 
                  border: '1px solid #e8edf2', 
                  minWidth: 120,
                } 
              }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 700, minWidth: 100, color: '#1a2332' }}>
                      Days \ Time
                    </TableCell>
                    {periods.map((period) => (
                      <TableCell 
                        key={period.id} 
                        align="center"
                        sx={{ fontWeight: 700, color: '#1a2332' }}
                      >
                        {period.start_time?.substring(0, 5)}-{period.end_time?.substring(0, 5)}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {days.map((day) => (
                    <TableRow key={day.id}>
                      <TableCell 
                        component="th" 
                        scope="row"
                        sx={{ 
                          fontWeight: 700,
                          bgcolor: '#f8fafc',
                          color: '#1a2332',
                        }}
                      >
                        {day.name}
                      </TableCell>
                      {periods.map((period) => {
                        if (isCellSpanned(day.id, period.id)) {
                          return null // Skip this cell, it's part of a colspan
                        }

                        const cellData = getCellData(day.id, period.id)
                        
                        if (!cellData) {
                          return (
                            <TableCell 
                              key={period.id}
                              align="center"
                              sx={{ 
                                bgcolor: 'grey.50',
                                color: 'text.disabled',
                              }}
                            >
                              -
                            </TableCell>
                          )
                        }

                        return (
                          <TableCell
                            key={period.id}
                            colSpan={cellData.num_periods}
                            align="center"
                            sx={{ 
                              bgcolor: cellData.is_lab ? 'info.light' : 'success.light',
                              cursor: 'default',
                              p: 1,
                            }}
                          >
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {cellData.subject_name}
                                {cellData.is_lab && ' (Lab)'}
                                {cellData.is_lab && cellData.partner_ids.length > 0 && (
                                  <span style={{ fontWeight: 'normal' }}>
                                    {' with '}{getPartnerNames(cellData.partner_ids)}
                                  </span>
                                )}
                              </Typography>
                              <Typography variant="caption" display="block">
                                [{cellData.class_name}] {cellData.room_no && `Room: ${cellData.room_no}`}
                              </Typography>
                            </Box>
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}
    </Box>
  )
}
