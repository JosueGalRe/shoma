import { useDebugMode } from '@/core/debug'

export function DebugToggle() {
  const [enabled, toggle] = useDebugMode()

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-sm border border-lol-border-subtle/50 px-2 py-1 text-[10px] font-medium text-lol-text-muted transition-colors hover:border-lol-border-gold hover:text-lol-text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lol-border-gold"
      title={`Debug mode ${enabled ? 'ON' : 'OFF'}. Click to toggle and reload.`}
    >
      {enabled ? 'DBG: ON' : 'DBG: OFF'}
    </button>
  )
}
