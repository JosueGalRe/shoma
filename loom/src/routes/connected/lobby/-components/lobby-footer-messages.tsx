import { useState } from 'react'

import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'

export interface LobbyFooterMessage {
  id: string
  role?: 'alert' | 'status'
  text: string
}

interface LobbyFooterMessagesProps {
  messages: LobbyFooterMessage[]
}

// The messages above the lobby's main button, opening and closing their space smoothly so the party above doesn't jump.
// While closing, they keep showing what they said
export function LobbyFooterMessages({ messages }: LobbyFooterMessagesProps) {
  const isOpen = messages.length > 0
  const key = messages
    .map(({ id, text: message }) => {
      return `${id}:${message}`
    })
    .join('\n')
  const [shown, setShown] = useState({ key, messages })

  if (isOpen && key !== shown.key) {
    setShown({ key, messages })
  }

  return (
    <div inert={!isOpen} {...props(styles.collapse, isOpen && styles.open)}>
      <div {...props(styles.clip)}>
        <div {...props(styles.messages)}>
          {shown.messages.map(({ id, role, text: message }) => {
            return (
              <p key={id} role={role} {...props(text.body4, styles.message)}>
                {message}
              </p>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const styles = create({
  clip: {
    minHeight: 0,
    overflow: 'hidden',
  },
  collapse: {
    display: 'grid',
    gridTemplateRows: '0fr',
    transitionDuration: { '@media (prefers-reduced-motion: reduce)': '0s', default: '200ms' },
    transitionProperty: 'grid-template-rows',
    transitionTimingFunction: 'ease-out',
  },
  message: {
    color: color.danger,
    margin: 0,
    textAlign: 'center',
  },
  // Their gap to the button lives inside, so it opens and closes with them
  messages: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    paddingBlockEnd: 10,
  },
  open: {
    gridTemplateRows: '1fr',
  },
})
