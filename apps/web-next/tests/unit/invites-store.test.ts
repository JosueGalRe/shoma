/// <reference types="bun" />

import { beforeEach, describe, expect, it } from 'bun:test'

import { useGameflowStore } from '../../src/core/state/gameflow-store'
import { createInvitesStore, type LobbyInvite } from '../../src/features/invites/invites-store'

function createInvite(overrides: Partial<LobbyInvite> = {}): LobbyInvite {
  return {
    canAcceptInvitation: true,
    fromSummonerId: 12345,
    gameConfig: { mapId: 11, queueId: 420 },
    invitationId: 'invite-1',
    state: 'Pending',
    ...overrides,
  }
}

describe('invites store', () => {
  beforeEach(() => {
    useGameflowStore.getState().reset()
  })

  it('adds a received pending invite to the lists', () => {
    const store = createInvitesStore()

    store.getState().addInvite(createInvite())

    expect(store.getState().receivedInvites).toHaveLength(1)
    expect(store.getState().pendingInvites).toHaveLength(1)
    expect(store.getState().pendingInvites[0]?.invitationId).toBe('invite-1')
    expect(store.getState().isLoading).toBe(false)
  })

  it('accepts an invite and removes it from the lists', async () => {
    const store = createInvitesStore()
    store.getState().addInvite(createInvite())

    const accepted = await store.getState().acceptInvite('invite-1', async () => Promise.resolve())

    expect(accepted).toBe(true)
    expect(store.getState().receivedInvites).toHaveLength(0)
    expect(store.getState().pendingInvites).toHaveLength(0)
    expect(store.getState().error).toBeNull()
    expect(useGameflowStore.getState().phase).toBe('lobby')
  })

  it('declines an invite and removes it from the lists', async () => {
    const store = createInvitesStore()
    store.getState().addInvite(createInvite())

    const declined = await store.getState().declineInvite('invite-1', async () => Promise.resolve())

    expect(declined).toBe(true)
    expect(store.getState().receivedInvites).toHaveLength(0)
    expect(store.getState().pendingInvites).toHaveLength(0)
    expect(store.getState().error).toBeNull()
  })

  it('removes an expired invite and reports an accept error', async () => {
    const store = createInvitesStore()
    store.getState().addInvite(createInvite({ expirationTimestamp: Date.now() - 1000 }))

    const accepted = await store.getState().acceptInvite('invite-1', async () => Promise.resolve())

    expect(accepted).toBe(false)
    expect(store.getState().receivedInvites).toHaveLength(0)
    expect(store.getState().pendingInvites).toHaveLength(0)
    expect(store.getState().error?.message).toBe('Invite has expired.')
  })
})
