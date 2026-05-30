import { beforeEach, describe, expect, test } from 'vitest'

import { InvitationId } from '../../src/core/types/branded'
import {
  selectHasInvites,
  selectInviteById,
  selectInviteCount,
  selectInvites,
  useInvitesStore,
} from '../../src/features/invites/invites-store'

beforeEach(() => {
  useInvitesStore.setState({ invites: [] })
})

describe('invites store', () => {
  test('does not use persist middleware', () => {
    const useInvitesStoreWithPersist: typeof useInvitesStore & { persist?: unknown } = useInvitesStore

    expect(useInvitesStoreWithPersist.persist).toBeUndefined()
  })

  test('exposes memoized invite selectors', () => {
    const inviteId: InvitationId = InvitationId('invite-1')
    const selector = selectInviteById(inviteId)

    expect(selector).toBe(selectInviteById(inviteId))
    expect(selectHasInvites(useInvitesStore.getState())).toBe(false)
    expect(selectInviteCount(useInvitesStore.getState())).toBe(0)
  })

  test('adds and removes invites', () => {
    const invite: { gameMode: string; id: InvitationId; inviterName: string } = { gameMode: 'ranked', id: InvitationId('invite-1'), inviterName: 'Summoner' }

    useInvitesStore.getState().addInvite(invite)
    expect(selectInvites(useInvitesStore.getState())).toEqual([invite])

    expect(selectInviteById(invite.id)(useInvitesStore.getState())).toEqual(invite)

    useInvitesStore.getState().acceptInvite(invite.id)
    expect(useInvitesStore.getState().invites).toEqual([])
  })
})
