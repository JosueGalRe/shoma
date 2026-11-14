import { useState } from 'react'

import { BottomSheet } from '@shoma/ui/bottom-sheet'
import { Button } from '@shoma/ui/button'
import { text } from '@shoma/ui/text'
import { TextField } from '@shoma/ui/text-field'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import { useLatestDdragonVersion } from '@/core/http/ddragon'
import { useTranslatedActivityLabels, useTranslatedStatusLabels } from '@/features/social/hooks/use-social-labels'
import { useSocialLCU } from '@/features/social/hooks/use-social-lcu'
import {
  isFriendInvitable,
  profileIconUrl,
  readFriendStatusDetail,
  translateGroupName,
} from '@/features/social/lib/friend-utils'
import { groupFriends } from '@/features/social/lib/group-friends'

import { LobbyInviteGroup } from './lobby-invite-group'
import { getRiotId } from './lobby-invite-sheet-utils'

import type { LobbyInviteSheetProps } from './lobby-screen-types'
import type { SummonerId } from '@/core/types/branded'

interface InviteDraft {
  gameName: string
  selectedIds: ReadonlySet<SummonerId>
  tagLine: string
}

const EMPTY_DRAFT: InviteDraft = { gameName: '', selectedIds: new Set(), tagLine: '' }

// Figma "Invite" (159:21004): a Riot ID to invite by name, and the friends who can join, by group
export function LobbyInviteSheet({ memberIds, onInviteFriends, onInviteRiotId, onOpenChange, open }: LobbyInviteSheetProps) {
  const { t } = useTranslation()
  const { friends, groups } = useSocialLCU()
  const ddragonVersion = useLatestDdragonVersion().data
  const statusLabels = useTranslatedStatusLabels()
  const activityLabels = useTranslatedActivityLabels()
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [wasOpen, setWasOpen] = useState(open)

  // Each opening starts empty; clearing on close would empty the form while it slides away
  if (open !== wasOpen) {
    setWasOpen(open)

    if (open) {
      setDraft(EMPTY_DRAFT)
    }
  }

  const riotId = getRiotId(draft.gameName, draft.tagLine)
  const invitableFriends = friends.filter((friend) => {
    return isFriendInvitable(friend) && !memberIds.has(friend.summonerId)
  })
  const friendGroups = groupFriends(invitableFriends, groups, false).filter(([, members]) => {
    return members.length > 0
  })

  function toggleFriend(summonerId: SummonerId) {
    const selectedIds = new Set(draft.selectedIds)

    if (!selectedIds.delete(summonerId)) {
      selectedIds.add(summonerId)
    }

    setDraft({ ...draft, selectedIds })
  }

  async function handleSend() {
    onOpenChange(false)

    if (draft.selectedIds.size > 0) {
      await onInviteFriends([...draft.selectedIds])
    }

    if (riotId) {
      await onInviteRiotId(riotId)
    }
  }

  return (
    <BottomSheet
      fullHeight
      closeIcon="close"
      closeLabel={t('common.close')}
      footer={
        <Button
          disabled={draft.selectedIds.size === 0 && riotId === null}
          style={styles.send}
          onClick={() => {
            void handleSend()
          }}
        >
          {t('lobby.inviteSheet.send')}
        </Button>
      }
      open={open}
      title={t('lobby.inviteSheet.title')}
      onOpenChange={onOpenChange}
    >
      <div {...props(styles.content)}>
        <TextField
          autoComplete="off"
          label={t('lobby.inviteSheet.gameName')}
          placeholder={t('lobby.inviteSheet.gameNamePlaceholder')}
          value={draft.gameName}
          onValueChange={(gameName) => {
            setDraft({ ...draft, gameName })
          }}
        />

        <TextField
          autoComplete="off"
          label={t('lobby.inviteSheet.tagLine')}
          placeholder="#"
          value={draft.tagLine}
          onValueChange={(tagLine) => {
            setDraft({ ...draft, tagLine })
          }}
        />

        <hr {...props(styles.divider)} />

        {friendGroups.length === 0 ? <p {...props(text.body2, styles.empty)}>{t('lobby.noAvailablePlayers')}</p> : null}

        {friendGroups.map(([group, members]) => {
          return (
            <LobbyInviteGroup
              key={group}
              friends={members.map((friend) => {
                return {
                  iconUrl: profileIconUrl(ddragonVersion, friend.iconId),
                  name: friend.name,
                  // Without the game mode: the friend list only has its raw name ("CLASSIC")
                  status: readFriendStatusDetail(friend.isOnMobile ? { isOnMobile: true } : { product: friend.product }, {
                    activityLabel: friend.activity ? activityLabels[friend.activity] : undefined,
                    riotMobileLabel: t('social.status.riotMobile'),
                    statusLabel: statusLabels[friend.status],
                  }),
                  summonerId: friend.summonerId,
                }
              })}
              name={translateGroupName(group, t)}
              selectedIds={draft.selectedIds}
              onToggle={toggleFriend}
            />
          )
        })}
      </div>
    </BottomSheet>
  )
}

const styles = create({
  // Figma: 16 between the fields, the line and each group
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  divider: {
    borderStyle: 'none',
    borderTopColor: color.text,
    borderTopStyle: 'solid',
    borderTopWidth: 1,
    margin: 0,
  },
  empty: {
    color: color.textLabel,
    margin: 0,
  },
  send: {
    width: '100%',
  },
})
