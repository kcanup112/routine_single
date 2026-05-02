import api from './api'

/**
 * Convert a base64-encoded VAPID public key to a Uint8Array
 * required by the PushManager.subscribe() method.
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// ─── Push API helpers (only work on localhost / HTTPS) ───

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export async function getExistingSubscription() {
  if (!('serviceWorker' in navigator)) return null
  const registration = await navigator.serviceWorker.getRegistration()
  if (!registration) return null
  return registration.pushManager.getSubscription()
}

export async function isSubscribed() {
  if (!isPushSupported()) return false
  try {
    const sub = await getExistingSubscription()
    return !!sub
  } catch {
    return false
  }
}

export async function subscribeToPush() {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported on this connection (requires HTTPS)')
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Notification permission denied. Please allow notifications in your browser settings.')
  }

  const { data } = await api.get('/notifications/vapid-public-key')
  const applicationServerKey = urlBase64ToUint8Array(data.publicKey)

  let registration
  try {
    registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Service worker not ready. Try refreshing the page.')), 5000)
      ),
    ])
  } catch {
    registration = await navigator.serviceWorker.register('/sw-push.js')
    await new Promise(resolve => setTimeout(resolve, 1000))
    registration = await navigator.serviceWorker.ready
  }

  let subscription
  try {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    })
  } catch (pushErr) {
    if (pushErr.name === 'NotAllowedError') {
      throw new Error('Push permission denied. Please allow notifications and try again.')
    }
    throw new Error('Push registration failed: ' + (pushErr.message || pushErr.name))
  }

  const subJson = subscription.toJSON()
  await api.post('/notifications/subscribe', {
    endpoint: subJson.endpoint,
    keys: subJson.keys,
  })

  return subscription
}

export async function unsubscribeFromPush() {
  const subscription = await getExistingSubscription()
  if (!subscription) return

  await api.delete('/notifications/unsubscribe', {
    data: { endpoint: subscription.endpoint },
  })

  await subscription.unsubscribe()
}


// ─── In-app notifications (work over HTTP on any network) ───

export async function fetchInAppNotifications(since = null, limit = 30) {
  const params = { limit }
  if (since) params.since = since
  const { data } = await api.get('/notifications/in-app', { params })
  return data
}
