import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { i18n } from '@/i18n'

import { notificationTemplates, showNotification, translateNotification, vibrate } from './notification-utils'

class NotificationMock {
  static permission: NotificationPermission = 'granted'
  static requests: { body?: string; title: string }[] = []

  constructor(title: string, options?: NotificationOptions) {
    NotificationMock.requests.push({ body: options?.body, title })
  }
}

const originalNotification = globalThis.Notification
const originalNavigator = globalThis.navigator
const originalHidden = document.hidden
let vibrateSpy = vi.fn()

beforeEach(() => {
  NotificationMock.requests = []
  NotificationMock.permission = 'granted'
  Object.defineProperty(globalThis, 'Notification', { configurable: true, value: NotificationMock })
  vibrateSpy = vi.fn()
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { vibrate: vibrateSpy } })
  Object.defineProperty(document, 'hidden', { configurable: true, value: false })

  const translate = (...args: Parameters<typeof i18n.t>) => {
    const [key, data] = args
    let lookupKey: string

    if (Array.isArray(key)) {
      lookupKey = key.join('')
    } else {
      lookupKey = String(key)
    }

    const inviterNameCandidate: unknown = data && typeof data === 'object' ? Reflect.get(data, 'inviterName') : undefined
    const inviterName = typeof inviterNameCandidate === 'string' ? inviterNameCandidate : ''

    if (lookupKey === 'notifications.inviteReceived.body') {
      return `${inviterName} sent you an invite.`
    }

    const translations: Record<string, string> = {
      'notifications.inviteReceived.title': 'Invite received',
      'notifications.matchFound.body': 'A match was found.',
      'notifications.matchFound.title': 'Match found',
      'notifications.readyCheck.body': 'A ready check is waiting.',
      'notifications.readyCheck.title': 'Ready check',
    }

    return translations[lookupKey] ?? lookupKey
  }

  vi.spyOn(i18n, 't').mockImplementation(translate)
})

afterEach(() => {
  vi.restoreAllMocks()
  Object.defineProperty(globalThis, 'Notification', { configurable: true, value: originalNotification })
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: originalNavigator })
  Object.defineProperty(document, 'hidden', { configurable: true, value: originalHidden })
})

describe('notification-utils', () => {
  test('translates notification templates into the expected title and body keys', () => {
    expect(translateNotification('invite-received', { inviterName: 'Ahri' })).toEqual({
      body: 'Ahri sent you an invite.',
      title: 'Invite received',
    })

    expect(notificationTemplates['ready-check'].vibrate).toEqual([200, 100, 200])
  })

  test('shows notifications only when permission is granted', () => {
    showNotification('Hello', { body: 'World' })

    expect(NotificationMock.requests).toEqual([{ body: 'World', title: 'Hello' }])

    NotificationMock.permission = 'denied'
    showNotification('Blocked', { body: 'Nope' })

    expect(NotificationMock.requests).toEqual([{ body: 'World', title: 'Hello' }])
  })

  test('vibrates only when the document is visible and the API exists', () => {
    vibrate([50])

    expect(vibrateSpy).toHaveBeenCalledWith([50])

    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    vibrate(80)

    expect(vibrateSpy).toHaveBeenCalledTimes(1)
  })
})
