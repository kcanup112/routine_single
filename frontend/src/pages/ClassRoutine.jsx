import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  Typography,
  Paper,
  Box,
  TextField,
  MenuItem,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material'
import { 
  Save as SaveIcon,
  FileDownload as ExportIcon,
  Delete as DeleteIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import * as XLSX from 'xlsx-js-style'
import api from '../services/api'
import { 
  programmeService, 
  classService, 
  semesterService, 
  semesterSubjectService,
  roomService,
  dayService,
  periodService,
  subjectService,
  teacherService,
  classRoutineService,
} from '../services'
import MultiSubjectLabDialog from '../components/MultiSubjectLabDialog'

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default function ClassRoutine() {
  const { isAdmin, isAuthenticated, isSchool } = useAuth()
  const canEdit = isAuthenticated && isAdmin()
  const school = isSchool()
  const [tabValue, setTabValue] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const fullscreenRef = React.useRef(null)
  
  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      // Enter fullscreen
      if (fullscreenRef.current?.requestFullscreen) {
        fullscreenRef.current.requestFullscreen()
      } else if (fullscreenRef.current?.webkitRequestFullscreen) { // Safari
        fullscreenRef.current.webkitRequestFullscreen()
      } else if (fullscreenRef.current?.msRequestFullscreen) { // IE11
        fullscreenRef.current.msRequestFullscreen()
      }
      setIsFullscreen(true)
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if (document.webkitExitFullscreen) { // Safari
        document.webkitExitFullscreen()
      } else if (document.msExitFullscreen) { // IE11
        document.msExitFullscreen()
      }
      setIsFullscreen(false)
    }
  }

  // Listen for fullscreen changes (e.g., user pressing Esc)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('msfullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('msfullscreenchange', handleFullscreenChange)
    }
  }, [])
  
  // Form data
  const [programmes, setProgrammes] = useState([])
  const [departments, setDepartments] = useState([])
  const [semesters, setSemesters] = useState([])
  const [classes, setClasses] = useState([])
  const [rooms, setRooms] = useState([])
  const [days, setDays] = useState([])
  const [periods, setPeriods] = useState([])
  const [subjects, setSubjects] = useState([])
  const [semesterSubjects, setSemesterSubjects] = useState([]) // Subjects for the selected semester
  const [teachers, setTeachers] = useState([])
  
  const [formData, setFormData] = useState({
    programme_id: '',   // engineering mode
    department_id: '',  // school mode
    semester_id: '',
    class_id: '',
    section: '',
    effective_date: null,
    room_no: '',
  })
  
  const [routineData, setRoutineData] = useState({})
  const [loading, setLoading] = useState(false)
  const [subjectSlotCounts, setSubjectSlotCounts] = useState({}) // Track remaining slots for each subject

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState(null)
  const [dropTargetAvailability, setDropTargetAvailability] = useState({}) // Track if drop targets are available

  // Calculate remaining slots for each subject
  const calculateSubjectSlots = () => {
    const counts = {}
    
    // Initialize with credit hours for each semester subject
    semesterSubjects.forEach(subject => {
      counts[subject.id] = {
        total: subject.credit_hours || 0,
        used: 0,
        remaining: subject.credit_hours || 0
      }
    })
    
    // Count how many periods each subject is assigned (excluding multi-subject labs)
    Object.values(routineData).forEach(assignment => {
      if (assignment.subject_id && assignment.subject_id !== 'BREAK' && assignment.subject_id !== 'LC') {
        // Skip multi-subject labs
        if (assignment.lab_subjects && assignment.lab_subjects.length > 0) {
          return // Don't count multi-subject lab assignments
        }
        
        // Regular subject assignment only
        if (counts[assignment.subject_id]) {
          const periods = assignment.num_periods || 1
          counts[assignment.subject_id].used += periods
          counts[assignment.subject_id].remaining = 
            counts[assignment.subject_id].total - counts[assignment.subject_id].used
        }
      }
    })
    
    setSubjectSlotCounts(counts)
  }

  // Assignment dialog state
  const [assignmentDialog, setAssignmentDialog] = useState({
    open: false,
    dayId: null,
    periodId: null,
    dayName: '',
    periodOrder: null,
  })

  const [assignmentForm, setAssignmentForm] = useState({
    subject_id: '',
    is_lab: false,
    is_half_lab: false,
    num_periods: 1,
    lead_teacher_id: '',
    assist_teacher_1_id: '',
    assist_teacher_2_id: '',
    room_no: '',
    group: '',
  })

  // For multi-subject lab sessions
  const [labSubjects, setLabSubjects] = useState([
    {
      subject_id: '',
      group: '',
      lab_room: '',
      lead_teacher_id: '',
      assist_teacher_1_id: '',
      assist_teacher_2_id: '',
    }
  ])
  const [activeLabTab, setActiveLabTab] = useState(0)
  const [multiLabDialogOpen, setMultiLabDialogOpen] = useState(false)
  const [currentLabCell, setCurrentLabCell] = useState(null) // {dayId, periodId}
  const [multiLabDialogInitialData, setMultiLabDialogInitialData] = useState(null) // For editing existing multi-subject labs

  const [teacherAvailability, setTeacherAvailability] = useState({
    lead_teacher: { checking: false, available: true, conflicts: [] },
    assist_teacher_1: { checking: false, available: true, conflicts: [] },
    assist_teacher_2: { checking: false, available: true, conflicts: [] },
  })

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  })

  const [autoSaveTimeout, setAutoSaveTimeout] = useState(null)

  // Load saved effective date from localStorage on mount
  useEffect(() => {
    const savedDate = localStorage.getItem('classRoutine_effectiveDate')
    if (savedDate) {
      setFormData(prev => ({ ...prev, effective_date: new Date(savedDate) }))
    }
  }, [])

  // Save effective date to localStorage whenever it changes
  useEffect(() => {
    if (formData.effective_date) {
      localStorage.setItem('classRoutine_effectiveDate', formData.effective_date.toISOString())
    }
  }, [formData.effective_date])

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (formData.programme_id) {
      loadSemesters(formData.programme_id)
    }
  }, [formData.programme_id])

  // School mode: load semesters (classes) when department changes
  useEffect(() => {
    if (school && formData.department_id) {
      semesterService.getByDepartment(formData.department_id).then(res => {
        setSemesters(res.data)
      }).catch(e => console.error('Error loading classes for department:', e))
    }
  }, [formData.department_id])

  useEffect(() => {
    if (formData.semester_id) {
      loadClasses(formData.semester_id)
      loadSemesterSubjects(formData.semester_id)
    }
  }, [formData.semester_id])

  useEffect(() => {
    // Load routine when class is selected
    if (formData.class_id) {
      loadRoutineForClass()
      loadPeriodsForClass()
    } else {
      // Clear routine and periods if class is deselected
      setRoutineData({})
      setPeriods([])
    }
  }, [formData.class_id])

  // Load periods based on selected class's shift
  const loadPeriodsForClass = async () => {
    if (!formData.class_id) {
      setPeriods([])
      return
    }
    
    try {
      const classObj = classes.find(c => c.id === parseInt(formData.class_id))
      if (!classObj) {
        console.warn('Class not found, loading all periods as fallback')
        const response = await periodService.getAll()
        setPeriods(response.data)
        return
      }
      
      if (!classObj.shift_id) {
        // If class has no shift assigned, load all periods (fallback)
        console.warn('Class has no shift assigned, loading all periods')
        const response = await periodService.getAll()
        setPeriods(response.data)
        return
      }
      
      // Load periods for the class's shift
      console.log(`Loading periods for shift ${classObj.shift_id}`)
      const response = await api.get(`/periods/shift/${classObj.shift_id}`)
      setPeriods(response.data)
    } catch (error) {
      console.error('Error loading periods for class:', error)
      // Fallback to all periods
      try {
        const response = await periodService.getAll()
        setPeriods(response.data)
      } catch (fallbackError) {
        console.error('Error loading fallback periods:', fallbackError)
      }
    }
  }

  // Auto-save routine when routineData changes
  useEffect(() => {
    // Don't auto-save if no class is selected
    if (!formData.class_id) {
      return
    }

    // Skip auto-save if routineData is empty (initial state or cleared)
    if (Object.keys(routineData).length === 0) {
      return
    }

    // Clear any existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout)
    }

    // Set a new timeout to save after 2 seconds of no changes (debounce)
    const timeout = setTimeout(() => {
      autoSaveRoutine()
    }, 2000)

    setAutoSaveTimeout(timeout)

    // Cleanup timeout on unmount
    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [routineData])

  // Recalculate subject slots when routine data or semester subjects change
  useEffect(() => {
    if (semesterSubjects.length > 0) {
      calculateSubjectSlots()
    }
  }, [routineData, semesterSubjects])

  // Real-time teacher availability checks
  useEffect(() => {
    if (assignmentForm.lead_teacher_id && assignmentDialog.open) {
      checkTeacherAvailabilityRealtime(assignmentForm.lead_teacher_id, 'lead_teacher')
    }
  }, [assignmentForm.lead_teacher_id, assignmentForm.num_periods])

  useEffect(() => {
    if (assignmentForm.assist_teacher_1_id && assignmentDialog.open) {
      checkTeacherAvailabilityRealtime(assignmentForm.assist_teacher_1_id, 'assist_teacher_1')
    }
  }, [assignmentForm.assist_teacher_1_id, assignmentForm.num_periods])

  useEffect(() => {
    if (assignmentForm.assist_teacher_2_id && assignmentDialog.open) {
      checkTeacherAvailabilityRealtime(assignmentForm.assist_teacher_2_id, 'assist_teacher_2')
    }
  }, [assignmentForm.assist_teacher_2_id, assignmentForm.num_periods])

  const autoSaveRoutine = async () => {
    if (!formData.class_id) return

    try {
      console.log('Auto-saving routine...')
      
      // Convert routineData object to array of entries
      const entries = []
      Object.entries(routineData).forEach(([key, value]) => {
        const [dayId, periodId] = key.split('-').map(Number)

        if (value.isContinuation) return

        // BREAK / LC → persist with subject_id=null, group='BREAK'/'LC'
        const isBreak = value.subject_id === 'BREAK'
        const isLC    = value.subject_id === 'LC'
        if (isBreak || isLC) {
          entries.push({
            dayId,
            periodId,
            subject_id: null,
            is_lab: false,
            is_half_lab: false,
            num_periods: value.num_periods || 1,
            lead_teacher_id: null,
            group: isBreak ? 'BREAK' : 'LC',
          })
          return
        }
        
        // If this is a multi-subject lab, create multiple entries
        if (value.lab_subjects && value.lab_subjects.length > 0) {
          value.lab_subjects.forEach(labSubject => {
            entries.push({
              dayId,
              periodId,
              subject_id: labSubject.subject_id,
              is_lab: true,
              is_half_lab: labSubject.is_half_lab || false,
              num_periods: labSubject.num_periods || value.num_periods || 1,
              lead_teacher_id: labSubject.lead_teacher_id || null,
              assist_teacher_1_id: labSubject.assist_teacher_1_id || null,
              assist_teacher_2_id: labSubject.assist_teacher_2_id || null,
              assist_teacher_3_id: labSubject.assist_teacher_3_id || null,
              room_no: value.room_no || null,
              group: labSubject.group || null,
              lab_room: labSubject.lab_room || null,
              lab_group_id: value.lab_group_id || null,
              isContinuation: value.isContinuation || false,
            })
          })
        } else {
          // Regular single entry
          entries.push({
            dayId,
            periodId,
            subject_id: value.subject_id,
            is_lab: value.is_lab || false,
            is_half_lab: value.is_half_lab || false,
            num_periods: value.num_periods || 1,
            lead_teacher_id: value.lead_teacher_id || null,
            assist_teacher_1_id: value.assist_teacher_1_id || null,
            assist_teacher_2_id: value.assist_teacher_2_id || null,
            room_no: value.room_no || null,
            group: value.group || null,
            lab_room: value.lab_room || null,
            lab_group_id: value.lab_group_id || null,
            isContinuation: value.isContinuation || false,
          })
        }
      })

      await classRoutineService.save(formData.class_id, entries, formData.room_no)
      console.log('Auto-save successful')
      
      // Show subtle success indicator
      setSnackbar({
        open: true,
        message: '✓ Auto-saved',
        severity: 'success',
      })
    } catch (error) {
      console.error('Auto-save error:', error)
      setSnackbar({
        open: true,
        message: 'Auto-save failed',
        severity: 'error',
      })
    }
  }

  const loadInitialData = async () => {
    try {
      const [progRes, roomRes, dayRes, subjectRes, teacherRes] = await Promise.all([
        programmeService.getAll(),
        roomService.getAll(),
        dayService.getAll(),
        // Don't load periods here - load based on class selection
        subjectService.getAll(),
        teacherService.getAll(),
      ])
      setProgrammes(progRes.data)
      setRooms(roomRes.data)
      setDays(dayRes.data)
      // setPeriods will be loaded when class is selected
      setSubjects(subjectRes.data)
      setTeachers(teacherRes.data)
      // School mode: also fetch departments
      if (school) {
        try {
          const { departmentService } = await import('../services')
          const deptRes = await departmentService.getAll()
          setDepartments(deptRes.data)
        } catch (e) {
          console.error('Error loading departments:', e)
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const loadSemesters = async (programmeId) => {
    try {
      const response = await semesterService.getByProgramme(programmeId)
      setSemesters(response.data)
    } catch (error) {
      console.error('Error loading semesters:', error)
    }
  }

  const loadClasses = async (semesterId) => {
    try {
      const response = await classService.getBySemester(semesterId)
      setClasses(response.data)
    } catch (error) {
      console.error('Error loading classes:', error)
    }
  }

  const loadSemesterSubjects = async (semesterId) => {
    try {
      const response = await semesterSubjectService.getSemesterSubjects(semesterId)
      // response.data contains the subjects associated with this semester
      setSemesterSubjects(response.data)
      console.log('Loaded semester subjects:', response.data)
    } catch (error) {
      console.error('Error loading semester subjects:', error)
      setSemesterSubjects([])
    }
  }

  const loadRoutineForClass = async () => {
    if (!formData.class_id) {
      setRoutineData({})
      return
    }

    setLoading(true)
    try {
      console.log('Loading routine for class:', formData.class_id)
      const response = await classRoutineService.getByClass(formData.class_id)
      console.log('Raw response:', response)
      
      // Backend returns array directly in response.data
      const entries = response.data || []
      console.log('Entries received:', entries)
      
      if (entries.length === 0) {
        console.log('No routine entries found for this class')
        setRoutineData({})
        setLoading(false)
        return
      }
      
      // Transform entries array to routineData object
      const newRoutineData = {}
      const labGroups = {} // Track multi-subject labs by lab_group_id
      
      // First pass: group multi-subject labs
      console.log('=== LOADING MULTI-SUBJECT LABS ===')
      entries.forEach(entry => {
        if (entry.lab_group_id) {
          console.log(`Found entry with lab_group_id: ${entry.lab_group_id}`, entry)
          if (!labGroups[entry.lab_group_id]) {
            labGroups[entry.lab_group_id] = {
              dayId: entry.dayId,
              periodId: entry.periodId,
              lab_subjects: [],
              is_half_lab: entry.is_half_lab,
              num_periods: entry.num_periods,
            }
          }
          labGroups[entry.lab_group_id].lab_subjects.push({
            subject_id: entry.subject_id,
            subject_name: entry.subject_name, // Add subject name
            lead_teacher_id: entry.lead_teacher_id,
            assist_teacher_1_id: entry.assist_teacher_1_id,
            assist_teacher_2_id: entry.assist_teacher_2_id,
            assist_teacher_3_id: entry.assist_teacher_3_id,
            group: entry.group,
            lab_room: entry.lab_room,
            is_half_lab: entry.is_half_lab, // Include individual lab subject's is_half_lab
            num_periods: entry.num_periods, // Include individual lab subject's num_periods
          })
        }
      })
      console.log('Lab groups after grouping:', labGroups)
      console.log('=== END LOADING DEBUG ===')
      
      // Second pass: create routine data entries
      entries.forEach(entry => {
        const baseKey = `${entry.dayId}-${entry.periodId}`
        
        // Skip if this is part of a multi-subject lab and not the first one
        if (entry.lab_group_id && newRoutineData[baseKey]?.lab_group_id === entry.lab_group_id) {
          return
        }
        
        // Create the main cell
        if (entry.lab_group_id && labGroups[entry.lab_group_id]) {
          // Multi-subject lab
          const labGroup = labGroups[entry.lab_group_id]
          console.log(`Creating multi-subject lab at ${baseKey}:`, labGroup.lab_subjects)
          newRoutineData[baseKey] = {
            subject_id: entry.subject_id, // Store first subject as primary
            subject_name: entry.subject_name,
            is_lab: true,
            is_half_lab: entry.is_half_lab,
            num_periods: entry.num_periods,
            lead_teacher_id: entry.lead_teacher_id,
            lead_teacher_name: entry.lead_teacher_name,
            assist_teacher_1_id: entry.assist_teacher_1_id,
            assist_teacher_1_name: entry.assist_teacher_1_name,
            assist_teacher_2_id: entry.assist_teacher_2_id,
            assist_teacher_2_name: entry.assist_teacher_2_name,
            lab_group_id: entry.lab_group_id,
            lab_subjects: labGroup.lab_subjects,
          }
          console.log(`Stored routineData[${baseKey}]:`, newRoutineData[baseKey])
        } else {
          // Regular single entry
          newRoutineData[baseKey] = {
            subject_id: entry.subject_id,
            subject_name: entry.subject_name,
            is_lab: entry.is_lab,
            is_half_lab: entry.is_half_lab,
            num_periods: entry.num_periods,
            lead_teacher_id: entry.lead_teacher_id,
            lead_teacher_name: entry.lead_teacher_name,
            assist_teacher_1_id: entry.assist_teacher_1_id,
            assist_teacher_1_name: entry.assist_teacher_1_name,
            assist_teacher_2_id: entry.assist_teacher_2_id,
            assist_teacher_2_name: entry.assist_teacher_2_name,
            group: entry.group,
            lab_room: entry.lab_room,
          }
        }
        
        // Create continuation cells for multi-period assignments
        if (entry.num_periods > 1 && periods.length > 0) {
          const startPeriodIndex = periods.findIndex(p => p.id === entry.periodId)
          if (startPeriodIndex !== -1) {
            for (let i = 1; i < entry.num_periods; i++) {
              if (startPeriodIndex + i < periods.length) {
                const nextPeriod = periods[startPeriodIndex + i]
                const contKey = `${entry.dayId}-${nextPeriod.id}`
                newRoutineData[contKey] = {
                  isContinuation: true,
                  subject_name: entry.subject_name,
                }
              }
            }
          }
        }
      })
      
      setRoutineData(newRoutineData)
      console.log('Routine loaded successfully:', newRoutineData)
    } catch (error) {
      console.error('Error loading routine:', error)
      // Clear routine data on error
      setRoutineData({})
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!formData.class_id) {
      setSnackbar({
        open: true,
        message: 'Please select a class first',
        severity: 'warning',
      })
      return
    }

    try {
      console.log('Saving routine for class:', formData.class_id)
      console.log('Current routineData:', routineData)
      
      // Convert routineData object to array of entries
      const entries = []
      Object.entries(routineData).forEach(([key, value]) => {
        const [dayId, periodId] = key.split('-').map(Number)

        if (value.isContinuation) return

        // BREAK / LC → persist with subject_id=null, group='BREAK'/'LC'
        const isBreak = value.subject_id === 'BREAK'
        const isLC    = value.subject_id === 'LC'
        if (isBreak || isLC) {
          entries.push({
            dayId,
            periodId,
            subject_id: null,
            is_lab: false,
            is_half_lab: false,
            num_periods: value.num_periods || 1,
            lead_teacher_id: null,
            group: isBreak ? 'BREAK' : 'LC',
          })
          return
        }
        
        // If this is a multi-subject lab, create multiple entries
        if (value.lab_subjects && value.lab_subjects.length > 0) {
          console.log(`Found multi-subject lab at ${key}:`, value.lab_subjects)
          value.lab_subjects.forEach(labSubject => {
            entries.push({
              dayId,
              periodId,
              subject_id: labSubject.subject_id,
              is_lab: true,
              is_half_lab: labSubject.is_half_lab || false,
              num_periods: value.num_periods || 1,
              lead_teacher_id: labSubject.lead_teacher_id || null,
              assist_teacher_1_id: labSubject.assist_teacher_1_id || null,
              assist_teacher_2_id: labSubject.assist_teacher_2_id || null,
              room_no: value.room_no || null,
              group: labSubject.group || null,
              lab_room: labSubject.lab_room || null,
              lab_group_id: value.lab_group_id || null,
              isContinuation: value.isContinuation || false,
            })
          })
          console.log(`Created ${value.lab_subjects.length} entries for multi-subject lab`)
        } else {
          // Regular single entry
          entries.push({
            dayId,
            periodId,
            subject_id: value.subject_id,
            is_lab: value.is_lab || false,
            is_half_lab: value.is_half_lab || false,
            num_periods: value.num_periods || 1,
            lead_teacher_id: value.lead_teacher_id || null,
            assist_teacher_1_id: value.assist_teacher_1_id || null,
            assist_teacher_2_id: value.assist_teacher_2_id || null,
            room_no: value.room_no || null,
            group: value.group || null,
            lab_room: value.lab_room || null,
            lab_group_id: value.lab_group_id || null,
            isContinuation: value.isContinuation || false,
          })
        }
      })

      console.log('Sending entries to backend:', entries)
      console.log('Sending room_no:', formData.room_no)
      const response = await classRoutineService.save(formData.class_id, entries, formData.room_no)
      console.log('Save response:', response)
      
      setSnackbar({
        open: true,
        message: `Routine saved successfully! (${entries.length} entries)`,
        severity: 'success',
      })
    } catch (error) {
      console.error('Error saving routine:', error)
      setSnackbar({
        open: true,
        message: 'Failed to save routine. Please try again.',
        severity: 'error',
      })
    }
  }

  const handleExport = () => {
    if (!formData.class_id) {
      alert('Please select a class first')
      return
    }

    // Get class name and room number
    const selectedClass = classes.find(c => c.id === formData.class_id)
    const className = selectedClass?.name || 'Class'
    const sectionName = formData.section || selectedClass?.section || ''
    const roomNumber = formData.room_no || selectedClass?.room_no || 'N/A'
    const effectiveDate = formData.effective_date 
      ? new Date(formData.effective_date).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      : 'N/A'

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const wsData = []

    // Row 1: Institution Name (centered, merged)
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    const institutionName = user.tenant_name || 'Institution'
    wsData.push([institutionName])
    
    // Row 2: Class Routine (centered)
    wsData.push(['Class Routine'])
    
    // Row 3: Class name (left) and Room number (right)
    const row3 = new Array(periods.length + 1).fill('')
    row3[0] = `Class: ${className}${sectionName ? ' - Section: ' + sectionName : ''}`
    row3[periods.length] = `Room: ${roomNumber}`
    wsData.push(row3)
    
    // Row 4: Effective From Date (left)
    wsData.push([`Effective From: ${effectiveDate}`])
    
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
      periods.forEach((period, idx) => {
        if (skipCount > 0) {
          skipCount--
          row.push('') // Add empty cell for merged periods
          return
        }
        
        const key = `${day.id}-${period.id}`
        const cellData = routineData[key]
        
        if (!cellData) {
          // Auto-display B for break-type periods
          if (period.type === 'break' || period.is_teaching_period === false) {
            row.push('B')
          } else {
            row.push('-')
          }
        } else {
          // Format cell content
          let cellContent = ''
          
          if (cellData.subject_id === 'BREAK') {
            cellContent = 'B'
          } else if (cellData.subject_id === 'LC') {
            cellContent = 'LC (Library Consultation)'
          } else if (cellData.lab_subjects && cellData.lab_subjects.length > 0) {
            // Multi-subject lab - display all subjects
            cellData.lab_subjects.forEach((labSubject, index) => {
              if (index > 0) cellContent += '\n--------------------\n'
              
              // Try to find subject in semesterSubjects first, then in all subjects
              let subject = semesterSubjects.find(s => s.id === labSubject.subject_id)
              if (!subject) {
                subject = subjects.find(s => s.id === labSubject.subject_id)
              }
              
              // Use subject name if found, otherwise try to get from stored data
              let subjectName = subject?.name
              if (!subjectName && labSubject.subject_name) {
                subjectName = labSubject.subject_name
              }
              if (!subjectName) {
                subjectName = 'Unknown Subject'
                console.log('Could not find subject for ID:', labSubject.subject_id, 'Available subjects:', subjects.map(s => ({id: s.id, name: s.name})))
              }
              
              cellContent += subjectName
              
              // Add teachers
              const teacherAbbrs = []
              const leadTeacher = teachers.find(t => t.id === labSubject.lead_teacher_id)
              if (leadTeacher) teacherAbbrs.push(leadTeacher.abbreviation || leadTeacher.name)
              
              if (labSubject.assist_teacher_1_id) {
                const assist1 = teachers.find(t => t.id === labSubject.assist_teacher_1_id)
                if (assist1) teacherAbbrs.push(assist1.abbreviation || assist1.name)
              }
              if (labSubject.assist_teacher_2_id) {
                const assist2 = teachers.find(t => t.id === labSubject.assist_teacher_2_id)
                if (assist2) teacherAbbrs.push(assist2.abbreviation || assist2.name)
              }
              
              if (teacherAbbrs.length > 0) {
                cellContent += `\n(${teacherAbbrs.join('+')})`
              }
              
              // Add room and group
              if (labSubject.lab_room || labSubject.group) {
                cellContent += `\n${labSubject.lab_room || ''} - ${labSubject.group || ''}`
              }
            })
          } else {
            const subject = semesterSubjects.find(s => s.id === cellData.subject_id)
            cellContent = subject?.name || cellData.subject_name || 'N/A'
            
            if (cellData.is_lab) {
              cellContent += ' (Lab)'
            }
            
            // Add teachers with abbreviation in brackets
            const leadTeacher = teachers.find(t => t.id === cellData.lead_teacher_id)
            if (leadTeacher) {
              cellContent += `\n(${leadTeacher.abbreviation || leadTeacher.name})`
            }
            
            if (cellData.assist_teacher_1_id || cellData.assist_teacher_2_id) {
              const assistants = []
              if (cellData.assist_teacher_1_id) {
                const assist1 = teachers.find(t => t.id === cellData.assist_teacher_1_id)
                if (assist1) assistants.push(`(${assist1.abbreviation || assist1.name})`)
              }
              if (cellData.assist_teacher_2_id) {
                const assist2 = teachers.find(t => t.id === cellData.assist_teacher_2_id)
                if (assist2) assistants.push(`(${assist2.abbreviation || assist2.name})`)
              }
              if (assistants.length > 0) {
                cellContent += `, ${assistants.join(', ')}`
              }
            }
            
            // Add room and group info for labs
            if (cellData.is_lab) {
              if (cellData.room_no) {
                cellContent += `\nRoom: ${cellData.room_no}`
              }
              if (cellData.group) {
                cellContent += `\nGroup: ${cellData.group}`
              }
            }
          }
          
          row.push(cellContent)
          
          // Handle multi-period spanning
          if (cellData.num_periods > 1) {
            skipCount = cellData.num_periods - 1
          }
        }
      })
      
      wsData.push(row)
    })

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // Set column widths - wider to accommodate more text
    const colWidths = [{ wch: 12 }] // Day column
    periods.forEach(() => {
      colWidths.push({ wch: 20 }) // Wider period columns for better text display
    })
    ws['!cols'] = colWidths

    // Dynamically calculate row heights based on content
    const rowHeights = []
    rowHeights[0] = { hpt: 24 }
    rowHeights[1] = { hpt: 20 }
    rowHeights[2] = { hpt: 18 }
    rowHeights[3] = { hpt: 18 }
    rowHeights[4] = { hpt: 5 }
    rowHeights[5] = { hpt: 20 }
    
    // Calculate heights for data rows
    days.forEach((day, dayIdx) => {
      let maxLines = 1
      
      periods.forEach((period) => {
        const key = `${day.id}-${period.id}`
        const cellData = routineData[key]
        
        if (cellData && !cellData.isContinuation) {
          // Count newlines in the cell content to estimate height
          let cellText = ''
          
          if (cellData.subject_id === 'BREAK') {
            cellText = 'BREAK'
          } else if (cellData.subject_id === 'LC') {
            cellText = 'LC (Library Consultation)'
          } else if (cellData.lab_subjects && cellData.lab_subjects.length > 0) {
            // Multi-subject lab - count all content
            cellData.lab_subjects.forEach((labSubject, index) => {
              if (index > 0) cellText += '\n--------------------\n'
              cellText += 'Subject\n' // subject name
              cellText += '(Teachers)\n' // teachers
              cellText += 'Room - Group\n' // room and group
            })
          } else {
            // Regular subject - estimate lines
            cellText = 'Subject\n' // subject name
            if (cellData.lead_teacher_id) {
              cellText += '(Teacher)\n'
            }
            if (cellData.is_lab) {
              if (cellData.room_no) cellText += 'Room\n'
              if (cellData.group) cellText += 'Group\n'
            }
          }
          
          const lineCount = (cellText.match(/\n/g) || []).length + 1
          maxLines = Math.max(maxLines, lineCount)
        }
      })
      
      // Set row height based on number of lines (approximately 15 points per line)
      const rowIndex = 6 + dayIdx
      rowHeights[rowIndex] = { hpt: Math.max(60, maxLines * 15) }
    })
    
    ws['!rows'] = rowHeights

    // Merge cells for title rows and multi-period entries
    const merges = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: periods.length } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: periods.length } },
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
        const cellData = routineData[key]
        
        if (cellData && cellData.num_periods > 1) {
          // Merge cells horizontally for multi-period classes
          const rowIndex = 6 + dayIdx // Data starts at row 6
          const startCol = periodIdx + 1 // +1 because column 0 is day name
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
        
        // Default style with borders and wrapping
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
        
        // Row 1: College name
        if (R === 0) {
          ws[cellAddress].s = {
            font: { bold: true, sz: 16 },
            alignment: { horizontal: 'center', vertical: 'center' }
          }
        }
        
        // Row 2: Class Routine
        if (R === 1) {
          ws[cellAddress].s = {
            font: { bold: true, sz: 14 },
            alignment: { horizontal: 'center', vertical: 'center' }
          }
        }
        
        // Row 3: Class and Room
        if (R === 2) {
          ws[cellAddress].s = {
            font: { bold: true },
            alignment: { 
              horizontal: C === 0 ? 'left' : (C === periods.length ? 'right' : 'center'),
              vertical: 'center'
            }
          }
        }
        
        // Row 4: Effective Date
        if (R === 3) {
          ws[cellAddress].s = {
            font: { bold: true },
            alignment: { horizontal: 'left', vertical: 'center' }
          }
        }
        
        // Row 5: Empty
        if (R === 4) {
          ws[cellAddress].s = {}
        }
        
        // Row 6: Header
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
        
        // Data rows
        if (R >= 6) {
          if (C === 0) {
            // Day column - bold, gray background
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
          } else {
            // Data cells - enable text wrapping and vertical top alignment
            ws[cellAddress].s = {
              border: {
                top: { style: 'thin' },
                bottom: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' }
              },
              alignment: { 
                horizontal: 'center', 
                vertical: 'top',  // Align to top for better readability
                wrapText: true    // Enable text wrapping
              },
              font: { sz: 10 }  // Slightly smaller font for data
            }
            // Bold + centered for Break cells
            if (ws[cellAddress].v === 'B') {
              ws[cellAddress].s = {
                font: { bold: true, sz: 14 },
                fill: { fgColor: { rgb: 'FFF3E0' } },
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
      }
    }

    // Page setup for A4 landscape printing
    ws['!pageSetup'] = {
      orientation: 'landscape',
      paperSize: 9, // A4
      fitToWidth: 1, // Fit to 1 page wide
      fitToHeight: 0, // Allow multiple pages vertically if needed
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

    // Set print area to include all data
    const maxRow = 5 + days.length // Header rows + data rows
    const maxCol = periods.length // All period columns
    ws['!printArea'] = `A1:${XLSX.utils.encode_col(maxCol)}${maxRow + 1}`

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Class Routine')

    // Generate filename
    const filename = `Class_Routine_${className.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`

    // Save file
    XLSX.writeFile(wb, filename)
  }

  const handleExportAll = async () => {
    if (classes.length === 0) {
      alert('No classes available to export')
      return
    }

    // Create workbook
    const wb = XLSX.utils.book_new()

    // Fetch all class routines
    try {
      const allRoutines = await classRoutineService.getAll()
      const routinesData = allRoutines.data || []

      // Group routines by class
      const routinesByClass = {}
      routinesData.forEach(routine => {
        const classId = routine.class_id
        if (!routinesByClass[classId]) {
          routinesByClass[classId] = []
        }
        routinesByClass[classId].push(routine)
      })

      // Create a sheet for each class
      classes.forEach((classItem, index) => {
        const classRoutines = routinesByClass[classItem.id] || []
        
        // Build routine map for this class
        const classRoutineMap = {}
        classRoutines.forEach(entry => {
          const key = `${entry.day_id}-${entry.period_id}`
          classRoutineMap[key] = entry
        })

        // Create worksheet data
        const wsData = []
        const className = classItem.name
        const sectionName = classItem.section || ''
        const roomNumber = classItem.room_no || 'N/A'

        // Header rows
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        const institutionName = user.tenant_name || 'Institution'
        wsData.push([institutionName])
        wsData.push(['Class Routine'])
        
        const row3 = new Array(periods.length + 1).fill('')
        row3[0] = `Class: ${className}${sectionName ? ' - Section: ' + sectionName : ''}`
        row3[periods.length] = `Room: ${roomNumber}`
        wsData.push(row3)
        
        wsData.push(['Effective From: N/A'])
        wsData.push([])
        
        // Header row with periods
        const headerRow = ['Days \\ Time']
        periods.forEach(period => {
          headerRow.push(`${period.start_time?.substring(0, 5)}-${period.end_time?.substring(0, 5)}`)
        })
        wsData.push(headerRow)
        
        // Data rows
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
            const cellData = classRoutineMap[key]
            
            if (!cellData) {
              // Auto-display B for break-type periods
              if (period.type === 'break' || period.is_teaching_period === false) {
                row.push('B')
              } else {
                row.push('-')
              }
            } else {
              let cellContent = ''
              
              if (cellData.subject_id === 'BREAK') {
                cellContent = 'B'
              } else if (cellData.subject_id === 'LC') {
                cellContent = 'LC (Library Consultation)'
              } else {
                const subject = cellData.subject
                cellContent = subject?.name || 'N/A'
                
                if (cellData.is_lab) {
                  cellContent += ' (Lab)'
                }
                
                // Add teachers with abbreviation in brackets
                const leadTeacherId = cellData.lead_teacher_id
                if (leadTeacherId) {
                  const leadTeacher = teachers.find(t => t.id === leadTeacherId)
                  if (leadTeacher) {
                    cellContent += `\n(${leadTeacher.abbreviation || leadTeacher.name})`
                  }
                }
                
                if (cellData.assist_teacher_1_id || cellData.assist_teacher_2_id) {
                  const assistants = []
                  if (cellData.assist_teacher_1_id) {
                    const assist1 = teachers.find(t => t.id === cellData.assist_teacher_1_id)
                    if (assist1) assistants.push(`(${assist1.abbreviation || assist1.name})`)
                  }
                  if (cellData.assist_teacher_2_id) {
                    const assist2 = teachers.find(t => t.id === cellData.assist_teacher_2_id)
                    if (assist2) assistants.push(`(${assist2.abbreviation || assist2.name})`)
                  }
                  if (assistants.length > 0) {
                    cellContent += `, ${assistants.join(', ')}`
                  }
                }
                
                if (cellData.is_lab) {
                  if (cellData.room_no) {
                    cellContent += `\nRoom: ${cellData.room_no}`
                  }
                  if (cellData.group) {
                    cellContent += `\nGroup: ${cellData.group}`
                  }
                }
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
        const colWidths = [{ wch: 11.27 }] // Day column
        periods.forEach(() => {
          colWidths.push({ wch: 11.27 }) // Period columns
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
            const cellData = classRoutineMap[key]
            
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
                  horizontal: C === 0 ? 'left' : (C === periods.length ? 'right' : 'center'),
                  vertical: 'center'
                }
              }
            }
            if (R === 3) {
              ws[cellAddress].s = {
                font: { bold: true },
                alignment: { horizontal: 'left', vertical: 'center' }
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
            // Bold + centered for Break cells
            if (R >= 6 && C > 0 && ws[cellAddress].v === 'B') {
              ws[cellAddress].s = {
                font: { bold: true, sz: 14 },
                fill: { fgColor: { rgb: 'FFF3E0' } },
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
          paperSize: 9, // A4
          fitToWidth: 1, // Fit to 1 page wide
          fitToHeight: 0, // Allow multiple pages vertically if needed
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

        // Set print area to include all data
        const maxRow = 5 + days.length // Header rows + data rows
        const maxCol = periods.length // All period columns
        ws['!printArea'] = `A1:${XLSX.utils.encode_col(maxCol)}${maxRow + 1}`

        // Add worksheet with sanitized class name
        // Remove invalid characters: : \ / ? * [ ]
        let sheetName = className.replace(/[:\\\/\?\*\[\]]/g, '-')
        sheetName = sheetName.substring(0, 31) // Excel sheet name max 31 chars
        XLSX.utils.book_append_sheet(wb, ws, sheetName)
      })

      // Save file
      const filename = `All_Class_Routines_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, filename)

    } catch (error) {
      console.error('Error exporting all routines:', error)
      alert('Failed to export all routines. Please try again.')
    }
  }

  const handleExportDayWise = async () => {
    try {
      // Fetch ALL classes from all semesters
      const allClassesResponse = await classService.getAll()
      const allClasses = allClassesResponse.data || []
      
      if (allClasses.length === 0) {
        alert('No classes available to export')
        return
      }

      // Fetch ALL subjects (not just semester-specific)
      const allSubjectsResponse = await subjectService.getAll()
      const allSubjects = allSubjectsResponse.data || []

      // Fetch ALL teachers
      const allTeachersResponse = await teacherService.getAll()
      const allTeachers = allTeachersResponse.data || []

      // Fetch all class routines
      const allRoutines = await classRoutineService.getAll()
      const routinesData = allRoutines.data || []

      // Group routines by class
      const routinesByClass = {}
      routinesData.forEach(routine => {
        const classId = routine.class_id
        if (!routinesByClass[classId]) {
          routinesByClass[classId] = []
        }
        routinesByClass[classId].push(routine)
      })

      // Create workbook
      const wb = XLSX.utils.book_new()

      // Filter days Sunday to Thursday
      const workDays = days.filter(day => {
        const dayName = day.name.toLowerCase()
        return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'].includes(dayName)
      })

      // Create a sheet for each day
      workDays.forEach(day => {
        const wsData = []
        
        // Row 1: Header with time slots
        const headerRow = ['Class \\ Time']
        periods.forEach(period => {
          headerRow.push(`${period.start_time?.substring(0, 5)}-${period.end_time?.substring(0, 5)}`)
        })
        wsData.push(headerRow)

        // Rows 2+: Each class from ALL classes
        allClasses.forEach(classItem => {
          const classRoutines = routinesByClass[classItem.id] || []
          
          // Build routine map for this class - store as arrays to handle multiple sessions
          const classRoutineMap = {}
          classRoutines.forEach(entry => {
            const key = `${entry.day_id}-${entry.period_id}`
            if (!classRoutineMap[key]) {
              classRoutineMap[key] = []
            }
            classRoutineMap[key].push(entry)
          })

          // Create row for this class
          const classLabel = `${classItem.name}${classItem.section ? ' (' + classItem.section + ')' : ''}
[${classItem.room_no || 'N/A'}]`
          const row = [classLabel]
          
          let skipCount = 0
          periods.forEach((period) => {
            if (skipCount > 0) {
              skipCount--
              row.push('') // Empty cell for multi-period continuation
              return
            }

            const key = `${day.id}-${period.id}`
            const cellDataArray = classRoutineMap[key] || []
            
            let cellContent = ''
            
            if (cellDataArray.length === 0) {
              // Auto-display B for break-type periods
              if (period.type === 'break' || period.is_teaching_period === false) {
                cellContent = 'B'
              }
            } else {
              // Process each session (could be multiple lab sessions)
              cellDataArray.forEach((cellData, sessionIndex) => {
                if (sessionIndex > 0) {
                  cellContent += '\n--------------------\n'
                }
                
                if (cellData.isContinuation) {
                  // Skip continuation cells
                  return
                } else if (cellData.subject_id === 'BREAK') {
                  cellContent += 'B'
                } else if (cellData.subject_id === 'LC') {
                  cellContent += 'LC'
                } else if (cellData.lab_subjects && cellData.lab_subjects.length > 0) {
                  // Multi-subject lab
                  cellData.lab_subjects.forEach((labSubject, index) => {
                    if (index > 0) cellContent += '\n'
                    
                    // Get subject name from all subjects
                    let subject = allSubjects.find(s => s.id === labSubject.subject_id)
                    let subjectName = subject?.name || labSubject.subject_name || 'Unknown Subject'
                    
                    // Format: Subject Name LAB (Group)(Lab Room) (Teachers)
                    cellContent += `${subjectName} LAB`
                    
                    if (labSubject.group) {
                      cellContent += ` (${labSubject.group})`
                    }
                    
                    if (labSubject.lab_room) {
                      cellContent += `(Lab:${labSubject.lab_room})`
                    }
                    
                    // Teachers
                    const teacherAbbrs = []
                    const leadTeacher = allTeachers.find(t => t.id === labSubject.lead_teacher_id)
                    if (leadTeacher) teacherAbbrs.push(leadTeacher.abbreviation || leadTeacher.name)
                    
                    if (labSubject.assist_teacher_1_id) {
                      const assist1 = allTeachers.find(t => t.id === labSubject.assist_teacher_1_id)
                      if (assist1) teacherAbbrs.push(assist1.abbreviation || assist1.name)
                    }
                    if (labSubject.assist_teacher_2_id) {
                      const assist2 = allTeachers.find(t => t.id === labSubject.assist_teacher_2_id)
                      if (assist2) teacherAbbrs.push(assist2.abbreviation || assist2.name)
                    }
                    
                    if (teacherAbbrs.length > 0) {
                      cellContent += ` (${teacherAbbrs.join(' + ')})`
                    }
                  })
                } else {
                  // Regular subject
                  const subject = allSubjects.find(s => s.id === cellData.subject_id)
                  cellContent += subject?.name || 'N/A'
                  
                  // Teachers with abbreviations
                  const leadTeacher = allTeachers.find(t => t.id === cellData.lead_teacher_id)
                  if (leadTeacher) {
                    cellContent += ` (${leadTeacher.abbreviation || leadTeacher.name})`
                  }
                  
                  // Lab details
                  if (cellData.is_lab) {
                    if (cellData.group) {
                      cellContent += ` (${cellData.group})`
                    }
                    if (cellData.room_no) {
                      cellContent += `(Lab:${cellData.room_no})`
                    }
                  }
                }
                
                // Handle multi-period spanning for the first session only
                if (sessionIndex === 0 && cellData.num_periods > 1) {
                  skipCount = cellData.num_periods - 1
                }
              })
            }
            
            row.push(cellContent)
          })
          
          wsData.push(row)
        })

        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(wsData)

        // Set column widths
        const colWidths = [{ wch: 20 }] // Class column (wider for class name + room)
        periods.forEach(() => {
          colWidths.push({ wch: 25 }) // Period columns (wide enough for multi-line content)
        })
        ws['!cols'] = colWidths

        // Calculate row heights dynamically
        const rowHeights = []
        rowHeights[0] = { hpt: 30 } // Header row
        
        wsData.forEach((row, idx) => {
          if (idx > 0) {
            let maxLines = 1
            row.forEach(cell => {
              if (cell) {
                const lineCount = (String(cell).match(/\n/g) || []).length + 1
                maxLines = Math.max(maxLines, lineCount)
              }
            })
            rowHeights[idx] = { hpt: Math.max(25, maxLines * 15) }
          }
        })
        
        ws['!rows'] = rowHeights

        // Apply cell styling
        const range = XLSX.utils.decode_range(ws['!ref'])
        for (let R = range.s.r; R <= range.e.r; R++) {
          for (let C = range.s.c; C <= range.e.c; C++) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
            if (!ws[cellAddress]) continue

            // Header row
            if (R === 0) {
              ws[cellAddress].s = {
                font: { bold: true, sz: 11 },
                fill: { fgColor: { rgb: 'D3D3D3' } },
                border: {
                  top: { style: 'thin' },
                  bottom: { style: 'thin' },
                  left: { style: 'thin' },
                  right: { style: 'thin' }
                },
                alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
              }
            } else {
              // Data rows
              if (C === 0) {
                // Class column
                ws[cellAddress].s = {
                  font: { bold: true, sz: 10 },
                  fill: { fgColor: { rgb: 'F0F0F0' } },
                  border: {
                    top: { style: 'thin' },
                    bottom: { style: 'thin' },
                    left: { style: 'thin' },
                    right: { style: 'thin' }
                  },
                  alignment: { horizontal: 'left', vertical: 'center', wrapText: true }
                }
              } else {
                // Period data cells
                ws[cellAddress].s = {
                  border: {
                    top: { style: 'thin' },
                    bottom: { style: 'thin' },
                    left: { style: 'thin' },
                    right: { style: 'thin' }
                  },
                  alignment: { 
                    horizontal: 'left', 
                    vertical: 'top',
                    wrapText: true 
                  },
                  font: { sz: 9 }
                }
                // Bold + centered for Break cells
                if (ws[cellAddress].v === 'B') {
                  ws[cellAddress].s = {
                    font: { bold: true, sz: 14 },
                    fill: { fgColor: { rgb: 'FFF3E0' } },
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
          }
        }

        // Page setup for A4 landscape printing
        ws['!pageSetup'] = {
          orientation: 'landscape',
          paperSize: 9, // A4
          fitToWidth: 1,
          fitToHeight: 0,
          scale: 85 // Slightly reduced to fit more content
        }

        ws['!margins'] = {
          left: 0.4,
          right: 0.4,
          top: 0.5,
          bottom: 0.5
        }

        // Sanitize sheet name
        let sheetName = day.name.substring(0, 31)
        XLSX.utils.book_append_sheet(wb, ws, sheetName)
      })

      // Generate filename
      const filename = `Day_Wise_Routine_${new Date().toISOString().split('T')[0]}.xlsx`

      // Save file
      XLSX.writeFile(wb, filename)

    } catch (error) {
      console.error('Error exporting day-wise routines:', error)
      alert('Failed to export day-wise routines. Please try again.')
    }
  }

  const handleOpenAssignment = (dayId, periodId, dayName, periodOrder) => {
    const key = `${dayId}-${periodId}`
    const existing = routineData[key]
    
    if (existing) {
      // Check if this is a multi-subject lab
      if (existing.lab_subjects && existing.lab_subjects.length > 0) {
        // Open multi-subject lab dialog with existing data
        setCurrentLabCell({ dayId, periodId })
        setAssignmentForm({
          subject_id: '',
          is_lab: true,
          is_half_lab: false,
          num_periods: existing.num_periods || 1,
          lead_teacher_id: '',
          assist_teacher_1_id: '',
          assist_teacher_2_id: '',
          room_no: '',
          group: '',
        })
        // Set initial lab subjects data for editing
        const labSubjectsToEdit = JSON.parse(JSON.stringify(existing.lab_subjects))
        setMultiLabDialogInitialData(labSubjectsToEdit)
        setMultiLabDialogOpen(true)
        return
      }
      
      // Regular single assignment
      setAssignmentForm({
        subject_id: existing.subject_id || '',
        is_lab: existing.is_lab || false,
        is_half_lab: existing.is_half_lab || false,
        num_periods: existing.num_periods || 1,
        lead_teacher_id: existing.lead_teacher_id || '',
        assist_teacher_1_id: existing.assist_teacher_1_id || '',
        assist_teacher_2_id: existing.assist_teacher_2_id || '',
        room_no: existing.room_no || '',
        group: existing.group || '',
      })
    } else {
      setAssignmentForm({
        subject_id: '',
        is_lab: false,
        is_half_lab: false,
        num_periods: 1,
        lead_teacher_id: '',
        assist_teacher_1_id: '',
        assist_teacher_2_id: '',
        room_no: '',
        group: '',
      })
    }
    
    setAssignmentDialog({
      open: true,
      dayId,
      periodId,
      dayName,
      periodOrder,
    })
  }

  const checkTeacherAvailabilityRealtime = async (teacherId, teacherType) => {
    if (!teacherId || !assignmentDialog.dayId || !assignmentDialog.periodId) {
      console.log('Skipping availability check - missing data:', { teacherId, dayId: assignmentDialog.dayId, periodId: assignmentDialog.periodId })
      return
    }

    // Set checking status
    setTeacherAvailability(prev => ({
      ...prev,
      [teacherType]: { checking: true, available: true, conflicts: [] }
    }))

    try {
      const { dayId, periodId } = assignmentDialog
      
      // Get affected period IDs based on num_periods
      const currentPeriodIndex = periods.findIndex(p => p.id === periodId)
      const affectedPeriods = []
      for (let i = 0; i < assignmentForm.num_periods; i++) {
        if (currentPeriodIndex + i < periods.length) {
          affectedPeriods.push(periods[currentPeriodIndex + i].id)
        }
      }

      console.log(`Checking availability for ${teacherType}:`, {
        teacherId,
        dayId,
        periodId,
        affectedPeriods,
        num_periods: assignmentForm.num_periods
      })

      // Check in current class (local check) - need to check for overlapping time ranges
      const localConflicts = []
      const currentKey = `${dayId}-${periodId}`
      
      // Build exclude list (current cell + its continuation cells)
      const cellsToExclude = new Set([currentKey])
      const existingAssignmentAtCurrentKey = routineData[currentKey]
      if (existingAssignmentAtCurrentKey && existingAssignmentAtCurrentKey.num_periods > 1) {
        for (let i = 1; i < existingAssignmentAtCurrentKey.num_periods; i++) {
          if (currentPeriodIndex + i < periods.length) {
            const nextPeriod = periods[currentPeriodIndex + i]
            const contKey = `${dayId}-${nextPeriod.id}`
            cellsToExclude.add(contKey)
          }
        }
      }
      
      // Calculate the range we're checking (min to max period index)
      const checkedPeriodIndices = affectedPeriods.map(pId => periods.findIndex(p => p.id === pId)).filter(idx => idx !== -1)
      const minCheckedIndex = Math.min(...checkedPeriodIndices)
      const maxCheckedIndex = Math.max(...checkedPeriodIndices)
      
      console.log(`Checking local conflicts for period range: ${minCheckedIndex} to ${maxCheckedIndex}`)
      
      // Check ALL assignments in routineData, not just the affected periods
      Object.entries(routineData).forEach(([key, existingAssignment]) => {
        const [assignmentDayId, assignmentPeriodId] = key.split('-').map(Number)
        
        // Only check assignments on the same day
        if (assignmentDayId !== dayId) {
          return
        }
        
        // Skip if this is the cell we're editing or its continuation cells
        if (cellsToExclude.has(key)) {
          console.log(`Skipping local check for ${key} (cell being edited)`)
          return
        }
        
        // Skip continuation cells (they don't represent the start of an assignment)
        if (existingAssignment.isContinuation) {
          return
        }
        
        // Find the period index for this assignment
        const assignmentPeriodIndex = periods.findIndex(p => p.id === assignmentPeriodId)
        if (assignmentPeriodIndex === -1) {
          return
        }
        
        // Calculate the range this existing assignment covers
        const assignmentStartIndex = assignmentPeriodIndex
        const assignmentEndIndex = assignmentPeriodIndex + (existingAssignment.num_periods - 1)
        
        console.log(`Checking existing assignment at ${key}: range ${assignmentStartIndex}-${assignmentEndIndex}, num_periods ${existingAssignment.num_periods}`)
        
        // Check if the ranges overlap
        // Two ranges overlap if: start1 <= end2 AND start2 <= end1
        const overlaps = assignmentStartIndex <= maxCheckedIndex && minCheckedIndex <= assignmentEndIndex
        
        if (overlaps) {
          const existingTeacherIds = [
            existingAssignment.lead_teacher_id,
            existingAssignment.assist_teacher_1_id,
            existingAssignment.assist_teacher_2_id,
          ].filter(id => id)
          
          if (existingTeacherIds.includes(teacherId)) {
            const period = periods[assignmentPeriodIndex]
            const endPeriod = periods[Math.min(assignmentEndIndex, periods.length - 1)]
            const timeSlot = existingAssignment.num_periods > 1 
              ? `${period?.start_time?.substring(0, 5)}-${endPeriod?.end_time?.substring(0, 5)}`
              : `${period?.start_time?.substring(0, 5)}-${period?.end_time?.substring(0, 5)}`
            
            console.log(`CONFLICT DETECTED: Assignment at ${key} (range ${assignmentStartIndex}-${assignmentEndIndex}) overlaps with checked range ${minCheckedIndex}-${maxCheckedIndex}`)
            
            localConflicts.push({
              className: 'Current Class',
              timeSlot: timeSlot,
              subjectName: existingAssignment.subject_name
            })
          }
        }
      })

      console.log('Local conflicts found:', localConflicts)

      // Check across all other classes (backend check)
      let backendConflicts = []
      if (formData.class_id) {
        console.log('Calling backend API to check conflicts...')
        const response = await classRoutineService.checkTeacherConflict(
          teacherId,
          dayId,
          affectedPeriods,
          formData.class_id
        )
        
        console.log('Backend response:', response.data)
        
        if (response.data.has_conflict) {
          backendConflicts = response.data.conflicts.map(c => ({
            className: c.class_name,
            timeSlot: `Period ${c.period_order}`,
            subjectName: c.subject_name
          }))
        }
      }

      console.log('Backend conflicts found:', backendConflicts)

      const allConflicts = [...localConflicts, ...backendConflicts]
      
      console.log(`Total conflicts for ${teacherType}:`, allConflicts)
      console.log(`Setting availability to: ${allConflicts.length === 0 ? 'AVAILABLE' : 'BUSY'}`)
      
      setTeacherAvailability(prev => ({
        ...prev,
        [teacherType]: {
          checking: false,
          available: allConflicts.length === 0,
          conflicts: allConflicts
        }
      }))
    } catch (error) {
      console.error('Error checking teacher availability:', error)
      console.error('Error details:', error.response?.data)
      setTeacherAvailability(prev => ({
        ...prev,
        [teacherType]: { checking: false, available: true, conflicts: [] }
      }))
    }
  }

  const handleCloseAssignment = () => {
    setAssignmentDialog({
      open: false,
      dayId: null,
      periodId: null,
      dayName: '',
      periodOrder: null,
    })
    setAssignmentForm({
      subject_id: '',
      is_lab: false,
      is_half_lab: false,
      num_periods: 1,
      lead_teacher_id: '',
      assist_teacher_1_id: '',
      assist_teacher_2_id: '',
      room_no: '',
      group: '',
    })
    setTeacherAvailability({
      lead_teacher: { checking: false, available: true, conflicts: [] },
      assist_teacher_1: { checking: false, available: true, conflicts: [] },
      assist_teacher_2: { checking: false, available: true, conflicts: [] },
    })
  }

  const handleSaveAssignment = async () => {
    const { dayId, periodId } = assignmentDialog
    const key = `${dayId}-${periodId}`
    
    // Calculate period index - needed for both special entries and regular subjects
    const currentPeriodIndex = periods.findIndex(p => p.id === periodId)
    
    // Skip teacher validation and conflict checking for BREAK and LC
    const isSpecialEntry = assignmentForm.subject_id === 'BREAK' || assignmentForm.subject_id === 'LC'
    
    if (!isSpecialEntry) {
      // Check if any selected teacher is busy (based on real-time availability check)
      const busyTeachers = []
      if (assignmentForm.lead_teacher_id && !teacherAvailability.lead_teacher.available) {
        busyTeachers.push('Lead Teacher')
      }
      if (assignmentForm.assist_teacher_1_id && !teacherAvailability.assist_teacher_1.available) {
        busyTeachers.push('Assistant Teacher 1')
      }
      if (assignmentForm.assist_teacher_2_id && !teacherAvailability.assist_teacher_2.available) {
        busyTeachers.push('Assistant Teacher 2')
      }

      if (busyTeachers.length > 0) {
        alert(`Cannot assign: ${busyTeachers.join(', ')} ${busyTeachers.length > 1 ? 'are' : 'is'} busy at this time. Please choose different teacher(s).`)
        return
      }
      
      // Check for teacher conflicts (keep existing validation as backup)
      const teacherIds = [
        assignmentForm.lead_teacher_id,
        assignmentForm.assist_teacher_1_id,
        assignmentForm.assist_teacher_2_id,
      ].filter(id => id)
      
      // Check all periods that will be affected
      const affectedPeriods = []
      for (let i = 0; i < assignmentForm.num_periods; i++) {
        if (currentPeriodIndex + i < periods.length) {
          affectedPeriods.push(periods[currentPeriodIndex + i].id)
        }
      }
      
      // Check for conflicts with this teacher (now async)
      const conflicts = await checkTeacherConflicts(dayId, affectedPeriods, teacherIds, key)
      
      if (conflicts.length > 0) {
        // Format conflict message with better details
        let conflictMessage = 'Teacher cannot be assigned due to conflicts:\n\n'
        
        conflicts.forEach((c, index) => {
        if (c.className && c.className !== 'Current Class') {
          conflictMessage += `${index + 1}. ${c.teacherName} is busy teaching ${c.subjectName || 'a subject'} in ${c.className} at ${c.timeSlot}\n`
        } else {
          conflictMessage += `${index + 1}. ${c.teacherName} is already assigned at ${c.timeSlot}\n`
        }
      })
      
      conflictMessage += '\nPlease choose different teacher(s) or time slot.'
      
      // Show alert and keep dialog open for re-entry
      alert(conflictMessage)
      
      // Don't close the dialog - let user fix the conflict
      return
      }
    }
    
    // Create assignment data
    const assignment = {
      ...assignmentForm,
      dayId,
      periodId,
      subject_name: assignmentForm.subject_id === 'BREAK' ? 'Break' : 
                    assignmentForm.subject_id === 'LC' ? 'Library Consultation' : 
                    semesterSubjects.find(s => s.id === assignmentForm.subject_id)?.name || '',
      subject_code: assignmentForm.subject_id === 'BREAK' ? 'BREAK' : 
                    assignmentForm.subject_id === 'LC' ? 'LC' :
                    semesterSubjects.find(s => s.id === assignmentForm.subject_id)?.code || '',
      lead_teacher_name: teachers.find(t => t.id === assignmentForm.lead_teacher_id)?.abbreviation || '',
      assist_teacher_1_name: teachers.find(t => t.id === assignmentForm.assist_teacher_1_id)?.abbreviation || '',
      assist_teacher_2_name: teachers.find(t => t.id === assignmentForm.assist_teacher_2_id)?.abbreviation || '',
    }
    
    // Update routine data - start with a copy
    const newRoutineData = { ...routineData }
    
    // IMPORTANT: Clear old continuation cells if we're editing an existing assignment
    const existingAssignment = routineData[key]
    if (existingAssignment && existingAssignment.num_periods > 1) {
      // Remove old continuation cells
      for (let i = 1; i < existingAssignment.num_periods; i++) {
        if (currentPeriodIndex + i < periods.length) {
          const nextPeriod = periods[currentPeriodIndex + i]
          const oldKey = `${dayId}-${nextPeriod.id}`
          delete newRoutineData[oldKey]
        }
      }
    }
    
    // Set the main assignment
    newRoutineData[key] = assignment
    
    // If multiple periods, mark subsequent periods as occupied
    if (assignmentForm.num_periods > 1) {
      for (let i = 1; i < assignmentForm.num_periods; i++) {
        if (currentPeriodIndex + i < periods.length) {
          const nextPeriod = periods[currentPeriodIndex + i]
          const nextKey = `${dayId}-${nextPeriod.id}`
          newRoutineData[nextKey] = { ...assignment, isContinuation: true, continuesFrom: key }
        }
      }
    }
    
    setRoutineData(newRoutineData)
    handleCloseAssignment()
  }

  const checkTeacherConflicts = async (dayId, affectedPeriodIds, teacherIds, excludeKey) => {
    const conflicts = []
    
    // Build a list of all cells to exclude (the cell being edited + its continuation cells)
    const cellsToExclude = new Set([excludeKey])
    
    console.log('=== Conflict Check Debug ===')
    console.log('excludeKey:', excludeKey)
    console.log('affectedPeriodIds:', affectedPeriodIds)
    console.log('teacherIds:', teacherIds)
    
    // If we're editing an existing assignment, find all its continuation cells
    const existingAssignment = routineData[excludeKey]
    console.log('existingAssignment:', existingAssignment)
    
    if (existingAssignment && existingAssignment.num_periods > 1) {
      const [dayId, periodId] = excludeKey.split('-').map(Number)
      const currentPeriodIndex = periods.findIndex(p => p.id === periodId)
      
      // Add all continuation cells from the original assignment
      for (let i = 1; i < existingAssignment.num_periods; i++) {
        if (currentPeriodIndex + i < periods.length) {
          const nextPeriod = periods[currentPeriodIndex + i]
          const contKey = `${dayId}-${nextPeriod.id}`
          cellsToExclude.add(contKey)
          console.log('Added continuation cell to exclude:', contKey)
        }
      }
    }
    
    console.log('cellsToExclude:', Array.from(cellsToExclude))
    
    // Check within current class (existing logic)
    affectedPeriodIds.forEach(periodId => {
      const key = `${dayId}-${periodId}`
      
      console.log(`Checking period ${periodId}, key: ${key}`)
      
      // Skip the cells we're currently editing (including continuation cells)
      if (cellsToExclude.has(key)) {
        console.log(`  -> Skipped (in exclude list)`)
        return
      }
      
      // Check if there's an assignment in this cell
      const existingAssignment = routineData[key]
      if (!existingAssignment) {
        console.log(`  -> No existing assignment`)
        return
      }
      
      console.log(`  -> Found existing assignment:`, existingAssignment)
      
      // Get all teachers from existing assignment
      const existingTeacherIds = [
        existingAssignment.lead_teacher_id,
        existingAssignment.assist_teacher_1_id,
        existingAssignment.assist_teacher_2_id,
      ].filter(id => id)
      
      console.log(`  -> Existing teacher IDs:`, existingTeacherIds)
      
      // Check for any overlapping teachers
      teacherIds.forEach(newTeacherId => {
        if (existingTeacherIds.includes(newTeacherId)) {
          const teacher = teachers.find(t => t.id === newTeacherId)
          const period = periods.find(p => p.id === periodId)
          
          console.log(`  -> CONFLICT FOUND! Teacher ${teacher?.name} is already assigned`)
          
          conflicts.push({
            teacherName: teacher?.name || 'Unknown Teacher',
            timeSlot: `${period?.start_time?.substring(0, 5)}-${period?.end_time?.substring(0, 5)}`,
            periodId,
            className: 'Current Class',
          })
        }
      })
    })
    
    console.log('Conflicts after current class check:', conflicts)
    console.log('=== End Conflict Check Debug ===')

    
    // Check across all other classes using backend API
    if (formData.class_id) {
      try {
        for (const teacherId of teacherIds) {
          if (!teacherId) continue
          
          console.log('Checking teacher conflict for:', {
            teacherId,
            dayId,
            periodIds: affectedPeriodIds,
            excludeClassId: formData.class_id
          })
          
          const response = await classRoutineService.checkTeacherConflict(
            teacherId,
            dayId,
            affectedPeriodIds,
            formData.class_id
          )
          
          console.log('Conflict check response:', response.data)
          
          if (response.data.has_conflict) {
            const teacher = teachers.find(t => t.id === teacherId)
            response.data.conflicts.forEach(conflict => {
              conflicts.push({
                teacherName: teacher?.name || 'Unknown Teacher',
                timeSlot: `Period ${conflict.period_order}`,
                periodId: null,
                className: conflict.class_name,
                subjectName: conflict.subject_name,
              })
            })
          }
        }
      } catch (error) {
        console.error('Error checking teacher conflicts across classes:', error)
        console.error('Error details:', error.response?.data)
        
        // Show error to user
        setSnackbar({
          open: true,
          message: `Error checking teacher availability: ${error.response?.data?.detail || error.message}`,
          severity: 'error',
        })
      }
    }
    
    return conflicts
  }

  const handleDeleteAssignment = (dayId, periodId) => {
    const key = `${dayId}-${periodId}`
    const newRoutineData = { ...routineData }
    
    const assignment = newRoutineData[key]
    if (!assignment) return
    
    // Find and delete continuation cells
    if (assignment.num_periods > 1) {
      const currentPeriodIndex = periods.findIndex(p => p.id === periodId)
      for (let i = 1; i < assignment.num_periods; i++) {
        if (currentPeriodIndex + i < periods.length) {
          const nextPeriod = periods[currentPeriodIndex + i]
          const nextKey = `${dayId}-${nextPeriod.id}`
          delete newRoutineData[nextKey]
        }
      }
    }
    
    // If this is a multi-subject lab, we only need to delete the main entry
    // since the frontend stores all lab subjects in the lab_subjects array
    delete newRoutineData[key]
    setRoutineData(newRoutineData)
  }

  // Drag and Drop handlers
  const availabilityCache = useRef({})
  const dragOverTimeoutRef = useRef(null)
  const lastCheckedCellRef = useRef(null)
  
  const handleDragStart = (e, dayId, periodId) => {
    const key = `${dayId}-${periodId}`
    const cellData = routineData[key]
    
    if (!cellData || cellData.isContinuation) return
    
    // Check if Ctrl key is pressed for move operation
    const isMove = e.ctrlKey
    
    setDraggedItem({
      key,
      dayId,
      periodId,
      data: cellData,
      isMove: isMove
    })
    
    // Clear cache and timeouts when starting new drag
    availabilityCache.current = {}
    lastCheckedCellRef.current = null
    if (dragOverTimeoutRef.current) {
      clearTimeout(dragOverTimeoutRef.current)
      dragOverTimeoutRef.current = null
    }
    
    e.dataTransfer.effectAllowed = isMove ? 'move' : 'copy'
    e.dataTransfer.setData('text/plain', key)
  }

  const handleDragOver = (e, targetDayId, targetPeriodId) => {
    e.preventDefault()
    
    if (!draggedItem) return
    
    const targetKey = `${targetDayId}-${targetPeriodId}`
    
    // Don't allow drop on same cell
    if (draggedItem.key === targetKey) {
      e.dataTransfer.dropEffect = 'none'
      setDropTargetAvailability({})
      return
    }
    
    // Don't allow drop on occupied cells
    if (routineData[targetKey] && !routineData[targetKey].isContinuation) {
      e.dataTransfer.dropEffect = 'none'
      setDropTargetAvailability({ [targetKey]: 'unavailable' })
      return
    }
    
    // If we're still on the same cell, use cached result
    if (lastCheckedCellRef.current === targetKey) {
      const cached = availabilityCache.current[targetKey]
      if (cached !== undefined) {
        e.dataTransfer.dropEffect = cached ? (draggedItem.isMove ? 'move' : 'copy') : 'none'
      }
      return
    }
    
    lastCheckedCellRef.current = targetKey
    
    // Check if we have a cached result for this cell
    const cached = availabilityCache.current[targetKey]
    if (cached !== undefined) {
      e.dataTransfer.dropEffect = cached ? (draggedItem.isMove ? 'move' : 'copy') : 'none'
      setDropTargetAvailability({ [targetKey]: cached ? 'available' : 'unavailable' })
      return
    }
    
    // Clear any pending timeout
    if (dragOverTimeoutRef.current) {
      clearTimeout(dragOverTimeoutRef.current)
    }
    
    // Set optimistic effect
    e.dataTransfer.dropEffect = draggedItem.isMove ? 'move' : 'copy'
    
    // Debounced availability check
    dragOverTimeoutRef.current = setTimeout(async () => {
      try {
        const isAvailable = await checkDropTargetAvailability(targetDayId, targetPeriodId, draggedItem.data)
        
        // Cache the result
        availabilityCache.current[targetKey] = isAvailable
        
        // Update UI only if still hovering the same cell
        if (lastCheckedCellRef.current === targetKey) {
          setDropTargetAvailability({ [targetKey]: isAvailable ? 'available' : 'unavailable' })
        }
      } catch (error) {
        console.error('Error checking availability:', error)
        availabilityCache.current[targetKey] = false
        if (lastCheckedCellRef.current === targetKey) {
          setDropTargetAvailability({ [targetKey]: 'unavailable' })
        }
      }
    }, 100) // 100ms debounce
  }

  const handleDrop = async (e, targetDayId, targetPeriodId) => {
    e.preventDefault()
    
    if (!draggedItem) return
    
    const targetKey = `${targetDayId}-${targetPeriodId}`
    
    // Don't allow drop on same cell
    if (draggedItem.key === targetKey) {
      setDraggedItem(null)
      setDropTargetAvailability({})
      return
    }
    
    // Don't allow drop on occupied cells
    if (routineData[targetKey] && !routineData[targetKey].isContinuation) {
      setDraggedItem(null)
      setDropTargetAvailability({})
      return
    }
    
    // Check if teachers are available (use cache first)
    let isAvailable = availabilityCache.current[targetKey]
    
    if (isAvailable === undefined) {
      // Not in cache, check now
      isAvailable = await checkDropTargetAvailability(targetDayId, targetPeriodId, draggedItem.data)
      availabilityCache.current[targetKey] = isAvailable
    }
    
    if (!isAvailable) {
      alert('Cannot place assignment: Teacher(s) not available at this time slot')
      setDraggedItem(null)
      setDropTargetAvailability({})
      return
    }
    
    const newRoutineData = { ...routineData }
    const oldData = draggedItem.data
    const isMove = draggedItem.isMove
    
    if (isMove) {
      // MOVE: Remove from old location (including continuation cells)
      delete newRoutineData[draggedItem.key]
      
      // Remove old continuation cells
      const sourcePeriodIndex = periods.findIndex(p => p.id === draggedItem.periodId)
      for (let i = 1; i < (oldData.num_periods || 1); i++) {
        if (sourcePeriodIndex + i < periods.length) {
          const nextPeriod = periods[sourcePeriodIndex + i]
          const contKey = `${draggedItem.dayId}-${nextPeriod.id}`
          delete newRoutineData[contKey]
        }
      }
    }
    // COPY: Keep original location intact
    
    // Add to new location (same for both copy and move)
    newRoutineData[targetKey] = {
      ...oldData,
    }
    
    // Create new continuation cells
    const targetPeriodIndex = periods.findIndex(p => p.id === targetPeriodId)
    for (let i = 1; i < (oldData.num_periods || 1); i++) {
      if (targetPeriodIndex + i < periods.length) {
        const nextPeriod = periods[targetPeriodIndex + i]
        const contKey = `${targetDayId}-${nextPeriod.id}`
        newRoutineData[contKey] = {
          isContinuation: true,
          originalKey: targetKey,
        }
      }
    }
    
    setRoutineData(newRoutineData)
    setDraggedItem(null)
    setDropTargetAvailability({})
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDropTargetAvailability({})
    lastCheckedCellRef.current = null
    if (dragOverTimeoutRef.current) {
      clearTimeout(dragOverTimeoutRef.current)
      dragOverTimeoutRef.current = null
    }
  }

  const checkDropTargetAvailability = async (targetDayId, targetPeriodId, cellData) => {
    if (!cellData) return false
    
    // BREAK and LC don't need teacher availability check
    if (cellData.subject_id === 'BREAK' || cellData.subject_id === 'LC') {
      return true
    }
    
    const numPeriods = cellData.num_periods || 1
    const targetPeriodIndex = periods.findIndex(p => p.id === targetPeriodId)
    
    // Check if there's enough space for continuation cells
    for (let i = 0; i < numPeriods; i++) {
      if (targetPeriodIndex + i >= periods.length) {
        return false // Not enough periods remaining
      }
      if (i > 0) {
        const checkPeriod = periods[targetPeriodIndex + i]
        const checkKey = `${targetDayId}-${checkPeriod.id}`
        if (routineData[checkKey] && !routineData[checkKey].isContinuation) {
          return false // Cell is occupied
        }
      }
    }
    
    // Get affected period IDs
    const affectedPeriods = []
    for (let i = 0; i < numPeriods; i++) {
      if (targetPeriodIndex + i < periods.length) {
        affectedPeriods.push(periods[targetPeriodIndex + i].id)
      }
    }
    
    // Check all teachers for conflicts
    const teachersToCheck = [
      cellData.lead_teacher_id,
      cellData.assist_teacher_1_id,
      cellData.assist_teacher_2_id
    ].filter(Boolean)
    
    if (teachersToCheck.length === 0) {
      return true // No teachers to check
    }
    
    try {
      for (const teacherId of teachersToCheck) {
        const response = await classRoutineService.checkTeacherConflict(
          teacherId,
          targetDayId,
          affectedPeriods,
          formData.class_id // Exclude current class
        )
        
        if (response.data.has_conflict) {
          return false // Teacher has conflict
        }
      }
      return true // All teachers available
    } catch (error) {
      console.error('Error checking teacher availability:', error)
      return false // Assume not available on error
    }
  }

  // Handle saving multi-subject lab assignments
  const handleSaveMultiSubjectLab = (labSubjectsData) => {
    if (!currentLabCell) return
    
    const { dayId, periodId } = currentLabCell
    const newRoutineData = { ...routineData }
    
    console.log('=== MULTI-SUBJECT LAB SAVE DEBUG ===')
    console.log('1. Input labSubjectsData:', labSubjectsData)
    console.log('2. Number of subjects:', labSubjectsData.length)
    
    // Generate a unique ID for this lab group
    const labGroupId = `lab-${dayId}-${periodId}-${Date.now()}`
    
    // Enrich lab subjects data with subject names
    const enrichedLabSubjects = labSubjectsData.map(labSubject => {
      const subject = subjects.find(s => s.id === labSubject.subject_id) || 
                     semesterSubjects.find(s => s.id === labSubject.subject_id)
      return {
        ...labSubject,
        subject_name: subject?.name || 'Unknown Subject',
        is_half_lab: labSubject.is_half_lab || false,
        num_periods: labSubject.num_periods || 1 // Preserve num_periods from each subject
      }
    })
    
    console.log('3. Enriched lab subjects:', enrichedLabSubjects)
    
    // Find the maximum num_periods across all lab subjects (for continuation cells)
    const maxNumPeriods = Math.max(...enrichedLabSubjects.map(ls => ls.num_periods || 1))
    
    // Save to routine data (single entry with lab_subjects array)
    const key = `${dayId}-${periodId}`
    newRoutineData[key] = {
      subject_id: enrichedLabSubjects[0].subject_id, // Store first subject as primary
      subject_name: enrichedLabSubjects[0].subject_name,
      is_lab: true,
      is_half_lab: enrichedLabSubjects[0].is_half_lab || false, // Use first subject's is_half_lab
      num_periods: maxNumPeriods, // Use maximum periods for continuation cells
      lead_teacher_id: enrichedLabSubjects[0].lead_teacher_id,
      assist_teacher_1_id: enrichedLabSubjects[0].assist_teacher_1_id || null,
      assist_teacher_2_id: enrichedLabSubjects[0].assist_teacher_2_id || null,
      group: enrichedLabSubjects[0].group,
      lab_room: enrichedLabSubjects[0].lab_room,
      lab_group_id: labGroupId,
      lab_subjects: enrichedLabSubjects, // Store all lab subjects with names, is_half_lab, and num_periods
    }
    
    console.log('4. Created routineData entry:', newRoutineData[key])
    console.log('5. lab_subjects array:', newRoutineData[key].lab_subjects)
    console.log('=== END SAVE DEBUG ===')
    
    // Create continuation cells for the maximum period range
    const currentPeriodIndex = periods.findIndex(p => p.id === periodId)
    for (let i = 1; i < maxNumPeriods; i++) {
      if (currentPeriodIndex + i < periods.length) {
        const nextPeriod = periods[currentPeriodIndex + i]
        const contKey = `${dayId}-${nextPeriod.id}`
        newRoutineData[contKey] = {
          isContinuation: true,
          originalKey: key,
        }
      }
    }
    
    setRoutineData(newRoutineData)
    setCurrentLabCell(null)
  }

  // Wrapper function for checking teacher availability in multi-subject lab dialog
  const checkTeacherAvailabilityForLab = async (teacherId, dayId, periodId, numPeriods, excludeClassId) => {
    if (!teacherId || !dayId || !periodId) {
      return { has_conflict: false, conflicts: [] }
    }

    try {
      // Get affected period IDs
      const currentPeriodIndex = periods.findIndex(p => p.id === periodId)
      const affectedPeriods = []
      for (let i = 0; i < numPeriods; i++) {
        if (currentPeriodIndex + i < periods.length) {
          affectedPeriods.push(periods[currentPeriodIndex + i].id)
        }
      }

      // Check backend for conflicts
      const response = await classRoutineService.checkTeacherConflict(
        teacherId,
        dayId,
        affectedPeriods,
        excludeClassId
      )
      
      return response.data
    } catch (error) {
      console.error('Error checking teacher availability:', error)
      return { has_conflict: false, conflicts: [] }
    }
  }

  const getCellData = (dayId, periodId) => {
    const key = `${dayId}-${periodId}`
    return routineData[key]
  }

  // Check if same subject-teacher combination appears multiple times on same day
  const hasDuplicateAssignment = (dayId, periodId) => {
    const cellData = getCellData(dayId, periodId)
    if (!cellData || cellData.isContinuation || !cellData.subject_id || !cellData.lead_teacher_id) {
      return false
    }

    // Skip BREAK and LC
    if (cellData.subject_id === 'BREAK' || cellData.subject_id === 'LC') {
      return false
    }

    const currentSubjectId = cellData.subject_id
    const currentTeacherId = cellData.lead_teacher_id
    let count = 0

    // Check all periods in this day
    periods.forEach(period => {
      const key = `${dayId}-${period.id}`
      const data = routineData[key]
      
      if (data && !data.isContinuation && 
          data.subject_id === currentSubjectId && 
          data.lead_teacher_id === currentTeacherId) {
        count++
      }
    })

    return count > 1
  }

  const renderCell = (dayId, periodId) => {
    const cellData = getCellData(dayId, periodId)
    
    // Auto-display B for break-type periods (even if no assignment exists)
    if (!cellData) {
      const period = periods.find(p => p.id === periodId)
      if (period && (period.type === 'break' || period.is_teaching_period === false)) {
        return (
          <Typography variant="h4" sx={{ fontWeight: 900, textAlign: 'center', py: 1, color: '#E65100' }}>
            B
          </Typography>
        )
      }
      return (
        <Typography variant="caption" color="text.secondary">
          Click to assign
        </Typography>
      )
    }

    if (cellData.isContinuation) {
      // Don't render content for continuation cells
      return null
    }

    // Check if this is a multi-subject lab
    const isMultiSubjectLab = cellData.lab_subjects && cellData.lab_subjects.length > 0
    
    // Debug logging for multi-subject labs
    if (isMultiSubjectLab) {
      console.log(`Multi-subject lab at ${dayId}-${periodId}:`, cellData.lab_subjects)
    }
    
    // Check for duplicate assignment
    const isDuplicate = hasDuplicateAssignment(dayId, periodId)

    const teacherNames = cellData.is_lab
      ? [cellData.lead_teacher_name, cellData.assist_teacher_1_name, cellData.assist_teacher_2_name]
          .filter(t => t)
          .join(' + ')
      : cellData.lead_teacher_name

    return (
      <Box 
        className="routine-cell-content"
        sx={{ 
          position: 'relative',
          '&:hover .delete-button': {
            opacity: 1,
            visibility: 'visible',
          },
        }}
      >
        {/* Duplicate warning badge */}
        {isDuplicate && (
          <Box
            sx={{
              position: 'absolute',
              top: -8,
              left: -8,
              bgcolor: '#d32f2f',
              color: 'white',
              borderRadius: '50%',
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              zIndex: 1,
              boxShadow: 1,
            }}
            title="Duplicate: Same subject assigned to same teacher multiple times today"
          >
            !
          </Box>
        )}
        {/* Special rendering for BREAK */}
        {cellData.subject_id === 'BREAK' ? (
          <Typography variant="h4" sx={{ fontWeight: 900, textAlign: 'center', py: 1, color: '#E65100' }}>
            B
          </Typography>
        ) : cellData.subject_id === 'LC' ? (
          /* Special rendering for Library Consultation */
          <Typography variant="h5" sx={{ fontWeight: 'bold', textAlign: 'center', py: 1 }}>
            LC
          </Typography>
        ) : isMultiSubjectLab ? (
          /* Multi-subject lab display - compact format */
          <>
            {cellData.lab_subjects.map((labSubject, index) => {
              const subjectData = subjects.find(s => s.id === labSubject.subject_id)
              const leadTeacher = teachers.find(t => t.id === labSubject.lead_teacher_id)
              const assist1Teacher = teachers.find(t => t.id === labSubject.assist_teacher_1_id)
              const assist2Teacher = teachers.find(t => t.id === labSubject.assist_teacher_2_id)
              
              // Build teacher string: Lead + Assist1 + Assist2
              const teacherAbbrs = [
                leadTeacher?.abbreviation,
                assist1Teacher?.abbreviation,
                assist2Teacher?.abbreviation
              ].filter(Boolean).join('+')
              
              return (
                <Box 
                  key={index} 
                  sx={{ 
                    mb: index < cellData.lab_subjects.length - 1 ? 1 : 0,
                    pb: index < cellData.lab_subjects.length - 1 ? 1 : 0,
                    borderBottom: index < cellData.lab_subjects.length - 1 ? '1px solid #90CAF9' : 'none'
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
                    {labSubject.subject_name || subjectData?.name || 'Unknown'}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'inline-block',
                      bgcolor: '#1976d2',
                      color: 'white',
                      px: 0.5,
                      py: 0.1,
                      borderRadius: 0.5,
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      mb: 0.3
                    }}
                  >
                    LAB
                  </Typography>
                  <Typography variant="caption" display="block">
                    ({teacherAbbrs})
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ fontSize: '0.7rem' }}>
                    {labSubject.lab_room} - {labSubject.group}
                  </Typography>
                </Box>
              )
            })}
          </>
        ) : (
          /* Regular subject display */
          <>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {cellData.subject_name}
            </Typography>
            {cellData.is_lab && (
              <Typography 
                variant="caption" 
                sx={{ 
                  display: 'inline-block',
                  bgcolor: '#1976d2',
                  color: 'white',
                  px: 0.8,
                  py: 0.2,
                  borderRadius: 1,
                  fontWeight: 'bold',
                  mb: 0.5
                }}
              >
                LAB
              </Typography>
            )}
            <Typography variant="caption" display="block">
              ({teacherNames})
            </Typography>
            {cellData.room_no && (
              <Typography variant="caption" display="block" sx={{ color: 'success.main', fontWeight: 'medium' }}>
                Room: {cellData.room_no}
              </Typography>
            )}
            {cellData.group && (
              <Typography variant="caption" display="block" sx={{ color: 'info.main', fontWeight: 'medium' }}>
                Group: {cellData.group}
              </Typography>
            )}
          </>
        )}
        {isAdmin() && (
        <IconButton
          className="delete-button"
          size="small"
          sx={{ 
            position: 'absolute', 
            top: -10, 
            right: -10,
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
            color: 'white',
            width: 28,
            height: 28,
            boxShadow: '0 2px 8px rgba(238, 90, 111, 0.4)',
            transition: 'all 0.3s ease',
            border: '2px solid white',
            zIndex: 10,
            opacity: 0,
            visibility: 'hidden',
            '&:hover': { 
              background: 'linear-gradient(135deg, #ee5a6f 0%, #ff6b6b 100%)',
              transform: 'scale(1.15) rotate(90deg)',
              boxShadow: '0 4px 12px rgba(238, 90, 111, 0.6)',
            },
            '&:active': {
              transform: 'scale(0.95)',
            },
          }}
          onClick={(e) => {
            e.stopPropagation()
            handleDeleteAssignment(dayId, periodId)
          }}
        >
          <DeleteIcon sx={{ fontSize: 16 }} />
        </IconButton>
        )}
      </Box>
    )
  }

  const getCellColSpan = (dayId, periodId) => {
    const cellData = getCellData(dayId, periodId)
    if (cellData && !cellData.isContinuation && cellData.num_periods > 1) {
      return cellData.num_periods
    }
    return 1
  }

  const shouldRenderCell = (dayId, periodId) => {
    const cellData = getCellData(dayId, periodId)
    return !cellData || !cellData.isContinuation
  }

  const getProgrammeName = () => {
    if (school) {
      const dept = departments.find(d => d.id === formData.department_id)
      return dept ? dept.name : ''
    }
    const prog = programmes.find(p => p.id === formData.programme_id)
    return prog ? prog.code : ''
  }

  const getSemesterName = () => {
    const sem = semesters.find(s => s.id === formData.semester_id)
    return sem ? sem.name : ''
  }

  const getClassName = () => {
    const cls = classes.find(c => c.id === formData.class_id)
    return cls ? cls.name : ''
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* Page Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a2332', mb: 0.25 }}>
              Class Routine Management
            </Typography>
            <Typography variant="body2" sx={{ color: '#8896a4' }}>
              Create and manage class schedules with drag-and-drop functionality
            </Typography>
          </Box>
        </Box>

        <Paper elevation={0} sx={{ mb: 2, borderRadius: '16px', overflow: 'hidden', border: '1px solid #e8edf2' }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, newValue) => setTabValue(newValue)}
            sx={{
              bgcolor: '#f8fafc',
              borderBottom: '1px solid #e8edf2',
              '& .MuiTab-root': {
                fontWeight: 600,
                fontSize: '0.95rem',
                textTransform: 'none',
                color: '#8896a4',
              },
              '& .Mui-selected': {
                color: '#2d6a6f',
              },
            }}
            TabIndicatorProps={{
              style: {
                background: '#2d6a6f',
                height: 3,
              }
            }}
          >
            <Tab label="Routine Form" />
            <Tab label="Export" disabled={false} />
            <Tab label="Day-wise Export" disabled={false} />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            {/* Compact Form Section */}
            <Paper 
              elevation={0}
              sx={{ 
                p: { xs: 2, sm: 3 }, 
                mb: 3, 
                bgcolor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e8edf2',
              }}
            >
              <Grid container spacing={{ xs: 1.5, sm: 2 }} alignItems="center">
                {/* Engineering mode: Programme selector | School mode: Department selector */}
                {!school ? (
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Programme"
                      value={formData.programme_id}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        programme_id: e.target.value,
                        semester_id: '',
                        class_id: '',
                      })}
                      required
                    >
                      <MenuItem value="">Select Programme</MenuItem>
                      {programmes.map((prog) => (
                        <MenuItem key={prog.id} value={prog.id}>
                          {prog.code}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                ) : (
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Department"
                      value={formData.department_id}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        department_id: e.target.value,
                        semester_id: '',
                        class_id: '',
                      })}
                      required
                    >
                      <MenuItem value="">Select Department</MenuItem>
                      {departments.map((dept) => (
                        <MenuItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                )}

                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label={school ? 'Class' : 'Year/Part'}
                    value={formData.semester_id}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      semester_id: e.target.value,
                      class_id: '',
                    })}
                    disabled={school ? !formData.department_id : !formData.programme_id}
                    required
                  >
                    <MenuItem value="">Select</MenuItem>
                    {semesters.map((sem) => (
                      <MenuItem key={sem.id} value={sem.id}>
                        {sem.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label={school ? 'Section' : 'Class'}
                    value={formData.class_id}
                    onChange={async (e) => {
                      const selectedClass = classes.find(c => c.id === e.target.value)
                      
                      // Load the class details from database to get the current room_no
                      let roomNo = ''
                      if (e.target.value) {
                        try {
                          const classResponse = await classService.getById(e.target.value)
                          roomNo = classResponse.data.room_no || ''
                        } catch (error) {
                          console.error('Error loading class details:', error)
                        }
                      }
                      
                      setFormData({ 
                        ...formData, 
                        class_id: e.target.value,
                        section: selectedClass?.section || '',
                        room_no: roomNo, // Set room_no from database
                      })
                    }}
                    disabled={!formData.semester_id}
                    required
                  >
                    <MenuItem value="">Select</MenuItem>
                    {classes.map((cls) => (
                      <MenuItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Section"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Room"
                    value={formData.room_no}
                    onChange={(e) => setFormData({ ...formData, room_no: e.target.value })}
                  >
                    <MenuItem value="">Select</MenuItem>
                    
                    {/* Group rooms by building dynamically */}
                    {(() => {
                      const grouped = {}
                      rooms.forEach(r => {
                        const bld = r.building || 'Other'
                        if (!grouped[bld]) grouped[bld] = []
                        grouped[bld].push(r)
                      })
                      return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).flatMap(([building, bldRooms]) => [
                        <MenuItem key={`header-${building}`} disabled sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          {building}
                        </MenuItem>,
                        ...bldRooms.map(room => (
                          <MenuItem key={room.id} value={room.room_number} sx={{ pl: 4 }}>
                            {room.room_number}{room.name ? ` - ${room.name}` : ''}
                          </MenuItem>
                        ))
                      ])
                    })()}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="Effective Date"
                    value={formData.effective_date}
                    onChange={(newValue) => setFormData({ ...formData, effective_date: newValue })}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Routine Table */}
            {(school ? formData.department_id : formData.programme_id) && formData.class_id && (
              <Box 
                ref={fullscreenRef}
                sx={{ 
                  mt: 4,
                  position: isFullscreen ? 'fixed' : 'relative',
                  top: isFullscreen ? 0 : 'auto',
                  left: isFullscreen ? 0 : 'auto',
                  right: isFullscreen ? 0 : 'auto',
                  bottom: isFullscreen ? 0 : 'auto',
                  zIndex: isFullscreen ? 1300 : 'auto',
                  bgcolor: isFullscreen ? 'white' : 'transparent',
                  width: isFullscreen ? '100vw' : 'auto',
                  height: isFullscreen ? '100vh' : 'auto',
                  overflow: isFullscreen ? 'hidden' : 'visible',
                }}
              >
                <Box sx={{ 
                  bgcolor: '#2d6a6f', 
                  color: 'white', 
                  p: { xs: 1.5, sm: 2 }, 
                  mb: 0,
                  borderRadius: isFullscreen ? 0 : '12px 12px 0 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1,
                }}>
                  <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    ROUTINE for Class : {getProgrammeName()} {getSemesterName()} {formData.section}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {loading && (
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        Loading routine...
                      </Typography>
                    )}
                    <IconButton 
                      color="inherit"
                      onClick={toggleFullscreen}
                      title={isFullscreen ? "Exit Fullscreen (or press Esc)" : "Enter Fullscreen"}
                      size="small"
                      sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                    >
                      {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                    </IconButton>
                  </Box>
                </Box>

                {loading ? (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography>Loading routine data...</Typography>
                  </Box>
                ) : (
                  <TableContainer 
                    component={Paper} 
                    elevation={0}
                    sx={{ 
                      border: '1px solid #e8edf2', 
                      height: isFullscreen ? 'calc(100vh - 64px)' : { xs: 'auto', sm: 'calc(100vh - 220px)' },
                      overflow: 'auto',
                      borderRadius: isFullscreen ? 0 : '0 0 12px 12px',
                    }}
                  >
                  <Table size="small" sx={{ 
                    '& td, & th': { 
                      border: '1px solid #e8edf2', 
                      minWidth: { xs: 80, sm: 120 },
                      fontSize: { xs: '0.7rem', sm: '0.875rem' },
                      padding: { xs: '4px', sm: '8px' },
                    } 
                  }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f8fafc' }}>
                        <TableCell sx={{ 
                          fontWeight: 700, 
                          minWidth: 100,
                          color: '#1a2332',
                          fontSize: '0.95rem',
                        }}>
                          Days \ Time
                        </TableCell>
                        {periods.map((period) => (
                          <TableCell 
                            key={period.id} 
                            align="center"
                            sx={{ 
                              fontWeight: 700,
                              color: '#1a2332',
                              fontSize: '0.875rem',
                            }}
                          >
                            {period.start_time?.substring(0, 5)}-{period.end_time?.substring(0, 5)}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {days.map((day) => (
                        <TableRow key={day.id} sx={{
                          '&:hover': {
                            bgcolor: '#f8fafc',
                          },
                        }}>
                          <TableCell 
                            component="th" 
                            scope="row"
                            sx={{ 
                              fontWeight: 700,
                              bgcolor: '#f8fafc',
                              color: '#2d6a6f',
                              fontSize: '0.9rem',
                            }}
                          >
                            {day.name}
                          </TableCell>
                          {periods.map((period) => {
                            if (!shouldRenderCell(day.id, period.id)) {
                              return null
                            }
                            
                            const colSpan = getCellColSpan(day.id, period.id)
                            const cellKey = `${day.id}-${period.id}`
                            const cellData = routineData[cellKey]
                            const hasContent = cellData && !cellData.isContinuation
                            const availability = dropTargetAvailability[cellKey]
                            const isDuplicate = hasDuplicateAssignment(day.id, period.id)
                            
                            return (
                              <TableCell 
                                key={cellKey}
                                colSpan={colSpan}
                                align="center"
                                draggable={hasContent && isAdmin()}
                                onDragStart={(e) => hasContent && isAdmin() && handleDragStart(e, day.id, period.id)}
                                onDragOver={(e) => isAdmin() && handleDragOver(e, day.id, period.id)}
                                onDrop={(e) => isAdmin() && handleDrop(e, day.id, period.id)}
                                onDragEnd={handleDragEnd}
                                sx={{ 
                                  cursor: hasContent ? (isAdmin() ? 'move' : 'default') : (isAdmin() ? 'pointer' : 'default'),
                                  '&:hover': { bgcolor: isAdmin() ? 'action.hover' : 'inherit' },
                                  minHeight: 80,
                                  p: 1,
                                  position: 'relative',
                                  bgcolor: isDuplicate ? '#FFCDD2' :  // Light red for duplicate assignments
                                          availability === 'available' ? 'success.light' : 
                                          availability === 'unavailable' ? 'error.light' :
                                          (hasContent && cellData?.subject_id === 'BREAK') ? '#FFF3E0' :  // Light orange for assigned break
                                          (period.type === 'break' || period.is_teaching_period === false) ? '#FFF3E0' :  // Light orange for break-type period
                                          (hasContent && cellData?.is_lab) ? '#E3F2FD' :  // Light blue for lab sessions
                                          'inherit',
                                  transition: 'background-color 0.2s',
                                  border: draggedItem?.key === cellKey ? '2px solid blue' : undefined,
                                }}
                                onClick={() => isAdmin() && handleOpenAssignment(day.id, period.id, day.name, period.order)}
                              >
                                <Box sx={{ fontSize: '0.85rem', textAlign: 'center' }}>
                                  {renderCell(day.id, period.id)}
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

                <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={!isAdmin()}
                    fullWidth
                    sx={{
                      backgroundColor: '#2d6a6f',
                      color: 'white',
                      px: 3,
                      py: 1,
                      fontWeight: 600,
                      borderRadius: '10px',
                      boxShadow: 'none',
                      maxWidth: { xs: '100%', sm: 'auto' },
                      textTransform: 'none',
                      '&:hover': {
                        backgroundColor: '#235558',
                        boxShadow: 'none',
                      },
                    }}
                  >
                    Save Routine
                  </Button>
                </Box>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#f8fafc', borderRadius: '12px', mb: 3, border: '1px solid #e8edf2' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a2332', mb: 0.5 }}>
                Export Routine
              </Typography>
              <Typography variant="body2" sx={{ color: '#8896a4' }}>
                Export the class routine to Excel format with proper formatting and styling.
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', flexDirection: { xs: 'column', sm: 'row' } }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<ExportIcon />}
                onClick={handleExport}
                disabled={!formData.class_id}
                sx={{
                  backgroundColor: '#2d6a6f',
                  color: 'white',
                  px: 3,
                  py: 1.5,
                  fontWeight: 600,
                  borderRadius: '10px',
                  boxShadow: 'none',
                  textTransform: 'none',
                  '&:hover': { backgroundColor: '#235558', boxShadow: 'none' },
                  '&:disabled': { background: '#ccc' },
                }}
              >
                Export Current Class
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                startIcon={<ExportIcon />}
                onClick={handleExportAll}
                sx={{
                  borderColor: '#2d6a6f',
                  color: '#2d6a6f',
                  px: 3,
                  py: 1.5,
                  fontWeight: 600,
                  borderRadius: '10px',
                  textTransform: 'none',
                  '&:hover': { borderColor: '#235558', backgroundColor: '#2d6a6f10' },
                }}
              >
                Export All Classes
              </Button>
            </Box>
            
            <Paper elevation={0} sx={{ mt: 3, p: 2, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px solid #e8edf2' }}>
              <Typography variant="body2" sx={{ color: '#8896a4' }}>
                <strong>Export Current Class:</strong> Exports only the selected class routine<br />
                <strong>Export All Classes:</strong> Exports all class routines in a single Excel file with separate sheets
              </Typography>
            </Paper>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#f8fafc', borderRadius: '12px', mb: 3, border: '1px solid #e8edf2' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a2332', mb: 0.5 }}>
                Day-wise Export
              </Typography>
              <Typography variant="body2" sx={{ color: '#8896a4' }}>
                Export all classes with separate sheets for each day (Sunday to Thursday). 
                Each sheet shows all classes with time slots as columns.
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', flexDirection: { xs: 'column', sm: 'row' } }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<ExportIcon />}
                onClick={handleExportDayWise}
                sx={{
                  backgroundColor: '#2d6a6f',
                  color: 'white',
                  px: 3,
                  py: 1.5,
                  fontWeight: 600,
                  borderRadius: '10px',
                  boxShadow: 'none',
                  textTransform: 'none',
                  '&:hover': { backgroundColor: '#235558', boxShadow: 'none' },
                }}
              >
                Export Day-wise Routine
              </Button>

            </Box>
            
            <Paper elevation={0} sx={{ mt: 3, p: 2, bgcolor: '#f3f4f6', borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                📅 <strong>Day-wise Export:</strong> Exports all classes with separate sheets for each day<br />
                📊 <strong>Format:</strong> Classes in rows, Time slots in columns
              </Typography>
            </Paper>
          </TabPanel>
        </Paper>

        {/* Assignment Dialog */}
        <Dialog 
          open={assignmentDialog.open} 
          onClose={handleCloseAssignment}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Assign Subject - {assignmentDialog.dayName} (Period {assignmentDialog.periodOrder})
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TextField
                select
                fullWidth
                label="Subject"
                value={assignmentForm.subject_id}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, subject_id: e.target.value })}
                sx={{ mb: 2 }}
                required
              >
                <MenuItem value="">Select Subject</MenuItem>
                
                {/* Special entries for Break and Library Consultation */}
                <MenuItem value="BREAK" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  Break
                </MenuItem>
                <MenuItem value="LC" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                  Library Consultation (LC)
                </MenuItem>
                <MenuItem disabled>──────────────────</MenuItem>
                
                {/* Regular subjects */}
                {semesterSubjects.map((subject) => {
                  const slotInfo = subjectSlotCounts[subject.id]
                  const remaining = slotInfo ? slotInfo.remaining : subject.credit_hours || 0
                  const used = slotInfo ? slotInfo.used : 0
                  const total = slotInfo ? slotInfo.total : subject.credit_hours || 0
                  const isComplete = remaining === 0
                  const isOverAllocated = remaining < 0
                  
                  return (
                    <MenuItem 
                      key={subject.id} 
                      value={subject.id}
                      sx={{ 
                        color: isOverAllocated ? 'error.main' : isComplete ? 'success.main' : 'inherit',
                        fontWeight: remaining <= 2 && remaining > 0 ? 'bold' : 'normal'
                      }}
                    >
                      {subject.name} ({subject.code}) - {used}/{total} slots
                      {isOverAllocated && ' ⚠️ OVER'}
                      {isComplete && ' ✓'}
                    </MenuItem>
                  )
                })}
              </TextField>

              <TextField
                select
                fullWidth
                label="Number of Periods"
                value={assignmentForm.num_periods}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, num_periods: e.target.value })}
                sx={{ mb: 2 }}
                helperText="How many consecutive periods for this subject?"
              >
                {[1, 2, 3, 4, 5].map((num) => (
                  <MenuItem key={num} value={num}>
                    {num} Period{num > 1 ? 's' : ''}
                  </MenuItem>
                ))}
              </TextField>

              {/* Only show these fields if not BREAK or LC */}
              {assignmentForm.subject_id !== 'BREAK' && assignmentForm.subject_id !== 'LC' && (
                <>
                  {/* Lab checkbox */}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={assignmentForm.is_lab}
                        onChange={(e) => {
                          const isLab = e.target.checked
                          setAssignmentForm({ ...assignmentForm, is_lab: isLab, is_half_lab: false })
                          
                          // If enabling lab, open multi-subject dialog
                          if (isLab && assignmentDialog.dayId && assignmentDialog.periodId) {
                            setCurrentLabCell({ 
                              dayId: assignmentDialog.dayId, 
                              periodId: assignmentDialog.periodId 
                            })
                            setMultiLabDialogOpen(true)
                            // Close assignment dialog
                            setAssignmentDialog({ ...assignmentDialog, open: false })
                          }
                        }}
                        name="is_lab"
                      />
                    }
                    label="This is a Lab session (Multi-Subject)"
                    sx={{ mb: 2 }}
                  />

                  {/* Half Lab checkbox - only show when is_lab is checked */}
                  {assignmentForm.is_lab && (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={assignmentForm.is_half_lab}
                          onChange={(e) => setAssignmentForm({ ...assignmentForm, is_half_lab: e.target.checked })}
                          name="is_half_lab"
                        />
                      }
                      label="This is a Half Lab (0.4 workload)"
                      sx={{ mb: 2, ml: 4 }}
                    />
                  )}

                  {/* Teacher selection fields */}
                  {assignmentForm.is_lab ? (
                    <>
                      {/* Lead Teacher */}
                      <Box sx={{ mb: 2 }}>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label="Lead Teacher"
                          value={assignmentForm.lead_teacher_id}
                          onChange={(e) => setAssignmentForm({ ...assignmentForm, lead_teacher_id: e.target.value })}
                        >
                          {teachers.map((teacher) => (
                            <MenuItem key={teacher.id} value={teacher.id}>
                              {teacher.name} ({teacher.abbreviation}) - {teacher.department}
                            </MenuItem>
                          ))}
                        </TextField>
                        {assignmentForm.lead_teacher_id && !teacherAvailability.lead_teacher?.checking && (
                          teacherAvailability.lead_teacher?.available === false ? (
                            <Typography variant="caption" color="error.main" sx={{ mt: 0.5, display: 'block', fontSize: '0.75rem' }}>
                              Busy: {teacherAvailability.lead_teacher.conflicts.map(c => `${c.className} (${c.subjectName})`).join(', ')}
                            </Typography>
                          ) : teacherAvailability.lead_teacher?.available === true ? (
                            <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: 'block', fontSize: '0.75rem' }}>
                              ✓ Available
                            </Typography>
                          ) : null
                        )}
                      </Box>

                      {/* Assistant Teacher 1 */}
                      <Box sx={{ mb: 2 }}>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label="Assistant Teacher 1 (Optional)"
                          value={assignmentForm.assist_teacher_1_id}
                          onChange={(e) => setAssignmentForm({ ...assignmentForm, assist_teacher_1_id: e.target.value })}
                        >
                          <MenuItem value="">None</MenuItem>
                          {teachers.map((teacher) => (
                            <MenuItem key={teacher.id} value={teacher.id}>
                              {teacher.name} ({teacher.abbreviation}) - {teacher.department}
                            </MenuItem>
                          ))}
                        </TextField>
                        {assignmentForm.assist_teacher_1_id && !teacherAvailability.assist_teacher_1?.checking && (
                          teacherAvailability.assist_teacher_1?.available === false ? (
                            <Typography variant="caption" color="error.main" sx={{ mt: 0.5, display: 'block', fontSize: '0.75rem' }}>
                              Busy: {teacherAvailability.assist_teacher_1.conflicts.map(c => `${c.className} (${c.subjectName})`).join(', ')}
                            </Typography>
                          ) : teacherAvailability.assist_teacher_1?.available === true ? (
                            <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: 'block', fontSize: '0.75rem' }}>
                              ✓ Available
                            </Typography>
                          ) : null
                        )}
                      </Box>

                      {/* Assistant Teacher 2 */}
                      <Box sx={{ mb: 2 }}>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label="Assistant Teacher 2 (Optional)"
                          value={assignmentForm.assist_teacher_2_id}
                          onChange={(e) => setAssignmentForm({ ...assignmentForm, assist_teacher_2_id: e.target.value })}
                        >
                          <MenuItem value="">None</MenuItem>
                          {teachers.map((teacher) => (
                            <MenuItem key={teacher.id} value={teacher.id}>
                              {teacher.name} ({teacher.abbreviation}) - {teacher.department}
                            </MenuItem>
                          ))}
                        </TextField>
                        {assignmentForm.assist_teacher_2_id && !teacherAvailability.assist_teacher_2?.checking && (
                          teacherAvailability.assist_teacher_2?.available === false ? (
                            <Typography variant="caption" color="error.main" sx={{ mt: 0.5, display: 'block', fontSize: '0.75rem' }}>
                              Busy: {teacherAvailability.assist_teacher_2.conflicts.map(c => `${c.className} (${c.subjectName})`).join(', ')}
                            </Typography>
                          ) : teacherAvailability.assist_teacher_2?.available === true ? (
                            <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: 'block', fontSize: '0.75rem' }}>
                              ✓ Available
                            </Typography>
                          ) : null
                        )}
                      </Box>
                    </>
                  ) : (
                    <>
                      {/* Single Teacher for regular class */}
                      <Box sx={{ mb: 2 }}>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label="Teacher"
                          value={assignmentForm.lead_teacher_id}
                          onChange={(e) => setAssignmentForm({ ...assignmentForm, lead_teacher_id: e.target.value })}
                        >
                          {teachers.map((teacher) => (
                            <MenuItem key={teacher.id} value={teacher.id}>
                              {teacher.name} ({teacher.abbreviation}) - {teacher.department}
                            </MenuItem>
                          ))}
                        </TextField>
                        {assignmentForm.lead_teacher_id && !teacherAvailability.lead_teacher?.checking && (
                          teacherAvailability.lead_teacher?.available === false ? (
                            <Typography variant="caption" color="error.main" sx={{ mt: 0.5, display: 'block', fontSize: '0.75rem' }}>
                              Busy: {teacherAvailability.lead_teacher.conflicts.map(c => `${c.className} (${c.subjectName})`).join(', ')}
                            </Typography>
                          ) : teacherAvailability.lead_teacher?.available === true ? (
                            <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: 'block', fontSize: '0.75rem' }}>
                              ✓ Available
                            </Typography>
                          ) : null
                        )}
                      </Box>
                    </>
                  )}

                  {/* Room selection */}
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label={assignmentForm.is_lab ? "Lab Room" : "Room (Optional)"}
                    value={assignmentForm.room_no || ''}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, room_no: e.target.value })}
                    helperText={assignmentForm.is_lab ? "Select a lab room for this lab session" : ""}
                    sx={{ mb: 2 }}
                  >
                    <MenuItem value="">Select Room</MenuItem>
                    
                    {/* Computer Labs */}
                    <MenuItem disabled sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      Computer Labs
                    </MenuItem>
                    {rooms.filter(r => r.building === 'Computer Lab').map((room) => (
                      <MenuItem key={room.id} value={room.room_number} sx={{ pl: 4 }}>
                        {room.room_number}
                      </MenuItem>
                    ))}
                    
                    {/* Electrical Labs */}
                    <MenuItem disabled sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      Electrical Labs
                    </MenuItem>
                    {rooms.filter(r => r.building === 'Electrical Lab').map((room) => (
                      <MenuItem key={room.id} value={room.room_number} sx={{ pl: 4 }}>
                        {room.room_number}
                      </MenuItem>
                    ))}
                    
                    {/* Electronics Labs */}
                    <MenuItem disabled sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      Electronics Labs
                    </MenuItem>
                    {rooms.filter(r => r.building === 'Electronics Lab').map((room) => (
                      <MenuItem key={room.id} value={room.room_number} sx={{ pl: 4 }}>
                        {room.room_number}
                      </MenuItem>
                    ))}
                    
                    {/* Regular Classrooms */}
                    <MenuItem disabled sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      Classrooms
                    </MenuItem>
                    {rooms.filter(r => !r.building?.includes('Lab')).map((room) => (
                      <MenuItem 
                        key={room.id} 
                        value={room.room_number} 
                        sx={{ pl: 4 }}
                        disabled={assignmentForm.is_lab}
                      >
                        {room.room_number}
                      </MenuItem>
                    ))}
                  </TextField>

                  {/* Group selection for labs */}
                  {assignmentForm.is_lab && (
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Group"
                      value={assignmentForm.group || ''}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, group: e.target.value })}
                      sx={{ mb: 2 }}
                    >
                      <MenuItem value="">Select Group</MenuItem>
                      <MenuItem value="Single Group">Single Group</MenuItem>
                      <MenuItem value="X">X</MenuItem>
                      <MenuItem value="Y">Y</MenuItem>
                      <MenuItem value="Y/Z Alternate">Y/Z Alternate</MenuItem>
                    </TextField>
                  )}
                </>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAssignment}>Cancel</Button>
            <Button 
              onClick={handleSaveAssignment} 
              variant="contained"
              disabled={!assignmentForm.subject_id}
            >
              Assign
            </Button>
          </DialogActions>
        </Dialog>

        {/* Multi-Subject Lab Dialog */}
        <MultiSubjectLabDialog
          open={multiLabDialogOpen}
          onClose={() => {
            setMultiLabDialogOpen(false)
            setCurrentLabCell(null)
            setMultiLabDialogInitialData(null)
          }}
          onSave={handleSaveMultiSubjectLab}
          subjects={semesterSubjects.filter(s => s.is_lab === true)}
          teachers={teachers}
          rooms={rooms}
          dayId={currentLabCell?.dayId}
          periodId={currentLabCell?.periodId}
          numPeriods={assignmentForm.num_periods || 1}
          classId={formData.class_id}
          onCheckTeacherAvailability={checkTeacherAvailabilityForLab}
          initialData={multiLabDialogInitialData}
        />

        {/* Success/Error Snackbar */}
        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={snackbar.message === '✓ Auto-saved' ? 2000 : 6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  )
}
