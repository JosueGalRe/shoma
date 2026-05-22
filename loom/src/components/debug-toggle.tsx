import { useDebugMode } from '@/core/debug'

export function DebugToggle() {
  const [enabled, toggle] = useDebugMode()

  return (
    <button
      type='button'
      onClick={toggle}
      className='border-lol-border-subtle/50 text-lol-text-muted hover:border-lol-border-gold hover:text-lol-text-primary focus-visible:ring-lol-border-gold min-h-[44px] rounded-sm border px-2 py-1 text-[10px] font-medium transition-colors focus-visible:ring-1 focus-visible:outline-none'
      title={`Debug mode ${enabled ? 'ON' : 'OFF'}. Click to toggle and reload.`}
    >
      {enabled ? 'DBG: ON' : 'DBG: OFF'}
    </button>
  )
}
