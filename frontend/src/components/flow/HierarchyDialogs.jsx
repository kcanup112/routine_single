import { useState, useEffect } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Typography, Box, Alert,
} from '@mui/material'
import { subjectService, teacherService } from '../../services/index'

export function AddSubjectDialog({ open, onClose, semester, existingSubjectIds, onConfirm }) {
  const [subjects, setSubjects] = useState([])
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setError(null)
    setSelectedSubjectId('')
    subjectService.getAll()
      .then((res) => {
        const available = res.data.filter(
          (s) => s.is_active && !existingSubjectIds.includes(s.id)
        )
        setSubjects(available)
      })
      .catch(() => setError('Failed to load subjects'))
      .finally(() => setLoading(false))
  }, [open, existingSubjectIds])

  const handleConfirm = async () => {
    if (!selectedSubjectId) return
    setSubmitting(true)
    setError(null)
    try {
      await onConfirm(semester.id, subjects.find((s) => s.id === selectedSubjectId))
      onClose()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to add subject')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700, color: '#1e293b' }}>
        Add Subject to {semester?.name || 'Semester'}
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : subjects.length === 0 ? (
          <Typography sx={{ color: '#94a3b8', py: 2 }}>
            No available subjects to add. All subjects are already assigned.
          </Typography>
        ) : (
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Select Subject</InputLabel>
            <Select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} label="Select Subject">
              {subjects.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.name}</Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {s.code} {s.is_lab ? '• Lab' : '• Theory'} {s.credit_hours ? `• ${s.credit_hours} credits` : ''}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ color: '#64748b' }}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained" disabled={!selectedSubjectId || submitting}
          sx={{ bgcolor: '#1565c0', '&:hover': { bgcolor: '#0d47a1' } }}>
          {submitting ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Add Subject'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export function AddTeacherDialog({ open, onClose, subject, existingTeacherIds, onConfirm }) {
  const [teachers, setTeachers] = useState([])
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setError(null)
    setSelectedTeacherId('')
    teacherService.getAll()
      .then((res) => {
        const available = res.data.filter(
          (t) => t.is_active && !existingTeacherIds.includes(t.id)
        )
        setTeachers(available)
      })
      .catch(() => setError('Failed to load teachers'))
      .finally(() => setLoading(false))
  }, [open, existingTeacherIds])

  const handleConfirm = async () => {
    if (!selectedTeacherId) return
    setSubmitting(true)
    setError(null)
    try {
      await onConfirm(teachers.find((t) => t.id === selectedTeacherId), subject.id)
      onClose()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to assign teacher')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700, color: '#1e293b' }}>
        Assign Teacher to {subject?.name || 'Subject'}
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : teachers.length === 0 ? (
          <Typography sx={{ color: '#94a3b8', py: 2 }}>
            No available teachers to assign.
          </Typography>
        ) : (
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Select Teacher</InputLabel>
            <Select value={selectedTeacherId} onChange={(e) => setSelectedTeacherId(e.target.value)} label="Select Teacher">
              {teachers.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{t.name}</Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {t.abbreviation} • {t.designation || t.employment_type}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ color: '#64748b' }}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained" disabled={!selectedTeacherId || submitting}
          sx={{ bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}>
          {submitting ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Assign Teacher'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export function ConfirmRemoveDialog({ open, onClose, title, message, onConfirm }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleConfirm = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await onConfirm()
      onClose()
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to remove')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700, color: '#d32f2f' }}>{title}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography sx={{ color: '#475569' }}>{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ color: '#64748b' }}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained" disabled={submitting}
          sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}>
          {submitting ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Remove'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
