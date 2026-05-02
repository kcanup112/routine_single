import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// In dev mode, vite-plugin-pwa doesn't register a service worker.
// Register sw-push.js manually so push notifications work during development.
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw-push.js').then((reg) => {
    console.log('[Dev] Push SW registered, scope:', reg.scope)
    // Force update check so latest push handlers are always active
    reg.update()
  }).catch((err) => {
    console.warn('[Dev] Push SW registration failed:', err)
  })
}
