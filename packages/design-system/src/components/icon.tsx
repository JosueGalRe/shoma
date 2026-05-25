import type { ComponentProps, ElementType } from 'react'

import { Check, Copy, Download, Hash, Minus, QrCode, Settings, X } from 'lucide-react'

import type { SemanticTokenName } from '../tokens'

const iconMap = {
  check: Check,
  copy: Copy,
  download: Download,
  hash: Hash,
  minus: Minus,
  'qr-code': QrCode,
  settings: Settings,
  x: X,
} as const

type IconName = keyof typeof iconMap

const iconSizeMap = {
  lg: 24,
  md: 20,
  sm: 16,
} as const

export type IconSize = keyof typeof iconSizeMap | number

export interface IconProps extends Omit<ComponentProps<ElementType>, 'name' | 'size' | 'color'> {
  name: IconName
  size?: IconSize
  tone?: SemanticTokenName
}

export function Icon({ name, size = 'md', tone = 'text', className, ...props }: IconProps) {
  const resolvedSize = typeof size === 'number' ? size : iconSizeMap[size]
  const Component = iconMap[name]

  return (
    <Component
      {...props}
      className={['shrink-0', className].filter(Boolean).join(' ')}
      color={`var(--shoma-${tone})`}
      size={resolvedSize}
    />
  )
}
