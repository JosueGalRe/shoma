import { statusColor, statusTextKey, type TranslationKey } from '../app-utils'

import { pillStatusStyles } from './pill-status-styles'

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

  const { base, dot, label: labelClass, value } = pillStatusStyles()

  return (
    <div
      className={base()}
      style={{
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
        borderColor: `color-mix(in srgb, ${color} 25%, transparent)`,
      }}
    >
      <div className={dot()} style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }} />

      <span className={labelClass()}>{label}</span>

      <span className={value()} style={{ color }}>
        {t(statusTextKey(status))}
      </span>
    </div>
  )
}
