import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createLCUTransport } from '@/core/relay/lcu-transport'
import { RelayClient, RelayClientState } from '@/core/relay/relay-client'

import { installSimRelay, SIM_INVALID_CODE, SimRelay } from './sim-relay'
import { SimWorld } from './sim-world'

const RealWebSocket = globalThis.WebSocket

let relay: SimRelay
let client: RelayClient | null = null

function createClient(code: string): RelayClient {
  client = new RelayClient({ code, reconnectBaseDelayMs: 10, reconnectMaxDelayMs: 20, wsBaseUrl: 'ws://sim' })

  return client
}

function waitForState(relayClient: RelayClient, state: RelayClientState): Promise<void> {
  return new Promise((resolve) => {
    if (relayClient.state === state) {
      resolve()

      return
    }

    const unsubscribe = relayClient.onStateChange((next) => {
      if (next === state) {
        unsubscribe()
        resolve()
      }
    })
  })
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

beforeEach(() => {
  relay = new SimRelay(new SimWorld({ captures: {} }))
  relay.latencyMs = 0
  installSimRelay(relay)
})

afterEach(() => {
  client?.close()
  client = null
  globalThis.WebSocket = RealWebSocket
})

describe('relay client against the simulated relay', () => {
  it('keeps a dropped session trying until Conduit is back, after its notice that the client closed', async () => {
    const relayClient = createClient('123456')
    const transport = createLCUTransport(relayClient)
    const clientClosed = new Promise<void>((resolve) => {
      transport.onClientClosed(resolve)
    })

    relayClient.connect()
    await waitForState(relayClient, RelayClientState.CONNECTED)

    relay.dropConduit(true)
    await clientClosed
    // The retries find no desktop until it's back
    await waitForState(relayClient, RelayClientState.FAILED_RELAY_UNREACHABLE)

    relay.restoreConduit()
    await waitForState(relayClient, RelayClientState.CONNECTED)

    transport.close()
  })

  it("doesn't retry a code that never connected", async () => {
    const relayClient = createClient(SIM_INVALID_CODE)

    relayClient.connect()
    await waitForState(relayClient, RelayClientState.FAILED_INVALID_CODE)
    await wait(60)

    expect(relayClient.state).toBe(RelayClientState.DISCONNECTED)
    expect(relay.sockets.size).toBe(0)
  })

  it('stops retrying once closed', async () => {
    const relayClient = createClient('123456')

    relayClient.connect()
    await waitForState(relayClient, RelayClientState.CONNECTED)

    relay.dropConduit(false)
    await waitForState(relayClient, RelayClientState.DISCONNECTED)
    relayClient.close()
    await wait(60)

    expect(relayClient.state).toBe(RelayClientState.DISCONNECTED)
    expect(relay.sockets.size).toBe(0)
  })
})
