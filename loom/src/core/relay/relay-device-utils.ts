import { useSessionStore } from '@/core/state/session-store'

export function getDeviceDescription(): { browser: string; device: string } {
  const { userAgent } = navigator
  const devices = [
    ['Windows Phone', 'Windows Phone'],
    ['Windows computer', 'Win'],
    ['iPhone', 'iPhone'],
    ['iPad', 'iPad'],
    ['Kindle device', 'Silk'],
    ['Android device', 'Android'],
    ['PlayBook', 'PlayBook'],
    ['BlackBerry', 'BlackBerry'],
    ['macOS computer', 'Mac'],
    ['Linux computer', 'Linux'],
    ['Palm device', 'Palm'],
  ] as const
  const browsers = [
    ['Edge', 'Edge'],
    ['Chrome', 'Chrome'],
    ['Firefox', 'Firefox'],
    ['Safari', 'Safari'],
    ['Internet Explorer', 'MSIE'],
    ['Opera', 'Opera'],
    ['BlackBerry', 'CLDC'],
    ['Mozilla', 'Mozilla'],
  ] as const

  return {
    browser:
      browsers.find(([, marker]) => {
        return userAgent.includes(marker)
      })?.[0] ?? 'Unknown Browser',
    device:
      devices.find(([, marker]) => {
        // eslint-disable-next-line react-doctor/js-set-map-lookups -- String.includes on a <=5 marker list, not an array scan
        return userAgent.includes(marker)
      })?.[0] ?? 'Unknown Device',
  }
}

export function createDeviceId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16)
    const value = character === 'x' ? random : (random & 0x3) | 0x8

    return value.toString(16)
  })
}

export function getDeviceId(): string {
  const existing = useSessionStore.getState().deviceId

  if (existing) {
    return existing
  }

  const next = createDeviceId()

  useSessionStore.getState().setDeviceId(next)

  return next
}
