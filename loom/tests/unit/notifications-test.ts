import { afterEach, beforeEach, describe, expect, test } from 'vitest'

import { notify, vibrate } from '../../src/features/notifications/notification-manager'
import { i18n } from '../../src/i18n'

class NotificationMock {
  static permission: NotificationPermission = 'granted'
  static requests: { body?: string; title: string }[] = []

  constructor(title: string, options?: NotificationOptions) {
    NotificationMock.requests.push({ body: options?.body, title })
  }

  static async requestPermission(): Promise<NotificationPermission> {
    return 'granted'
  }
}

const originalNotification = globalThis.Notification
const originalNavigator = globalThis.navigator

beforeEach(async () => {
  NotificationMock.requests = []
  Object.defineProperty(globalThis, 'Notification', { configurable: true, value: NotificationMock })

  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { vibrate: () => {return undefined} },
  })

  await i18n.changeLanguage('en')
})

afterEach(() => {
  Object.defineProperty(globalThis, 'Notification', { configurable: true, value: originalNotification })
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: originalNavigator })
})

describe('notification manager', () => {
  test('maps invite notifications to translated content', () => {
    notify('invite-received', { inviterName: 'Ahri' })

    expect(NotificationMock.requests).toEqual([{ body: 'Ahri sent you an invite.', title: 'Invite received' }])
  })

  test('uses the ready-check vibration pattern', () => {
    const patterns: (number | number[])[] = []

    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { vibrate: (pattern: number | number[]) => {return patterns.push(pattern)} },
    })

    notify('ready-check')
    vibrate([200, 100, 200])

    expect(patterns).toEqual([
      [200, 100, 200],
      [200, 100, 200],
    ])
  })
})
