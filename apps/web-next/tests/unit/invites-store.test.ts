import { beforeEach, describe, expect, test } from 'bun:test'

import type { InvitationId } from '../../src/core/types/branded'

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
    expect((useInvitesStore as typeof useInvitesStore & { persist?: unknown }).persist).toBeUndefined()
  })

  test('exposes memoized invite selectors', () => {
    const selector = selectInviteById('invite-1' as InvitationId)
    expect(selector).toBe(selectInviteById('invite-1' as InvitationId))
    expect(selectHasInvites(useInvitesStore.getState())).toBe(false)
    expect(selectInviteCount(useInvitesStore.getState())).toBe(0)
  })

  test('adds and removes invites', () => {
    const invite = { gameMode: 'ranked', id: 'invite-1' as InvitationId, inviterName: 'Summoner' }

    useInvitesStore.getState().addInvite(invite)
    expect(selectInvites(useInvitesStore.getState())).toEqual([invite])

    expect(selectInviteById('invite-1' as InvitationId)(useInvitesStore.getState())).toEqual(invite)

    useInvitesStore.getState().acceptInvite('invite-1' as InvitationId)
    expect(useInvitesStore.getState().invites).toEqual([])
  })
})
