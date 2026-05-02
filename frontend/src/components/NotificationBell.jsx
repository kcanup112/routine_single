import { useState, useEffect, useCallback, useRef } from 'react'
import {
  IconButton,
  Badge,
  Popover,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Divider,
  Tooltip,
  Snackbar,
  Alert,
  Switch,
  FormControlLabel,
} from '@mui/material'
import {
  Notifications as NotificationsIcon,
  NotificationsNone as NotificationsNoneIcon,
  Circle as CircleIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import {
  fetchInAppNotifications,
  isPushSupported,
  isSubscribed as checkPushSubscribed,
  subscribeToPush,
  unsubscribeFromPush,
} from '../services/notificationService'
import api from '../services/api'

const POLL_INTERVAL = 20_000 // 20 seconds
const LAST_READ_KEY = 'kec_notif_last_read'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [anchorEl, setAnchorEl] = useState(null)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const [newToast, setNewToast] = useState(null) // for showing a toast on new notification
  const lastReadRef = useRef(localStorage.getItem(LAST_READ_KEY) || new Date(0).toISOString())
  const prevCountRef = useRef(0)
  const open = Boolean(anchorEl)

  // Fetch notifications
  const loadNotifications = useCallback(async () => {
    try {
      const data = await fetchInAppNotifications(null, 30)
      setNotifications(data)

      // Count unread
      const lastRead = lastReadRef.current
      const unread = data.filter((n) => n.created_at > lastRead).length
      setUnreadCount(unread)

      // Show toast if there are new notifications since last poll
      if (unread > prevCountRef.current && prevCountRef.current >= 0 && data.length > 0) {
        const newest = data[0]
        setNewToast({ title: newest.title, body: newest.body })
      }
      prevCountRef.current = unread
    } catch {
      // Silently fail — user might not be authenticated yet
    }
  }, [])

  // Poll for new notifications
  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [loadNotifications])

  // Check push subscription status on mount
  useEffect(() => {
    if (isPushSupported()) {
      checkPushSubscribed().then(setPushEnabled).catch(() => {})
    }
  }, [])

  // Open notification panel
  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget)
    // Mark all as read
    const now = new Date().toISOString()
    lastReadRef.current = now
    localStorage.setItem(LAST_READ_KEY, now)
    setUnreadCount(0)
    prevCountRef.current = 0
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  // Toggle push notifications (only available on localhost / HTTPS)
  const handleTogglePush = async () => {
    if (pushLoading) return
    setPushLoading(true)
    try {
      if (pushEnabled) {
        await unsubscribeFromPush()
        setPushEnabled(false)
        setSnackbar({ open: true, message: 'Desktop push notifications disabled', severity: 'info' })
      } else {
        await subscribeToPush()
        setPushEnabled(true)
        setSnackbar({ open: true, message: 'Desktop push notifications enabled!', severity: 'success' })
      }
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || 'Failed to toggle push notifications'
      setSnackbar({ open: true, message: msg, severity: 'error' })
    } finally {
      setPushLoading(false)
    }
  }

  // Time-ago formatter
  const timeAgo = (isoStr) => {
    const diff = Date.now() - new Date(isoStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          onClick={handleOpen}
          sx={{
            color: unreadCount > 0 ? '#6366f1' : '#94a3b8',
            bgcolor: unreadCount > 0 ? 'rgba(99, 102, 241, 0.1)' : '#f1f5f9',
            '&:hover': {
              bgcolor: unreadCount > 0 ? 'rgba(99, 102, 241, 0.2)' : '#e2e8f0',
            },
          }}
        >
          <Badge badgeContent={unreadCount} color="error" max={99}>
            {unreadCount > 0 ? <NotificationsIcon /> : <NotificationsNoneIcon />}
          </Badge>
        </IconButton>
      </Tooltip>

      {/* Notification dropdown */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { width: 360, maxHeight: 480, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
          },
        }}
      >
        {/* Header */}
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Notifications
          </Typography>
          {isPushSupported() && (
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={pushEnabled}
                  onChange={handleTogglePush}
                  disabled={pushLoading}
                />
              }
              label={<Typography variant="caption" color="text.secondary">Push</Typography>}
              sx={{ mr: 0 }}
            />
          )}
        </Box>

        <Divider />

        {/* List */}
        <List sx={{ overflow: 'auto', flex: 1, py: 0 }}>
          {notifications.length === 0 ? (
            <ListItem>
              <ListItemText
                primary={
                  <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                    No notifications yet
                  </Typography>
                }
              />
            </ListItem>
          ) : (
            notifications.map((n) => {
              const isUnread = n.created_at > lastReadRef.current
              return (
                <ListItem
                  key={n.id}
                  button
                  onClick={() => {
                    if (n.url) window.location.href = n.url
                    handleClose()
                  }}
                  sx={{
                    bgcolor: isUnread ? 'rgba(99, 102, 241, 0.04)' : 'transparent',
                    '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.08)' },
                    py: 1,
                    px: 2,
                    alignItems: 'flex-start',
                  }}
                >
                  {isUnread && (
                    <CircleIcon sx={{ color: '#6366f1', fontSize: 8, mt: 1, mr: 1, flexShrink: 0 }} />
                  )}
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={isUnread ? 600 : 400}>
                        {n.title}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="caption" color="text.secondary" component="span" display="block">
                          {n.body}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" component="span">
                          {timeAgo(n.created_at)}
                        </Typography>
                      </>
                    }
                    sx={{ my: 0 }}
                  />
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      api.delete(`/notifications/in-app/${n.id}`).then(() => {
                        setNotifications((prev) => prev.filter((x) => x.id !== n.id))
                      })
                    }}
                    sx={{
                      opacity: 0.4,
                      '&:hover': { opacity: 1, color: '#ef4444' },
                      flexShrink: 0,
                      ml: 0.5,
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </ListItem>
              )
            })
          )}
        </List>
      </Popover>

      {/* Toast for new notification */}
      <Snackbar
        open={!!newToast}
        autoHideDuration={5000}
        onClose={() => setNewToast(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setNewToast(null)}
          severity="info"
          variant="filled"
          icon={<NotificationsIcon fontSize="small" />}
          sx={{ width: '100%' }}
        >
          <Typography variant="subtitle2">{newToast?.title}</Typography>
          <Typography variant="caption">{newToast?.body}</Typography>
        </Alert>
      </Snackbar>

      {/* Snackbar for push toggle feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
}
