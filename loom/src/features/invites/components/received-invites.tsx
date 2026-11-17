import { useEffect, useLayoutEffect, useRef } from 'react'

import { Icon } from '@shoma/ui/icon'
import { IconButton } from '@shoma/ui/icon-button'
import { useToast } from '@shoma/ui/use-toast'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { communityDragonGameDataUrl } from '@/core/http/ddragon'
import { createLcuQueryOptions, gameMapsDescriptor, gameQueuesDescriptor } from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'
import { findQueueMap } from '@/features/lobby/create-lobby-utils'

import { useInvites } from '../use-invites'

import type { InvitationId } from '@/core/types/branded'

// Figma "Invitation received" (440:28790): each pending invite as the snackbar, with the mode's icon and ✓ / ✕, over
// Any connected screen. They're the layout's toasts that only go once answered, so one shows at a time and a passing
// Toast covers one until it's gone. Draws nothing of its own
export function ReceivedInvites() {
  const { t } = useTranslation()
  const toast = useToast()
  const transport = useSharedLCUTransport()
  const { acceptInvite, declineInvite, invites } = useInvites()
  const queuesQuery = useQuery(createLcuQueryOptions(gameQueuesDescriptor, transport))
  const mapsQuery = useQuery(createLcuQueryOptions(gameMapsDescriptor, transport))
  // What each shown invite's snackbar says, to add it again only when that changes (the queues load late)
  const shownRef = useRef(new Map<InvitationId, string>())
  // The latest callbacks, so the effect only runs when the invites or their names change
  const latestRef = useRef({ acceptInvite, declineInvite, toast })

  useLayoutEffect(() => {
    latestRef.current = { acceptInvite, declineInvite, toast }
  })

  useEffect(() => {
    const shown = shownRef.current
    const answer = async (id: InvitationId, call: 'accept' | 'decline') => {
      const { acceptInvite: accept, declineInvite: decline, toast: toasts } = latestRef.current
      const ok = await (call === 'accept' ? accept(id) : decline(id))

      if (!ok) {
        toasts.add({ title: t('errors.generic'), type: 'error' })
      }
    }

    for (const invite of invites) {
      const queue = queuesQuery.data?.find(({ id }) => {
        return id === invite.queueId
      })
      const icon = queue ? findQueueMap(queue, mapsQuery.data ?? [])?.assets['game-select-icon-active'] : undefined
      const image = icon ? communityDragonGameDataUrl(icon) : undefined
      const title = t('invites.received', { inviterName: invite.inviterName, match: queue?.description ?? invite.gameMode })
      const key = `${title}${image}`

      if (shown.get(invite.id) !== key) {
        shown.set(invite.id, key)

        latestRef.current.toast.add({
          buttons: (
            <>
              <IconButton
                aria-label={t('invites.accept')}
                size="small"
                onClick={() => {
                  void answer(invite.id, 'accept')
                }}
              >
                <Icon name="checkmark" />
              </IconButton>

              <IconButton
                aria-label={t('invites.decline')}
                size="small"
                onClick={() => {
                  void answer(invite.id, 'decline')
                }}
              >
                <Icon name="close" />
              </IconButton>
            </>
          ),
          id: invite.id,
          image,
          title,
          type: 'info',
        })
      }
    }

    // Answered here or on the desktop client, or expired
    for (const id of shown.keys()) {
      if (
        !invites.some((invite) => {
          return invite.id === id
        })
      ) {
        latestRef.current.toast.close(id)
        shown.delete(id)
      }
    }
  }, [invites, mapsQuery.data, queuesQuery.data, t])

  return null
}
