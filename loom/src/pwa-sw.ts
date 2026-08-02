import { clientsClaim } from 'workbox-core'
import { ExpirationPlugin } from 'workbox-expiration'
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst, NetworkFirst } from 'workbox-strategies'

interface PushPayload {
  body?: string
  icon?: string
  tag?: string
  title?: string
}

interface PwaServiceWorkerGlobalScope extends EventTarget {
  __WB_MANIFEST: { revision: string | null; url: string }[]
  clients: {
    openWindow: (url: string) => Promise<unknown>
  }
  registration: {
    showNotification: (title: string, options?: NotificationOptions) => Promise<void>
  }
  skipWaiting: () => void
}

function isPushPayload(value: unknown): value is PushPayload {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const body = Reflect.get(value, 'body')
  const icon = Reflect.get(value, 'icon')
  const tag = Reflect.get(value, 'tag')
  const title = Reflect.get(value, 'title')

  return (
    (body === undefined || typeof body === 'string') &&
    (icon === undefined || typeof icon === 'string') &&
    (tag === undefined || typeof tag === 'string') &&
    (title === undefined || typeof title === 'string')
  )
}

function hasJsonData(value: unknown): value is { json: () => unknown } {
  return typeof value === 'object' && value !== null && typeof Reflect.get(value, 'json') === 'function'
}

function isPushEventLike(event: Event): event is Event & {
  data: { json: () => unknown }
  waitUntil: (promise: Promise<unknown>) => void
} {
  return typeof Reflect.get(event, 'waitUntil') === 'function' && hasJsonData(Reflect.get(event, 'data'))
}

function hasNotification(value: unknown): value is { close: () => void } {
  return typeof value === 'object' && value !== null && typeof Reflect.get(value, 'close') === 'function'
}

function isNotificationClickEventLike(event: Event): event is Event & {
  notification: { close: () => void }
  waitUntil: (promise: Promise<unknown>) => void
} {
  return typeof Reflect.get(event, 'waitUntil') === 'function' && hasNotification(Reflect.get(event, 'notification'))
}

declare const self: PwaServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST) // eslint-disable-line no-underscore-dangle
cleanupOutdatedCaches()
clientsClaim()
self.skipWaiting()

// Runtime caches are versioned so a poisoned legacy cache (e.g. the old 'mimic-game-assets')
// Never survives a deploy; anything outside the keep list is deleted on activate.
const RUNTIME_CACHES = new Set(['shoma-game-assets-v1', 'shoma-game-data-v1'])

function hasWaitUntil(event: Event): event is Event & { waitUntil: (promise: Promise<unknown>) => void } {
  return typeof Reflect.get(event, 'waitUntil') === 'function'
}

self.addEventListener('activate', (event) => {
  if (!hasWaitUntil(event)) {
    return
  }

  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.flatMap((name) => {
          return RUNTIME_CACHES.has(name) || name.startsWith('workbox-precache') ? [] : [caches.delete(name)]
        }),
      )
    }),
  )
})

// Ddragon JSON data (versions, champions, runes) goes network-first so fresh data wins and a
// Poisoned or stale cache entries self-heal. Immutable images below stay cache-first.
registerRoute(
  ({ url }) => {
    return url.hostname === 'ddragon.leagueoflegends.com' && url.pathname.includes('/data/')
  },
  new NetworkFirst({
    cacheName: 'shoma-game-data-v1',
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 7 * 24 * 60 * 60,
        maxEntries: 50,
      }),
    ],
  }),
)

registerRoute(
  ({ url }) => {
    return url.hostname === 'ddragon.leagueoflegends.com' || url.hostname === 'raw.communitydragon.org'
  },
  new CacheFirst({
    cacheName: 'shoma-game-assets-v1',
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 14 * 24 * 60 * 60,
        maxEntries: 1000,
      }),
    ],
  }),
)

self.addEventListener('push', (event) => {
  if (!isPushEventLike(event)) {
    return
  }

  const payloadValue = event.data.json()
  const payload = isPushPayload(payloadValue) ? payloadValue : undefined

  const title = payload?.title ?? 'Mimic'

  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload?.body ?? '',
      icon: payload?.icon ?? '/icon-192.svg',
      tag: payload?.tag,
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  if (!isNotificationClickEventLike(event)) {
    return
  }

  event.notification.close()
  event.waitUntil(self.clients.openWindow('/'))
})
