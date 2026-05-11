import { clientsClaim } from 'workbox-core'
import { precacheAndRoute } from 'workbox-precaching'

type PushPayload = {
  body?: string
  icon?: string
  tag?: string
  title?: string
}

type WorkerEventLike = {
  waitUntil: (promise: Promise<unknown>) => void
}

type PushEventLike = WorkerEventLike & {
  data?: {
    json: () => unknown
  }
}

type NotificationClickEventLike = WorkerEventLike & {
  notification: {
    close: () => void
  }
}

interface PwaServiceWorkerGlobalScope extends EventTarget {
  __WB_MANIFEST: Array<{ revision: string | null; url: string }>
  clients: {
    openWindow: (url: string) => Promise<unknown>
  }
  registration: {
    showNotification: (title: string, options?: NotificationOptions) => Promise<void>
  }
  skipWaiting: () => void
}

declare const self: PwaServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)
clientsClaim()
self.skipWaiting()

self.addEventListener('push', (event) => {
  const pushEvent = event as unknown as PushEventLike
  const payload = pushEvent.data?.json() as PushPayload | undefined

  const title = payload?.title ?? 'Mimic'

  pushEvent.waitUntil(
    self.registration.showNotification(title, {
      body: payload?.body ?? '',
      icon: payload?.icon ?? '/icon-192.svg',
      tag: payload?.tag,
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  const notificationEvent = event as unknown as NotificationClickEventLike
  notificationEvent.notification.close()
  notificationEvent.waitUntil(self.clients.openWindow('/'))
})
