import { statusColor, statusTextKey } from '../app'

import type { TranslationKey } from '../app'

export function PillStatus({
  label,
  status,
  hasError,
  t,
}: {
  label: string
  status: 'waiting' | 'connecting' | 'connected' | 'paired'
  hasError: boolean
  t: (key: TranslationKey) => string
}) {
  const color = statusColor(status, hasError)

  return (
    <div
      className='pill-status'
      style={{
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        borderColor: `color-mix(in srgb, ${color} 25%, transparent)`,
      }}
    >
      <div className='pill-status-dot' style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }} />

      <span className='pill-status-label'>{label}</span>

      <span className='pill-status-value' style={{ color }}>
        {t(statusTextKey(status))}
      </span>
    </div>
  )
}
