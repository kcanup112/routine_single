import { useRegisterSW } from 'virtual:pwa-register/react'
import { Snackbar, Button, Alert } from '@mui/material'

export default function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  const handleClose = () => setNeedRefresh(false)

  return (
    <Snackbar
      open={needRefresh}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        severity="info"
        variant="filled"
        action={
          <>
            <Button color="inherit" size="small" onClick={() => updateServiceWorker(true)}>
              Update
            </Button>
            <Button color="inherit" size="small" onClick={handleClose}>
              Dismiss
            </Button>
          </>
        }
      >
        A new version is available.
      </Alert>
    </Snackbar>
  )
}
