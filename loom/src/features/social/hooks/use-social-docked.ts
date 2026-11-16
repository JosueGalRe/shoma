import { useSyncExternalStore } from 'react'

// Room for the screens' 412px column and a 320px Social beside it, as the client keeps its friend list at the right
const DOCKED_QUERY = '(min-width: 740px)'

function subscribe(onChange: () => void) {
  if (typeof globalThis.matchMedia !== 'function') {
    return () => {}
  }

  const query = globalThis.matchMedia(DOCKED_QUERY)

  query.addEventListener('change', onChange)

  return () => {
    query.removeEventListener('change', onChange)
  }
}

function isDocked() {
  return typeof globalThis.matchMedia === 'function' && globalThis.matchMedia(DOCKED_QUERY).matches
}

// A wide window (tablet, desktop) keeps Social open in a panel beside the screens instead of over them
export function useSocialDocked(): boolean {
  return useSyncExternalStore(subscribe, isDocked, () => {
    return false
  })
}
