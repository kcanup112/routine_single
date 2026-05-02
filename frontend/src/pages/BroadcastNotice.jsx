import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material'
import { Campaign as BroadcastIcon, Send as SendIcon } from '@mui/icons-material'
import api from '../services/api'

export default function BroadcastNotice() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications/in-app', { params: { limit: 50 } })
      setHistory(data)
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const handleSend = async () => {
    if (!title.trim()) return
    setSending(true)
    try {
      await api.post('/notifications/broadcast', { title: title.trim(), body: body.trim() })
      setSnackbar({ open: true, message: 'Notice sent to all users!', severity: 'success' })
      setTitle('')
      setBody('')
      fetchHistory()
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.detail || 'Failed to send notice',
        severity: 'error',
      })
    } finally {
      setSending(false)
    }
  }

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <BroadcastIcon sx={{ fontSize: 32, color: '#6366f1' }} />
        <Typography variant="h5" fontWeight={700} color="#1e293b">
          Send Notice
        </Typography>
      </Box>

      <Card sx={{ mb: 4, borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            Send a short notice to all users. They will see it in their notification bell.
          </Typography>

          <TextField
            label="Title"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Class Cancelled Tomorrow"
            sx={{ mb: 2 }}
            inputProps={{ maxLength: 200 }}
          />

          <TextField
            label="Message (optional)"
            fullWidth
            multiline
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add more details here..."
            sx={{ mb: 3 }}
            inputProps={{ maxLength: 1000 }}
          />

          <Button
            variant="contained"
            startIcon={sending ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
            onClick={handleSend}
            disabled={sending || !title.trim()}
            sx={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              '&:hover': { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' },
            }}
          >
            {sending ? 'Sending...' : 'Send Notice'}
          </Button>
        </CardContent>
      </Card>

      <Typography variant="h6" fontWeight={600} color="#1e293b" sx={{ mb: 2 }}>
        Recent Notices
      </Typography>

      {loadingHistory ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : history.length === 0 ? (
        <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
          <Typography color="text.secondary">No notices sent yet.</Typography>
        </Paper>
      ) : (
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <List disablePadding>
            {history.map((n, i) => (
              <Box key={n.id}>
                {i > 0 && <Divider />}
                <ListItem sx={{ py: 1.5, px: 2.5 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {n.title}
                        </Typography>
                        {n.tag && (
                          <Chip
                            label={n.tag}
                            size="small"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        {n.body && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {n.body}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                          {timeAgo(n.created_at)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              </Box>
            ))}
          </List>
        </Paper>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
