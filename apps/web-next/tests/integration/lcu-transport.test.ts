/// <reference types="bun" />

import { afterEach, describe, expect, it } from 'bun:test'

import { LcuPaths, MobileOpcode } from '@mimic/protocol-contract'

import {
  createLCUClient,
  LcuTransportDisconnectedError,
  LcuTransportTimeoutError,
} from '../../src/core/rift/lcu-transport'

type Deferred<T> = {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (error: Error) => void
}

type MockServer = {
  url: string
  server: Bun.Server<undefined>
  sockets: Set<Bun.ServerWebSocket<undefined>>
  nextSocket: () => Promise<Bun.ServerWebSocket<undefined>>
  nextFrame: () => Promise<unknown[]>
}

const servers: Bun.Server<undefined>[] = []

function createDeferred<T>(): Deferred<T> {
  let resolveValue: ((value: T) => void) | null = null
  let rejectValue: ((error: Error) => void) | null = null

  const promise = new Promise<T>((resolve, reject) => {
    resolveValue = resolve
    rejectValue = reject
  })

  if (!resolveValue || !rejectValue) {
    throw new Error('Failed to create deferred promise.')
  }

  return {
    promise,
    resolve: resolveValue,
    reject: rejectValue,
  }
}

function parseFrame(message: string | Buffer): unknown[] {
  const parsed: unknown = JSON.parse(String(message))
  if (!Array.isArray(parsed)) {
    throw new Error('Expected websocket frame array.')
  }

  return parsed
}

function createMockServer(): MockServer {
  const sockets = new Set<Bun.ServerWebSocket<undefined>>()
  const socketWaiters: Deferred<Bun.ServerWebSocket<undefined>>[] = []
  const frameWaiters: Deferred<unknown[]>[] = []
  const frames: unknown[][] = []

  function resolveSocket(socket: Bun.ServerWebSocket<undefined>): void {
    const waiter = socketWaiters.shift()
    if (waiter) {
      waiter.resolve(socket)
    }
  }

  function resolveFrame(frame: unknown[]): void {
    const waiter = frameWaiters.shift()
    if (waiter) {
      waiter.resolve(frame)
      return
    }

    frames.push(frame)
  }

  const server = Bun.serve<undefined>({
    port: 0,
    fetch(request, bunServer) {
      if (bunServer.upgrade(request)) {
        return undefined
      }

      return new Response('Expected websocket upgrade.', { status: 426 })
    },
    websocket: {
      open(socket) {
        sockets.add(socket)
        resolveSocket(socket)
      },
      message(_socket, message) {
        resolveFrame(parseFrame(message))
      },
      close(socket) {
        sockets.delete(socket)
      },
    },
  })

  servers.push(server)

  return {
    url: `ws://127.0.0.1:${server.port}`,
    server,
    sockets,
    nextSocket() {
      const [socket] = sockets
      if (socket) {
        return Promise.resolve(socket)
      }

      const waiter = createDeferred<Bun.ServerWebSocket<undefined>>()
      socketWaiters.push(waiter)
      return waiter.promise
    },
    nextFrame() {
      const frame = frames.shift()
      if (frame) {
        return Promise.resolve(frame)
      }

      const waiter = createDeferred<unknown[]>()
      frameWaiters.push(waiter)
      return waiter.promise
    },
  }
}

async function waitForClientOpen(): Promise<void> {
  await Bun.sleep(10)
}

async function waitForCondition(predicate: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (predicate()) {
      return
    }

    await Bun.sleep(5)
  }

  throw new Error('Timed out waiting for condition.')
}

async function expectRejectsInstance(promise: Promise<unknown>, errorConstructor: new (...args: never[]) => Error): Promise<void> {
  try {
    await promise
  } catch (error) {
    expect(error).toBeInstanceOf(errorConstructor)
    return
  }

  throw new Error(`Expected promise to reject with ${errorConstructor.name}.`)
}

afterEach(() => {
  while (servers.length > 0) {
    const server = servers.pop()
    if (server) {
      void server.stop(true)
    }
  }
})

describe('createLCUClient', () => {
  it('sends request frames and resolves matching responses', async () => {
    const mock = createMockServer()
    const client = createLCUClient({ url: mock.url })
    const socket = await mock.nextSocket()
    await waitForClientOpen()

    const pending = client.request<{ displayName: string }>(LcuPaths.summoner.summoner(1), 'GET')
    const requestFrame = await mock.nextFrame()

    expect(requestFrame).toEqual([MobileOpcode.REQUEST, 0, '/lol-summoner/v1/summoners/1', 'GET', null])

    socket.send(JSON.stringify([MobileOpcode.RESPONSE, requestFrame[1], 200, { displayName: 'Mimic' }]))

    expect(await pending).toEqual({ status: 200, content: { displayName: 'Mimic' } })
    client.close()
  })

  it('rejects disconnected requests and reconnects after socket close', async () => {
    const mock = createMockServer()
    const client = createLCUClient({
      url: mock.url,
      reconnectBaseDelayMs: 5,
      maxReconnectAttempts: 2,
    })

    const firstSocket = await mock.nextSocket()
    const disconnected = createDeferred<void>()
    const reconnected = createDeferred<void>()

    client.onDisconnect(() => disconnected.resolve())
    client.onReconnect(() => reconnected.resolve())

    firstSocket.close()
    await disconnected.promise

    await expectRejectsInstance(client.request(LcuPaths.gameflow.session), LcuTransportDisconnectedError)

    const secondSocket = await mock.nextSocket()
    await reconnected.promise

    const pending = client.request(LcuPaths.gameflow.session)
    const requestFrame = await mock.nextFrame()
    secondSocket.send(JSON.stringify([MobileOpcode.RESPONSE, requestFrame[1], 200, { phase: 'Lobby' }]))

    expect(await pending).toEqual({ status: 200, content: { phase: 'Lobby' } })
    client.close()
  })

  it('rejects requests that do not receive a response before timeout', async () => {
    const mock = createMockServer()
    const client = createLCUClient({ url: mock.url, requestTimeoutMs: 10 })
    await mock.nextSocket()
    await waitForClientOpen()

    const pending = client.request(LcuPaths.gameflow.session)
    await mock.nextFrame()

    await expectRejectsInstance(pending, LcuTransportTimeoutError)
    client.close()
  })

  it('subscribes observers, dispatches updates, and unsubscribes cleanly', async () => {
    const mock = createMockServer()
    const client = createLCUClient({ url: mock.url })
    const socket = await mock.nextSocket()
    const updates: unknown[] = []
    await waitForClientOpen()

    const unsubscribe = client.observe(LcuPaths.lobby.lobby, (data) => {
      updates.push(data)
    })

    expect(await mock.nextFrame()).toEqual([MobileOpcode.SUBSCRIBE, '^/lol-lobby/v2/lobby$'])

    socket.send(JSON.stringify([MobileOpcode.UPDATE, LcuPaths.lobby.lobby, 200, { canStartActivity: true }]))
    await waitForCondition(() => updates.length === 1)

    expect(updates).toEqual([{ canStartActivity: true }])

    unsubscribe()
    expect(await mock.nextFrame()).toEqual([MobileOpcode.UNSUBSCRIBE, '^/lol-lobby/v2/lobby$'])

    socket.send(JSON.stringify([MobileOpcode.UPDATE, LcuPaths.lobby.lobby, 200, { canStartActivity: false }]))
    await Bun.sleep(0)

    expect(updates).toEqual([{ canStartActivity: true }])
    client.close()
  })
})
