const LANDSCAPE_QUERY = '(orientation: landscape)'

export function getIsLandscapeMobile() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.matchMedia(LANDSCAPE_QUERY).matches && window.innerWidth < 768
}

export function subscribeToOrientationChanges(callback: () => void) {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const mediaQuery = window.matchMedia(LANDSCAPE_QUERY)

  window.addEventListener('resize', callback)
  mediaQuery.addEventListener('change', callback)

  return () => {
    window.removeEventListener('resize', callback)
    mediaQuery.removeEventListener('change', callback)
  }
}
