import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { i18n } from '@/i18n'

import { notificationTemplates, showNotification, translateNotification, vibrate } from './notification-utils'

class NotificationMock {
  static permission: NotificationPermission = 'granted'
  static requests: Array<{ body?: string; title: string }> = []

  constructor(title: string, options?: NotificationOptions) {
    NotificationMock.requests.push({ body: options?.body, title })
  }
}

const originalNotification = globalThis.Notification
const originalNavigator = globalThis.navigator
const originalHidden = document.hidden

beforeEach(() => {
  NotificationMock.requests = []
  NotificationMock.permission = 'granted'
  Object.defineProperty(globalThis, 'Notification', { value: NotificationMock, configurable: true })
  Object.defineProperty(globalThis, 'navigator', {
    value: { vibrate: vi.fn() },
    configurable: true,
  })
  Object.defineProperty(document, 'hidden', { configurable: true, value: false })

  vi.spyOn(i18n, 't').mockImplementation(((key: string, data?: Record<string, string>) => {
    if (key === 'notifications.inviteReceived.body') {
      return `${data?.inviterName ?? ''} sent you an invite.`
    }

    const translations: Record<string, string> = {
      'notifications.inviteReceived.title': 'Invite received',
      'notifications.matchFound.body': 'A match was found.',
      'notifications.matchFound.title': 'Match found',
      'notifications.readyCheck.body': 'A ready check is waiting.',
      'notifications.readyCheck.title': 'Ready check',
    }

    return translations[key] ?? key
  }) as never)
})

afterEach(() => {
  vi.restoreAllMocks()
  Object.defineProperty(globalThis, 'Notification', { value: originalNotification, configurable: true })
  Object.defineProperty(globalThis, 'navigator', { value: originalNavigator, configurable: true })
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
    const vibrateMock = navigator.vibrate as unknown as ReturnType<typeof vi.fn>

    vibrate([50])

    expect(vibrateMock).toHaveBeenCalledWith([50])

    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    vibrate(80)

    expect(vibrateMock).toHaveBeenCalledTimes(1)
  })
})
