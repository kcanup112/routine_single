/**
 * Custom service worker push event handlers.
 * Imported by the Workbox-generated SW via importScripts (production),
 * or registered directly as the SW in dev mode.
 */

// Log that this SW script loaded
console.log('[sw-push] Service worker push handlers loaded')

// Activate immediately — don't wait for old SW to die
self.addEventListener('install', (event) => {
  console.log('[sw-push] Installing...')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('[sw-push] Activated')
  event.waitUntil(self.clients.claim())
})

// Handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[sw-push] Push event received:', event)

  if (!event.data) {
    console.warn('[sw-push] Push event has no data')
    return
  }

  let data
  try {
    data = event.data.json()
    console.log('[sw-push] Push data:', JSON.stringify(data))
  } catch (e) {
    console.warn('[sw-push] Failed to parse push data as JSON, using text:', e)
    data = { title: 'KEC Routine Scheduler', body: event.data.text() }
  }

  const title = data.title || 'KEC Routine Scheduler'
  const options = {
    body: data.body || '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: data.tag || 'general',
    renotify: true,
    data: {
      url: data.url || '/dashboard',
    },
  }

  console.log('[sw-push] Showing notification:', title, options)
  event.waitUntil(self.registration.showNotification(title, options))
})

// Handle notification click — open or focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // If the app is already open, focus it and navigate
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin)) {
            client.navigate(targetUrl)
            return client.focus()
          }
        }
        // Otherwise open a new window
        return clients.openWindow(targetUrl)
      })
  )
})
