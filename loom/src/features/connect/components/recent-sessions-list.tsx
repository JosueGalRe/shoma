import { Icon } from '@shoma/ui/icon'
import { IconButton } from '@shoma/ui/icon-button'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import type { RecentSessionsListProps } from './recent-sessions-list-types'

// Not in the Figma yet: the Conduits paired before, to reconnect without typing the code
export function RecentSessionsList({ onReconnect, onRemove, sessions }: RecentSessionsListProps) {
  const { t } = useTranslation()

  if (sessions.length === 0) {
    return null
  }

  return (
    <section aria-labelledby="recent-sessions" {...props(styles.root)}>
      <h2 id="recent-sessions" {...props(text.marcellus13, styles.heading)}>
        {t('connection.recentSessions')}
      </h2>

      <ul {...props(styles.list)}>
        {sessions.map((session) => {
          return (
            <li key={session.code} {...props(styles.item)}>
              <button
                type="button"
                onClick={() => {
                  onReconnect(session.code)
                }}
                {...props(styles.reconnect)}
              >
                <span {...props(text.body2)}>{session.deviceName ?? session.code}</span>

                {session.deviceName ? <span {...props(text.body4, styles.code)}>{session.code}</span> : null}
              </button>

              <IconButton
                aria-label={t('connection.removeRecentSession')}
                size="small"
                onClick={() => {
                  onRemove(session.code)
                }}
              >
                <Icon name="close" />
              </IconButton>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

const styles = create({
  code: {
    color: color.textSecondary,
  },
  heading: {
    color: color.textLabel,
    margin: 0,
    textTransform: 'uppercase',
  },
  item: {
    alignItems: 'center',
    backgroundColor: color.fieldBackground,
    borderColor: color.border,
    borderStyle: 'solid',
    borderWidth: 1,
    display: 'flex',
    gap: 8,
    paddingInlineEnd: 8,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  reconnect: {
    WebkitTapHighlightColor: 'transparent',
    alignItems: 'flex-start',
    backgroundColor: { ':active': color.pressed, default: 'transparent' },
    borderWidth: 0,
    color: color.text,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    gap: 2,
    justifyContent: 'center',
    margin: 0,
    minHeight: 48,
    outlineColor: color.focusRing,
    outlineOffset: -2,
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: 2,
    paddingBlock: 8,
    paddingInline: 16,
    textAlign: 'start',
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    maxWidth: 328,
    width: '100%',
  },
})
