import { Button } from '@shoma/ui/button'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import { useInvites } from '../use-invites'

// Not designed yet (Adriana's "invite received" frames): a card per pending invite over the current screen
export function ReceivedInvites() {
  const { t } = useTranslation()
  const { acceptInvite, declineInvite, invites } = useInvites()

  if (invites.length === 0) {
    return null
  }

  return (
    <ul aria-label={t('invites.title')} {...props(styles.stack)}>
      {invites.map((invite) => {
        return (
          <li key={invite.id} {...props(styles.card)}>
            <p {...props(text.body2, styles.message)}>
              {t('notifications.inviteReceived.body', { inviterName: invite.inviterName })}
            </p>

            <p {...props(text.body4, styles.mode)}>{invite.gameMode}</p>

            <div {...props(styles.actions)}>
              <Button
                style={styles.action}
                variant="secondary"
                onClick={() => {
                  void declineInvite(invite.id)
                }}
              >
                {t('invites.decline')}
              </Button>

              <Button
                style={styles.action}
                onClick={() => {
                  void acceptInvite(invite.id)
                }}
              >
                {t('invites.accept')}
              </Button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

const styles = create({
  action: {
    flexGrow: 1,
  },
  actions: {
    display: 'flex',
    gap: 8,
  },
  card: {
    backgroundColor: color.menu,
    borderColor: color.border,
    borderStyle: 'solid',
    borderWidth: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: 16,
  },
  message: {
    color: color.text,
    margin: 0,
  },
  mode: {
    color: color.textSecondary,
    margin: 0,
  },
  stack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    insetInline: 16,
    listStyle: 'none',
    margin: 0,
    padding: 0,
    position: 'absolute',
    top: 72,
    zIndex: 40,
  },
})
