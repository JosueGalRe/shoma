import type { ReactNode } from 'react'

import { create, props } from '@stylexjs/stylex'

import { color } from '../tokens/color.stylex'
import { font } from '../tokens/font.stylex'

import type { StyleXStyles } from '@stylexjs/stylex'

export interface ChipProps {
  children: ReactNode
  style?: StyleXStyles
}

// Figma "Chips" as the dashboard shows it: a dark green pill with a white dot, the client's "CONNECTED" status
export function Chip({ children, style }: ChipProps) {
  return (
    <span {...props(styles.chip, style)}>
      <span aria-hidden {...props(styles.dot)} />

      {children}
    </span>
  )
}

const styles = create({
  chip: {
    alignItems: 'center',
    backgroundColor: color.chip,
    borderColor: color.text,
    borderRadius: 16,
    borderStyle: 'solid',
    borderWidth: 1,
    boxSizing: 'border-box',
    color: color.chipText,
    display: 'inline-flex',
    fontFamily: font.display,
    fontSize: '0.875rem',
    gap: 4,
    height: 32,
    letterSpacing: '0.08em',
    lineHeight: 1,
    paddingInline: 8,
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  dot: {
    backgroundColor: color.text,
    borderRadius: '50%',
    flexShrink: 0,
    height: 8,
    width: 8,
  },
})
