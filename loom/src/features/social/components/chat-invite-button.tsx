import { Icon } from '@shoma/ui/icon'
import { IconButton } from '@shoma/ui/icon-button'
import { useToast } from '@shoma/ui/use-toast'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { useInvitePlayer } from '@/core/lcu/lcu-mutations'
import { useLcuObserverSync } from '@/core/lcu/lcu-observer-sync'
import { createLcuQueryOptions, lobbySessionDescriptor, sentInvitesDescriptor } from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'

import { readGameName, readLobbyInvite } from '../lib/friend-utils'

import type { ChatInviteButtonProps } from '../social-types'

// The client's "Invite to game" for the friend in the chat, while the local player's lobby has room for them; a check
// Once the invitation is out
export function ChatInviteButton({ friend }: ChatInviteButtonProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const transport = useSharedLCUTransport()
  const lobby = useQuery(createLcuQueryOptions(lobbySessionDescriptor, transport)).data
  const sentInvites = useQuery(createLcuQueryOptions(sentInvitesDescriptor, transport)).data
  const invite = useInvitePlayer()
  const state = readLobbyInvite(friend, lobby?.members ?? [], sentInvites ?? [])

  useLcuObserverSync(lobbySessionDescriptor, transport)
  useLcuObserverSync(sentInvitesDescriptor, transport)

  if (state === null) {
    return null
  }

  return (
    <IconButton
      aria-label={state === 'invited' ? t('social.chat.invited') : t('social.chat.invite')}
      disabled={state === 'invited' || invite.isPending}
      onClick={() => {
        invite.mutate(friend.summonerId, {
          onError: () => {
            toast.add({ title: t('lobby.errors.invitePlayerFailed'), type: 'error' })
          },
          onSuccess: () => {
            toast.add({ title: t('social.chat.inviteSent', { name: readGameName(friend.name) }), type: 'success' })
          },
        })
      }}
    >
      <Icon name={state === 'invited' ? 'checkmark' : 'add'} />
    </IconButton>
  )
}
