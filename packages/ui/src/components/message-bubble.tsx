import type { ReactNode } from 'react'

import { create, props } from '@stylexjs/stylex'

import { color } from '../tokens/color.stylex'
import { font } from '../tokens/font.stylex'

import type { StyleXStyles } from '@stylexjs/stylex'

export interface MessageBubbleProps {
  children: ReactNode
  style?: StyleXStyles
  // Figma Type=Sender is the friend's message (left, shimmer), Type=Send is yours (right, navy)
  variant: 'received' | 'sent'
}

// Figma "Bubble Message": a chat message, squared at the bottom corner on its own side
export function MessageBubble({ children, style, variant }: MessageBubbleProps) {
  return <div {...props(styles.bubble, variants[variant], style)}>{children}</div>
}

const styles = create({
  bubble: {
    borderRadius: 8,
    boxSizing: 'border-box',
    color: color.text,
    fontFamily: font.display,
    fontSize: '0.75rem',
    letterSpacing: '0.05em',
    lineHeight: 1.5,
    maxWidth: '75%',
    overflowWrap: 'anywhere',
    padding: 8,
    whiteSpace: 'pre-wrap',
    width: 'fit-content',
  },
})

const variants = create({
  received: {
    backgroundColor: color.bubbleReceived,
    borderBottomLeftRadius: 0,
  },
  sent: {
    backgroundColor: color.bubbleSent,
    borderBottomRightRadius: 0,
    // To the right in a block or a column flex container alike
    marginInlineStart: 'auto',
  },
})
