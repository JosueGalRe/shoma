import { useDebugMode } from '@/core/debug'

import { debugToggleStyles } from './debug-toggle-styles'

export function DebugToggle() {
  const [enabled, toggle] = useDebugMode()
  const styles = debugToggleStyles()

  return (
    <button
      type="button"
      onClick={toggle}
      className={styles.button()}
      title={`Debug mode ${enabled ? 'ON' : 'OFF'}. Click to toggle and reload.`}
    >
      {enabled ? 'DBG: ON' : 'DBG: OFF'}
    </button>
  )
}
