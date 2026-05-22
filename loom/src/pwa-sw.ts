import { clientsClaim } from 'workbox-core'
import { ExpirationPlugin } from 'workbox-expiration'
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'

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

registerRoute(
  ({ url }) => url.hostname === 'ddragon.leagueoflegends.com' || url.hostname === 'raw.communitydragon.org',
  new CacheFirst({
    cacheName: 'mimic-game-assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 1000,
        maxAgeSeconds: 14 * 24 * 60 * 60,
      }),
    ],
  }),
)

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
