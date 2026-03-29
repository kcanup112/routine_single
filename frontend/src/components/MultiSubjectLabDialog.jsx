import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  TextField,
  MenuItem,
  IconButton,
  Typography,
  FormControlLabel,
  Checkbox,
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material'

export default function MultiSubjectLabDialog({ 
  open, 
  onClose, 
  onSave, 
  subjects,
  teachers,
  rooms = [],
  dayId,
  periodId,
  numPeriods = 1,
  classId,
  onCheckTeacherAvailability,
  initialData = null
}) {
  const [activeTab, setActiveTab] = useState(0)
  const [labSubjects, setLabSubjects] = useState([{
    subject_id: '',
    group: '',
    lab_room: '',
    is_half_lab: false,
    num_periods: 1,
    lead_teacher_id: '',
    assist_teacher_1_id: '',
    assist_teacher_2_id: '',
    assist_teacher_3_id: '',
  }])
  const [teacherAvailability, setTeacherAvailability] = useState({})

  // Update labSubjects when initialData or open state changes
  useEffect(() => {
    if (open) {
      if (initialData && initialData.length > 0) {
        setLabSubjects(initialData)
        setActiveTab(0)
      } else {
        setLabSubjects([{
          subject_id: '',
          group: '',
          lab_room: '',
          is_half_lab: false,
          num_periods: 1,
          lead_teacher_id: '',
          assist_teacher_1_id: '',
          assist_teacher_2_id: '',
          assist_teacher_3_id: '',
        }])
        setActiveTab(0)
      }
    }
  }, [open, initialData])

  // Check teacher availability when teacher is selected
  useEffect(() => {
    const checkAllTeachers = async () => {
      if (!dayId || !periodId || !onCheckTeacherAvailability) return

      const availability = {}
      
      for (const [index, labSubject] of labSubjects.entries()) {
        // Check lead teacher
        if (labSubject.lead_teacher_id) {
          const result = await onCheckTeacherAvailability(
            labSubject.lead_teacher_id,
            dayId,
            periodId,
            numPeriods,
            classId
          )
          availability[`${index}-lead`] = result
        }

        // Check assistant teacher 1
        if (labSubject.assist_teacher_1_id) {
          const result = await onCheckTeacherAvailability(
            labSubject.assist_teacher_1_id,
            dayId,
            periodId,
            numPeriods,
            classId
          )
          availability[`${index}-assist1`] = result
        }

        // Check assistant teacher 2
        if (labSubject.assist_teacher_2_id) {
          const result = await onCheckTeacherAvailability(
            labSubject.assist_teacher_2_id,
            dayId,
            periodId,
            numPeriods,
            classId
          )
          availability[`${index}-assist2`] = result
        }

        // Check assistant teacher 3
        if (labSubject.assist_teacher_3_id) {
          const result = await onCheckTeacherAvailability(
            labSubject.assist_teacher_3_id,
            dayId,
            periodId,
            numPeriods,
            classId
          )
          availability[`${index}-assist3`] = result
        }
      }

      setTeacherAvailability(availability)
    }

    checkAllTeachers()
  }, [labSubjects, dayId, periodId, numPeriods, classId, onCheckTeacherAvailability])

  const handleAddSubject = () => {
    setLabSubjects([...labSubjects, {
      subject_id: '',
      group: '',
      lab_room: '',
      is_half_lab: false,
      num_periods: 1,
      lead_teacher_id: '',
      assist_teacher_1_id: '',
      assist_teacher_2_id: '',
      assist_teacher_3_id: '',
    }])
    setActiveTab(labSubjects.length)
  }

  const handleRemoveSubject = (index) => {
    const newSubjects = labSubjects.filter((_, i) => i !== index)
    setLabSubjects(newSubjects)
    if (activeTab >= newSubjects.length) {
      setActiveTab(Math.max(0, newSubjects.length - 1))
    }
  }

  const handleSubjectChange = (index, field, value) => {
    const newSubjects = [...labSubjects]
    newSubjects[index] = {
      ...newSubjects[index],
      [field]: value
    }
    setLabSubjects(newSubjects)
  }

  const handleSave = () => {
    // Validate that all subjects have required fields
    const isValid = labSubjects.every(sub => 
      sub.subject_id && sub.group && sub.lab_room && sub.lead_teacher_id
    )
    
    if (!isValid) {
      alert('Please fill in all required fields (Subject, Group, Lab Room, and Lead Teacher) for all lab subjects')
      return
    }
    
    onSave(labSubjects)
    onClose()
  }

  const handleClose = () => {
    setLabSubjects([{
      subject_id: '',
      group: '',
      lab_room: '',
      is_half_lab: false,
      num_periods: 1,
      lead_teacher_id: '',
      assist_teacher_1_id: '',
      assist_teacher_2_id: '',
    }])
    setActiveTab(0)
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Configure Lab Subjects (Multi-Group)
        {labSubjects.length < 4 && (
          <IconButton 
            onClick={handleAddSubject}
            sx={{ float: 'right' }}
            color="primary"
            title="Add another subject"
          >
            <AddIcon />
          </IconButton>
        )}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            {labSubjects.map((_, index) => (
              <Tab 
                key={index} 
                label={`Subject ${index + 1}`}
                icon={
                  index > 0 ? (
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveSubject(index)
                      }}
                      sx={{ ml: 1 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  ) : null
                }
                iconPosition="end"
              />
            ))}
          </Tabs>
        </Box>

        {labSubjects.map((labSubject, index) => (
          <Box key={index} hidden={activeTab !== index}>
            {/* Subject Selection */}
            <TextField
              select
              fullWidth
              label="Subject *"
              value={labSubject.subject_id}
              onChange={(e) => handleSubjectChange(index, 'subject_id', e.target.value)}
              sx={{ mb: 2 }}
              required
            >
              {subjects.map((subject) => (
                <MenuItem key={subject.id} value={subject.id}>
                  {subject.name} ({subject.code})
                </MenuItem>
              ))}
            </TextField>

            {/* Group Selection */}
            <TextField
              select
              fullWidth
              label="Group *"
              value={labSubject.group}
              onChange={(e) => handleSubjectChange(index, 'group', e.target.value)}
              sx={{ mb: 2 }}
              required
            >
              <MenuItem value="Y">Y</MenuItem>
              <MenuItem value="Z">Z</MenuItem>
              <MenuItem value="Y/Z">Y/Z</MenuItem>
              <MenuItem value="Y/Z (Alternate)">Y/Z (Alternate)</MenuItem>
            </TextField>

            {/* Lab Room */}
            <TextField
              select
              fullWidth
              label="Lab Room *"
              value={labSubject.lab_room}
              onChange={(e) => handleSubjectChange(index, 'lab_room', e.target.value)}
              sx={{ mb: 2 }}
              required
            >
              {rooms.map((room) => (
                <MenuItem key={room.id} value={room.room_number}>
                  {room.room_number}
                </MenuItem>
              ))}
            </TextField>

            {/* Number of Periods */}
            <TextField
              select
              fullWidth
              label="Number of Periods *"
              value={labSubject.num_periods || 1}
              onChange={(e) => handleSubjectChange(index, 'num_periods', parseInt(e.target.value))}
              sx={{ mb: 2 }}
              required
            >
              <MenuItem value={1}>1 Period</MenuItem>
              <MenuItem value={2}>2 Periods</MenuItem>
              <MenuItem value={3}>3 Periods</MenuItem>
              <MenuItem value={4}>4 Periods</MenuItem>
            </TextField>

            {/* Half Lab Checkbox */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={labSubject.is_half_lab || false}
                  onChange={(e) => handleSubjectChange(index, 'is_half_lab', e.target.checked)}
                />
              }
              label="Half Lab (0.4 workload instead of 0.8)"
              sx={{ mb: 2 }}
            />

            {/* Lead Teacher */}
            <Box sx={{ mb: 2 }}>
              <TextField
                select
                fullWidth
                label="Lead Teacher *"
                value={labSubject.lead_teacher_id}
                onChange={(e) => handleSubjectChange(index, 'lead_teacher_id', e.target.value)}
                required
              >
                {teachers.map((teacher) => (
                  <MenuItem key={teacher.id} value={teacher.id}>
                    {teacher.name} ({teacher.abbreviation})
                  </MenuItem>
                ))}
              </TextField>
              {labSubject.lead_teacher_id && teacherAvailability[`${index}-lead`]?.has_conflict && (
                <Typography variant="caption" color="error.main" sx={{ mt: 0.5, display: 'block', fontSize: '0.75rem' }}>
                  Busy: {teacherAvailability[`${index}-lead`].conflicts.map(c => `${c.class_name} (${c.subject_name})`).join(', ')}
                </Typography>
              )}
              {labSubject.lead_teacher_id && teacherAvailability[`${index}-lead`]?.has_conflict === false && (
                <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: 'block', fontSize: '0.75rem' }}>
                  ✓ Available
                </Typography>
              )}
            </Box>

            {/* Assistant Teacher 1 */}
            <Box sx={{ mb: 2 }}>
              <TextField
                select
                fullWidth
                label="Assistant Teacher 1 (Optional)"
                value={labSubject.assist_teacher_1_id}
                onChange={(e) => handleSubjectChange(index, 'assist_teacher_1_id', e.target.value)}
              >
                <MenuItem value="">None</MenuItem>
                {teachers.map((teacher) => (
                  <MenuItem key={teacher.id} value={teacher.id}>
                    {teacher.name} ({teacher.abbreviation})
                  </MenuItem>
                ))}
              </TextField>
              {labSubject.assist_teacher_1_id && teacherAvailability[`${index}-assist1`]?.has_conflict && (
                <Typography variant="caption" color="error.main" sx={{ mt: 0.5, display: 'block', fontSize: '0.75rem' }}>
                  Busy: {teacherAvailability[`${index}-assist1`].conflicts.map(c => `${c.class_name} (${c.subject_name})`).join(', ')}
                </Typography>
              )}
              {labSubject.assist_teacher_1_id && teacherAvailability[`${index}-assist1`]?.has_conflict === false && (
                <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: 'block', fontSize: '0.75rem' }}>
                  ✓ Available
                </Typography>
              )}
            </Box>

            {/* Assistant Teacher 2 */}
            <Box sx={{ mb: 2 }}>
              <TextField
                select
                fullWidth
                label="Assistant Teacher 2 (Optional)"
                value={labSubject.assist_teacher_2_id}
                onChange={(e) => handleSubjectChange(index, 'assist_teacher_2_id', e.target.value)}
              >
                <MenuItem value="">None</MenuItem>
                {teachers.map((teacher) => (
                  <MenuItem key={teacher.id} value={teacher.id}>
                    {teacher.name} ({teacher.abbreviation})
                  </MenuItem>
                ))}
              </TextField>
              {labSubject.assist_teacher_2_id && teacherAvailability[`${index}-assist2`]?.has_conflict && (
                <Typography variant="caption" color="error.main" sx={{ mt: 0.5, display: 'block', fontSize: '0.75rem' }}>
                  Busy: {teacherAvailability[`${index}-assist2`].conflicts.map(c => `${c.class_name} (${c.subject_name})`).join(', ')}
                </Typography>
              )}
              {labSubject.assist_teacher_2_id && teacherAvailability[`${index}-assist2`]?.has_conflict === false && (
                <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: 'block', fontSize: '0.75rem' }}>
                  ✓ Available
                </Typography>
              )}
            </Box>

            {/* Assistant Teacher 3 */}
            <Box sx={{ mb: 2 }}>
              <TextField
                select
                fullWidth
                label="Assistant Teacher 3 (Optional)"
                value={labSubject.assist_teacher_3_id}
                onChange={(e) => handleSubjectChange(index, 'assist_teacher_3_id', e.target.value)}
              >
                <MenuItem value="">None</MenuItem>
                {teachers.map((teacher) => (
                  <MenuItem key={teacher.id} value={teacher.id}>
                    {teacher.name} ({teacher.abbreviation})
                  </MenuItem>
                ))}
              </TextField>
              {labSubject.assist_teacher_3_id && teacherAvailability[`${index}-assist3`]?.has_conflict && (
                <Typography variant="caption" color="error.main" sx={{ mt: 0.5, display: 'block', fontSize: '0.75rem' }}>
                  Busy: {teacherAvailability[`${index}-assist3`].conflicts.map(c => `${c.class_name} (${c.subject_name})`).join(', ')}
                </Typography>
              )}
              {labSubject.assist_teacher_3_id && teacherAvailability[`${index}-assist3`]?.has_conflict === false && (
                <Typography variant="caption" color="success.main" sx={{ mt: 0.5, display: 'block', fontSize: '0.75rem' }}>
                  ✓ Available
                </Typography>
              )}
            </Box>
          </Box>
        ))}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          OK
        </Button>
      </DialogActions>
    </Dialog>
  )
}
