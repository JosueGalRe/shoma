import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, keyframes, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import type { UnreadBadgeProps } from '../social-types'

// The client's count badge on a friend or a folded group with unread messages, in the Figma's unread magenta
// (the chat button's Filled state)
export function UnreadBadge({ count }: UnreadBadgeProps) {
  const { t } = useTranslation()

  return (
    <span aria-label={t('social.unread', { count })} role="img" {...props(text.body4Medium, styles.badge)}>
      {count}
    </span>
  )
}

const appear = keyframes({
  from: { opacity: 0, transform: 'scale(0.6)' },
})

const styles = create({
  badge: {
    alignItems: 'center',
    animationDuration: { '@media (prefers-reduced-motion: reduce)': '0s', default: '150ms' },
    animationName: appear,
    animationTimingFunction: 'ease-out',
    backgroundColor: color.accent,
    borderRadius: 4,
    boxSizing: 'border-box',
    color: color.text,
    display: 'inline-flex',
    flexShrink: 0,
    height: 20,
    justifyContent: 'center',
    marginInlineStart: 'auto',
    minWidth: 20,
    paddingInline: 6,
  },
})
