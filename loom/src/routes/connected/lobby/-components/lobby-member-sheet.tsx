import { BottomSheet } from '@shoma/ui/bottom-sheet'
import { Button } from '@shoma/ui/button'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import type { LobbyMemberSheetProps } from './lobby-screen-types'

// The client's context menu on a party member (rcp-fe-lol-parties), for the owner: promote, kick (which asks first)
// And invite privileges. The Figma draws none, so it's a sheet of the kit's buttons
export function LobbyMemberSheet({
  member,
  onKick,
  onOpenChange,
  onPromote,
  onSetInvitePrivilege,
  open,
}: LobbyMemberSheetProps) {
  const { t } = useTranslation()
  const canInvite = member?.allowedInviteOthers ?? false

  return (
    <BottomSheet closeLabel={t('common.back')} open={open} title={member?.displayName ?? ''} onOpenChange={onOpenChange}>
      <div {...props(styles.actions)}>
        <Button style={styles.fullWidth} variant="secondary" onClick={onPromote}>
          {t('lobby.memberMenu.promote')}
        </Button>

        <Button style={styles.fullWidth} variant="secondary" onClick={onKick}>
          {t('lobby.memberMenu.kickFromParty')}
        </Button>

        <Button
          style={styles.fullWidth}
          variant="secondary"
          onClick={() => {
            onSetInvitePrivilege(!canInvite)
          }}
        >
          {t(canInvite ? 'lobby.memberMenu.revokeInvites' : 'lobby.memberMenu.grantInvites')}
        </Button>
      </div>
    </BottomSheet>
  )
}

const styles = create({
  // Figma: 10 between a sheet's rows
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  fullWidth: {
    width: '100%',
  },
})
