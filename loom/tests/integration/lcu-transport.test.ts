import { describe, expect, test } from 'bun:test'

import { LcuHttpMethod, LcuPaths, MobileOpcode } from '@shoma/protocol-contract'

import { LcuTransport, LcuTransportTimeoutError, pathToObservePattern } from '../../src/core/relay/lcu-transport'
import type { RelayClient } from '../../src/core/relay/relay-client'

type Listener = () => void
type DataListener = (payload: string) => void

class MockRelayClient {
  readonly sentPayloads: string[] = []
  readonly #dataListeners = new Set<DataListener>()
  readonly #openListeners = new Set<Listener>()
  readonly #closeListeners = new Set<Listener>()

  connected = true

  get isConnected(): boolean {
    return this.connected
  }

  onData(listener: DataListener): () => void {
    this.#dataListeners.add(listener)
    return () => this.#dataListeners.delete(listener)
  }

  onOpen(listener: Listener): () => void {
    this.#openListeners.add(listener)
    return () => this.#openListeners.delete(listener)
  }

  onClose(listener: Listener): () => void {
    this.#closeListeners.add(listener)
    return () => this.#closeListeners.delete(listener)
  }

  send(payload: string): Promise<void> {
    this.sentPayloads.push(payload)
    return Promise.resolve()
  }

  emitData(frame: unknown[]): void {
    const payload = JSON.stringify(frame)
    this.#dataListeners.forEach((listener) => listener(payload))
  }

  emitOpen(): void {
    this.connected = true
    this.#openListeners.forEach((listener) => listener())
  }

  emitClose(): void {
    this.connected = false
    this.#closeListeners.forEach((listener) => listener())
  }
}

function createTransport(options?: { requestTimeoutMs?: number }): { client: MockRelayClient; transport: LcuTransport } {
  const client = new MockRelayClient()
  return {
    client,
    transport: new LcuTransport(client as unknown as RelayClient, options),
  }
}

function parsePayload(payload: string): unknown[] {
  const parsed: unknown = JSON.parse(payload)
  if (!Array.isArray(parsed)) {
    throw new Error('Expected payload to be a frame array.')
  }

  return parsed
}

async function expectRejectsWith<TError extends Error>(promise: Promise<unknown>, errorConstructor: new (...args: never[]) => TError): Promise<void> {
  try {
    await promise
  } catch (error) {
    expect(error).toBeInstanceOf(errorConstructor)
    return
  }

  throw new Error(`Expected rejection with ${errorConstructor.name}`)
}

async function expectRejectsWithMessage(promise: Promise<unknown>, message: string): Promise<void> {
  try {
    await promise
  } catch (error) {
    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toBe(message)
    return
  }

  throw new Error(`Expected rejection with message: ${message}`)
}

describe('LcuTransport', () => {
  test('sends request frames and resolves matching responses', async () => {
    const { client, transport } = createTransport()

    const pending = transport.request<{ displayName: string }>(LcuPaths.summoner.summoner(1), LcuHttpMethod.GET)
    const requestFrame = parsePayload(client.sentPayloads[0] ?? '')

    expect(requestFrame).toEqual([MobileOpcode.REQUEST, 0, '/lol-summoner/v1/summoners/1', 'GET', null])

    client.emitData([MobileOpcode.RESPONSE, requestFrame[1], 200, { displayName: 'Mimic' }])

    expect(await pending).toEqual({ status: 200, content: { displayName: 'Mimic' } })
    transport.close()
  })

  test('preserves object request bodies in the frame', async () => {
    const { client, transport } = createTransport()

    const pending = transport.request('/lol-lobby/v2/lobby', LcuHttpMethod.POST, { queueId: 430 })
    const requestFrame = parsePayload(client.sentPayloads[0] ?? '')

    expect(requestFrame).toEqual([MobileOpcode.REQUEST, 0, '/lol-lobby/v2/lobby', 'POST', { queueId: 430 }])

    client.emitData([MobileOpcode.RESPONSE, requestFrame[1], 200, null])
    expect(await pending).toEqual({ status: 200, content: null })
    transport.close()
  })

  test('rejects timed out requests', async () => {
    const { client, transport } = createTransport({ requestTimeoutMs: 5 })

    const pending = transport.request(LcuPaths.gameflow.session)
    expect(parsePayload(client.sentPayloads[0] ?? '')[0]).toBe(MobileOpcode.REQUEST)

    await expectRejectsWith(pending, LcuTransportTimeoutError)
    transport.close()
  })

  test('observes snapshots and live updates, then unsubscribes cleanly', async () => {
    const { client, transport } = createTransport()
    const updates: unknown[] = []

    const unsubscribe = await transport.observe('/lol-lobby/v2/lobby', (result) => {
      updates.push(result)
    })

    const subscribeFrame = parsePayload(client.sentPayloads[0] ?? '')
    const snapshotFrame = parsePayload(client.sentPayloads[1] ?? '')
    expect(subscribeFrame).toEqual([MobileOpcode.SUBSCRIBE, '^/lol-lobby/v2/lobby$'])
    expect(snapshotFrame[0]).toBe(MobileOpcode.REQUEST)

    client.emitData([MobileOpcode.RESPONSE, snapshotFrame[1], 200, { canStartActivity: false }])
    await Bun.sleep(0)

    client.emitData([MobileOpcode.UPDATE, '/lol-lobby/v2/lobby', 200, { canStartActivity: true }])
    await Bun.sleep(0)

    expect(updates).toEqual([
      { status: 200, content: { canStartActivity: false } },
      { status: 200, content: { canStartActivity: true } },
    ])

    unsubscribe()
    await Bun.sleep(0)

    expect(parsePayload(client.sentPayloads[2] ?? '')).toEqual([MobileOpcode.UNSUBSCRIBE, '^/lol-lobby/v2/lobby$'])
    transport.close()
  })

  test('rejects pending requests on disconnect and resubscribes on reconnect', async () => {
    const { client, transport } = createTransport()
    const events: string[] = []
    transport.onDisconnect(() => events.push('disconnect'))
    transport.onReconnect(() => events.push('reconnect'))
    await transport.observe('/lol-gameflow/v1/gameflow-phase', () => undefined)
    const pending = transport.request(LcuPaths.gameflow.session)

    client.emitClose()
    await expectRejectsWithMessage(pending, 'Relay client is not connected.')

    client.emitOpen()
    await Bun.sleep(0)

    expect(events).toEqual(['disconnect', 'reconnect'])
    expect(client.sentPayloads.map(parsePayload)).toContainEqual([MobileOpcode.SUBSCRIBE, '^/lol-gameflow/v1/gameflow-phase$'])
    transport.close()
  })
})

describe('pathToObservePattern', () => {
  test('escapes regex characters while preserving path wildcards', () => {
    expect(pathToObservePattern('/lol-champ-select/v1/session/*')).toBe('^/lol-champ-select/v1/session/.*$')
    expect(pathToObservePattern('/a+b/(test)')).toBe('^/a\\+b/\\(test\\)$')
  })
})
