const LANDSCAPE_QUERY = '(orientation: landscape)'

export function getIsLandscapeMobile() {
  if (typeof globalThis === 'undefined') {
    return false
  }

  return globalThis.matchMedia(LANDSCAPE_QUERY).matches && globalThis.innerWidth < 768
}

export function subscribeToOrientationChanges(callback: () => void) {
  if (typeof globalThis === 'undefined') {
    return () => {}
  }

  const mediaQuery = globalThis.matchMedia(LANDSCAPE_QUERY)

  globalThis.addEventListener('resize', callback)
  mediaQuery.addEventListener('change', callback)

  return () => {
    globalThis.removeEventListener('resize', callback)
    mediaQuery.removeEventListener('change', callback)
  }
}
