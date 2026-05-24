import { useCallback, useState } from 'react'

// Debug mode is diagnostic infrastructure, not a user preference; keep this
// localStorage flag independent from the persisted settings-store.
const STORAGE_KEY = 'shoma-debug'

function readDebugFlag(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  try {
    const url = new URL(window.location.href)
    if (url.searchParams.has('debug')) {
      const value = url.searchParams.get('debug')
      return value !== 'false' && value !== '0'
    }
    return window.localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

const isDebugMode = readDebugFlag()

function setDebugMode(enabled: boolean): void {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(STORAGE_KEY, String(enabled))
}

export function useDebugMode(): [boolean, () => void] {
  const [enabled, setEnabled] = useState(isDebugMode)

  const toggle = useCallback(() => {
    const next = !enabled
    setEnabled(next)
    setDebugMode(next)
    window.location.reload()
  }, [enabled])

  return [enabled, toggle]
}

export function debugLog(...args: unknown[]): void {
  if (isDebugMode) {
    console.log(...args)
  }
}

export function debugError(...args: unknown[]): void {
  if (isDebugMode) {
    console.error(...args)
  }
}
