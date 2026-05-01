import { describe, expect, it } from 'bun:test'

import { createLcuClient } from '../../src/core/rift/lcu-client'

describe('createLcuClient', () => {
  it('serializes explicit received invitation actions', async () => {
    const requests: [string, string | undefined, string | undefined][] = []
    const client = createLcuClient({
      request(path, method, body) {
        requests.push([path, method, body])
        return Promise.resolve({ status: 200, content: null })
      },
      observe() {
        return Promise.resolve()
      },
      unobserve() {
        return Promise.resolve()
      },
    })

    await client.lobby.acceptReceivedInvitation('invite-1')
    await client.lobby.declineReceivedInvitation('invite-2')

    expect(requests).toEqual([
      ['/lol-lobby/v2/received-invitations/invite-1/accept', 'POST', undefined],
      ['/lol-lobby/v2/received-invitations/invite-2/decline', 'POST', undefined],
    ])
  })

  it('serializes request bodies consistently', async () => {
    const requests: [string, string | undefined, string | undefined][] = []
    const client = createLcuClient({
      request(path, method, body) {
        requests.push([path, method, body])
        return Promise.resolve({ status: 200, content: null })
      },
      observe() {
        return Promise.resolve()
      },
      unobserve() {
        return Promise.resolve()
      },
    })

    await client.lobby.createLobby({ queueId: 430 })
    await client.perks.selectCurrentPage(123)

    expect(requests).toEqual([
      ['/lol-lobby/v2/lobby', 'POST', '{"queueId":430}'],
      ['/lol-perks/v1/currentpage', 'PUT', '123'],
    ])
  })
})
