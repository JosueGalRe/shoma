import { persistSessionCode } from './use-auto-reconnect'

export function resolveConnectionCode(code: string, nextCode?: string): string {
  return nextCode ?? code
}

export function isSixDigitConnectionCode(value: string): boolean {
  return /^\d{6}$/.test(value)
}

export function persistConnectionCode(value: string): void {
  window.localStorage.setItem('conduitID', value)
  persistSessionCode(value)
}
