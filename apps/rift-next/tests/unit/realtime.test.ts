import { describe, expect, it } from 'bun:test'
import { Cause, Effect, Option, TestClock, TestContext } from 'effect'

import { RiftOpcode } from '@mimic/protocol-contract'

import { makeDatabaseService, DatabaseNotInitializedError } from '../../src/core/database/database-service'
import type { LoggerService } from '../../src/core/logger/logger-utils'
import { makeRealtimeService, makeRealtimeStateService } from '../../src/core/realtime/realtime-service'
import { RiftRealtimeManager } from '../../src/core/realtime/realtime'
import type { RealtimeDependencies, RealtimeSocket } from '../../src/core/realtime/realtime-types'
import { app } from '../../src/index'

const silentLogger: LoggerService = {
  info: () => Effect.void,
  warn: () => Effect.void,
  error: () => Effect.void,
  debug: () => Effect.void,
}

class FakeSocket implements RealtimeSocket {
  sent: string[] = []
  closed = false
  pingCount = 0

  send(data: string) {
    this.sent.push(data)
  }

  ping() {
    this.pingCount += 1
  }

  close() {
    this.closed = true
  }
}

type RealtimeDepsOptions = {
  lookupResult?: { code: string; public_key: string } | null
  potentiallyUpdateResult?: boolean
  tokenCode?: string | null
  connectionId?: string
}

function createRealtimeDeps(options: RealtimeDepsOptions = {}): RealtimeDependencies {
  const lookupResult = options.lookupResult ?? null
  const potentiallyUpdateResult = options.potentiallyUpdateResult ?? true
  const tokenCode = options.tokenCode ?? '111111'
  const connectionId = options.connectionId ?? 'peer-1'

  return {
    lookup(code: string) {
      if (!lookupResult) {
        return null
      }

      if (lookupResult.code !== code) {
        return null
      }

      return lookupResult
    },
    potentiallyUpdate(code: string, pubkey: string) {
      if (!potentiallyUpdateResult) {
        return false
      }

      if (!lookupResult) {
        return true
      }

      return lookupResult.code === code && lookupResult.public_key === pubkey
    },
    verifyToken() {
      if (!tokenCode) {
        return null
      }

      return { code: tokenCode }
    },
    createConnectionId() {
      return connectionId
    },
  }
}

describe('RiftRealtimeManager', () => {
  it('rejects conduit open when token/pubkey are missing', () => {
    const manager = new RiftRealtimeManager(
      createRealtimeDeps({
        lookupResult: null,
        potentiallyUpdateResult: false,
        tokenCode: null,
        connectionId: 'id-1',
      }),
    )

    const conduit = new FakeSocket()
    expect(manager.handleConduitOpen(conduit, undefined, 'pubkey')).toBe(false)
    expect(manager.handleConduitOpen(conduit, 'token', undefined)).toBe(false)
  })

  it('routes mobile <-> conduit messages after successful connect', () => {
    const manager = new RiftRealtimeManager(
      createRealtimeDeps({
        lookupResult: { code: '111111', public_key: 'pubkey-1' },
        potentiallyUpdateResult: true,
        tokenCode: '111111',
        connectionId: 'peer-1',
      }),
    )

    const conduit = new FakeSocket()
    const mobile = new FakeSocket()

    expect(manager.handleConduitOpen(conduit, 'token', 'pubkey-1')).toBe(true)

    manager.handleMobileMessage(mobile, JSON.stringify([RiftOpcode.CONNECT, '111111']))
    expect(conduit.sent[0]).toBe(JSON.stringify([RiftOpcode.OPEN, 'peer-1']))
    expect(mobile.sent[0]).toBe(JSON.stringify([RiftOpcode.CONNECT_PUBKEY, 'pubkey-1']))

    manager.handleMobileMessage(mobile, JSON.stringify([RiftOpcode.SEND, 'payload']))
    expect(conduit.sent[1]).toBe(JSON.stringify([RiftOpcode.MSG, 'peer-1', 'payload']))

    manager.handleConduitMessage(conduit, JSON.stringify([RiftOpcode.REPLY, 'peer-1', 'reply']))
    expect(mobile.sent[1]).toBe(JSON.stringify([RiftOpcode.RECEIVE, 'reply']))

    manager.handleMobileClose(mobile)
    expect(conduit.sent[2]).toBe(JSON.stringify([RiftOpcode.CLOSE, 'peer-1']))
  })

  it('accepts array payloads from websocket runtime', () => {
    const manager = new RiftRealtimeManager(
      createRealtimeDeps({
        lookupResult: { code: '111111', public_key: 'pubkey-1' },
        potentiallyUpdateResult: true,
        tokenCode: '111111',
        connectionId: 'peer-1',
      }),
    )

    const conduit = new FakeSocket()
    const mobile = new FakeSocket()

    expect(manager.handleConduitOpen(conduit, 'token', 'pubkey-1')).toBe(true)
    manager.handleMobileMessage(mobile, [RiftOpcode.CONNECT, '111111'])
    manager.handleMobileMessage(mobile, [RiftOpcode.SEND, 'payload'])

    expect(conduit.sent[1]).toBe(JSON.stringify([RiftOpcode.MSG, 'peer-1', 'payload']))
  })

  it('closes mobile socket on invalid opcode', () => {
    const manager = new RiftRealtimeManager(
      createRealtimeDeps({
        lookupResult: null,
        potentiallyUpdateResult: true,
        tokenCode: '111111',
        connectionId: 'peer-1',
      }),
    )

    const mobile = new FakeSocket()
    manager.handleMobileMessage(mobile, JSON.stringify([999, 'bad-op']))

    expect(mobile.closed).toBe(true)
  })

  it('closes mobile socket on malformed frame payload', () => {
    const manager = new RiftRealtimeManager(
      createRealtimeDeps({
        lookupResult: null,
        potentiallyUpdateResult: true,
        tokenCode: '111111',
        connectionId: 'peer-1',
      }),
    )

    const mobile = new FakeSocket()
    manager.handleMobileMessage(mobile, '{malformed-json')

    expect(mobile.closed).toBe(true)
  })

  it('ignores conduit reply for unknown peer', () => {
    const manager = new RiftRealtimeManager(
      createRealtimeDeps({
        lookupResult: { code: '111111', public_key: 'pubkey-1' },
        potentiallyUpdateResult: true,
        tokenCode: '111111',
        connectionId: 'peer-1',
      }),
    )

    const conduit = new FakeSocket()
    const mobile = new FakeSocket()

    expect(manager.handleConduitOpen(conduit, 'token', 'pubkey-1')).toBe(true)
    manager.handleMobileMessage(mobile, [RiftOpcode.CONNECT, '111111'])

    manager.handleConduitMessage(conduit, [RiftOpcode.REPLY, 'unknown-peer', 'late-message'])

    expect(conduit.closed).toBe(false)
    expect(mobile.sent).toEqual([JSON.stringify([RiftOpcode.CONNECT_PUBKEY, 'pubkey-1'])])
  })

  it('closes conduit socket on invalid conduit opcode', () => {
    const manager = new RiftRealtimeManager(
      createRealtimeDeps({
        lookupResult: null,
        potentiallyUpdateResult: true,
        tokenCode: '111111',
        connectionId: 'peer-1',
      }),
    )

    const conduit = new FakeSocket()
    manager.handleConduitMessage(conduit, JSON.stringify([999, 'bad-op']))

    expect(conduit.closed).toBe(true)
  })

  it('pings mobile and conduit sockets while keepalive is running', async () => {
    const manager = new RiftRealtimeManager(
      createRealtimeDeps({
        lookupResult: { code: '111111', public_key: 'pubkey-1' },
        potentiallyUpdateResult: true,
        tokenCode: '111111',
        connectionId: 'peer-1',
      }),
    )

    const conduit = new FakeSocket()
    const mobile = new FakeSocket()

    manager.handleMobileOpen(mobile)
    expect(manager.handleConduitOpen(conduit, 'token', 'pubkey-1')).toBe(true)

    manager.startKeepAlive(5)
    await Bun.sleep(20)
    manager.stopKeepAlive()

    expect(mobile.pingCount).toBeGreaterThan(0)
    expect(conduit.pingCount).toBeGreaterThan(0)
  })

  it('pings sockets deterministically with TestClock', async () => {
    const state = makeRealtimeStateService()
    const service = makeRealtimeService(
      createRealtimeDeps({
        lookupResult: { code: '111111', public_key: 'pubkey-1' },
        potentiallyUpdateResult: true,
        tokenCode: '111111',
        connectionId: 'peer-1',
      }),
      silentLogger,
      state,
    )
    const conduit = new FakeSocket()
    const mobile = new FakeSocket()

    try {
      await Effect.runPromise(
        Effect.gen(function*() {
          yield* service.handleMobileOpen(mobile)
          yield* service.handleConduitOpen(conduit, 'token', 'pubkey-1')
          yield* service.startKeepAlive(5)
          yield* Effect.yieldNow()

          expect(mobile.pingCount).toBe(1)
          expect(conduit.pingCount).toBe(1)

          yield* TestClock.adjust('15 millis')

          expect(mobile.pingCount).toBe(4)
          expect(conduit.pingCount).toBe(4)

          yield* service.stopKeepAlive
          const mobileCountAfterStop = mobile.pingCount
          const conduitCountAfterStop = conduit.pingCount

          yield* TestClock.adjust('15 millis')

          expect(mobile.pingCount).toBe(mobileCountAfterStop)
          expect(conduit.pingCount).toBe(conduitCountAfterStop)
        }).pipe(Effect.provide(TestContext.TestContext)),
      )
    } finally {
      await Effect.runPromise(Effect.provide(service.shutdown, TestContext.TestContext))
    }
  })

  it('stops sending pings after keepalive is stopped', async () => {
    const manager = new RiftRealtimeManager(
      createRealtimeDeps({
        lookupResult: { code: '111111', public_key: 'pubkey-1' },
        potentiallyUpdateResult: true,
        tokenCode: '111111',
        connectionId: 'peer-1',
      }),
    )

    const conduit = new FakeSocket()
    manager.handleConduitOpen(conduit, 'token', 'pubkey-1')

    manager.startKeepAlive(5)
    await Bun.sleep(15)
    manager.stopKeepAlive()

    const countAfterStop = conduit.pingCount
    await Bun.sleep(15)

    expect(conduit.pingCount).toBe(countAfterStop)
  })

  it('shutdown closes tracked sockets and stops keepalive', async () => {
    const manager = new RiftRealtimeManager(
      createRealtimeDeps({
        lookupResult: { code: '111111', public_key: 'pubkey-1' },
        potentiallyUpdateResult: true,
        tokenCode: '111111',
        connectionId: 'peer-1',
      }),
    )

    const conduit = new FakeSocket()
    const mobile = new FakeSocket()

    manager.handleMobileOpen(mobile)
    manager.handleConduitOpen(conduit, 'token', 'pubkey-1')
    manager.startKeepAlive(5)
    await Bun.sleep(15)

    manager.shutdown()

    const conduitPingAtShutdown = conduit.pingCount
    await Bun.sleep(15)

    expect(conduit.closed).toBe(true)
    expect(mobile.closed).toBe(true)
    expect(conduit.pingCount).toBe(conduitPingAtShutdown)
  })

  it('sends CONNECT_PUBKEY null when code is missing or conduit offline', () => {
    const manager = new RiftRealtimeManager(
      createRealtimeDeps({
        lookupResult: null,
        potentiallyUpdateResult: true,
        tokenCode: '111111',
        connectionId: 'peer-1',
      }),
    )

    const mobile = new FakeSocket()
    manager.handleMobileMessage(mobile, JSON.stringify([RiftOpcode.CONNECT, '111111']))

    expect(mobile.sent[0]).toBe(JSON.stringify([RiftOpcode.CONNECT_PUBKEY, null]))
  })

  it('fails generateCode with DatabaseNotInitializedError before initialize', async () => {
    const database = makeDatabaseService(':memory:')
    const exit = await Effect.runPromiseExit(database.generateCode('pubkey-uninitialized'))

    expect(exit._tag).toBe('Failure')
    if (exit._tag !== 'Failure') {
      throw new Error('Expected generateCode to fail before database initialize.')
    }

    const failure = Cause.failureOption(exit.cause)
    expect(Option.isSome(failure)).toBe(true)
    if (Option.isSome(failure)) {
      expect(failure.value).toBeInstanceOf(DatabaseNotInitializedError)
      expect(failure.value._tag).toBe('DatabaseNotInitializedError')
    }
  })

  it('returns MissingPublicKeyError response when POST /register omits pubkey', async () => {
    const response = await app.handle(
      new Request('http://localhost/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }),
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ ok: false, error: 'Missing public key.' })
  })
})
