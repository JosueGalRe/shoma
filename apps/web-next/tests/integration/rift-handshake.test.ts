import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { createPrivateKey, privateDecrypt } from 'node:crypto'
import { unlinkSync } from 'node:fs'

import { MobileOpcode, RiftOpcode } from '@mimic/protocol-contract'

import { startRuntime } from '../../../rift-next/src/index'
import { RiftClient } from '../../src/core/rift/rift-client'
import { RiftClientState } from '../../src/core/rift/rift-client-types'

type RuntimeHandle = ReturnType<typeof startRuntime>

type IdentityPayload = {
  secret: string
  identity: string
  device: string
  browser: string
}

function isIdentityPayload(value: unknown): value is IdentityPayload {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.secret === 'string' &&
    typeof candidate.identity === 'string' &&
    typeof candidate.device === 'string' &&
    typeof candidate.browser === 'string'
  )
}

class LocalStorageMock {
  #values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.#values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.#values.set(key, value)
  }

  removeItem(key: string): void {
    this.#values.delete(key)
  }
}

function decodeCodeFromToken(token: string): string {
  const parts = token.split('.')
  if (parts.length < 2) {
    throw new Error('Invalid token format.')
  }

  const decoded = Buffer.from(parts[1], 'base64url').toString('utf8')
  const payload: unknown = JSON.parse(decoded)
  if (typeof payload !== 'object' || payload === null || !('code' in payload) || typeof payload.code !== 'string') {
    throw new Error('Invalid token payload.')
  }

  return payload.code
}

function waitForOpen(ws: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('socket open timeout')), 5000)

    ws.addEventListener(
      'open',
      () => {
        clearTimeout(timer)
        resolve()
      },
      { once: true },
    )

    ws.addEventListener(
      'error',
      () => {
        clearTimeout(timer)
        reject(new Error('socket errored before open'))
      },
      { once: true },
    )
  })
}

async function createPemKeyPair(): Promise<{ publicPem: string; privatePem: string }> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-1',
    },
    true,
    ['encrypt', 'decrypt'],
  )

  const exportedPublic = await crypto.subtle.exportKey('spki', keyPair.publicKey)
  const publicPem = [
    '-----BEGIN PUBLIC KEY-----',
    Buffer.from(exportedPublic)
      .toString('base64')
      .match(/.{1,64}/g)
      ?.join('\n') ?? '',
    '-----END PUBLIC KEY-----',
  ].join('\n')

  const exportedPrivate = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
  const privatePem = [
    '-----BEGIN PRIVATE KEY-----',
    Buffer.from(exportedPrivate)
      .toString('base64')
      .match(/.{1,64}/g)
      ?.join('\n') ?? '',
    '-----END PRIVATE KEY-----',
  ].join('\n')

  return { publicPem, privatePem }
}

async function registerConduit(port: number, publicPem: string): Promise<{ code: string; token: string }> {
  const registerResponse = await fetch(`http://127.0.0.1:${port}/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ pubkey: publicPem }),
  })

  const registerBody = (await registerResponse.json()) as { ok: boolean; token: string }
  expect(registerBody.ok).toBe(true)

  return {
    code: decodeCodeFromToken(registerBody.token),
    token: registerBody.token,
  }
}

function waitForMessage(ws: WebSocket): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('socket message timeout')), 5000)

    ws.addEventListener(
      'message',
      (event) => {
        clearTimeout(timer)
        const parsed: unknown = JSON.parse(String(event.data))
        if (!Array.isArray(parsed)) {
          reject(new Error('expected frame array'))
          return
        }

        resolve(parsed)
      },
      { once: true },
    )
  })
}

let runtime: RuntimeHandle | null = null
let dbPath = ''

beforeAll(() => {
  Bun.env.RIFT_JWT_SECRET = 'web-next-integration-secret'

  const randomPort = 57000 + Math.floor(Math.random() * 500)
  dbPath = new URL(`./.handshake-${Date.now()}-${Math.random()}.db`, import.meta.url).pathname
  runtime = startRuntime({
    port: randomPort,
    databasePath: dbPath,
    keepAliveIntervalMs: 100,
  })

  const localStorage = new LocalStorageMock()
  Object.defineProperty(globalThis, 'window', {
    value: {
      crypto: globalThis.crypto,
      localStorage,
    },
    configurable: true,
  })
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorage,
    configurable: true,
  })
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    },
    configurable: true,
  })
})

afterAll(() => {
  runtime?.stop()

  try {
    unlinkSync(dbPath)
  } catch {
    // ignore test file cleanup issues
  }
})

describe('web-next Rift client handshake', () => {
  it('completes SECRET handshake payload compatible with conduit RSA decrypt', async () => {
    if (!runtime) {
      throw new Error('runtime not initialized')
    }

    const { publicPem, privatePem } = await createPemKeyPair()
    const { code, token } = await registerConduit(runtime.port, publicPem)

    const conduit = new WebSocket(
      `ws://127.0.0.1:${runtime.port}/conduit?token=${encodeURIComponent(token)}&publicKey=${encodeURIComponent(publicPem)}`,
    )
    await waitForOpen(conduit)

    let openTriggered = false
    const client = new RiftClient({
      code,
      wsBaseUrl: `ws://127.0.0.1:${runtime.port}`,
      onOpen() {
        openTriggered = true
      },
    })

    const openFrame = await waitForMessage(conduit)
    expect(openFrame[0]).toBe(RiftOpcode.OPEN)
    const peerId = openFrame[1]
    expect(typeof peerId).toBe('string')

    const secretFrame = await waitForMessage(conduit)
    expect(secretFrame[0]).toBe(RiftOpcode.MSG)
    expect(secretFrame[1]).toBe(peerId)

    const payload = secretFrame[2]
    if (!Array.isArray(payload) || payload[0] !== MobileOpcode.SECRET || typeof payload[1] !== 'string') {
      throw new Error('unexpected secret payload shape')
    }

    const decrypted = privateDecrypt(
      {
        key: createPrivateKey(privatePem),
        oaepHash: 'sha1',
      },
      Buffer.from(payload[1], 'base64'),
    ).toString('utf8')

    const decoded: unknown = JSON.parse(decrypted)
    if (!isIdentityPayload(decoded)) {
      throw new Error('decrypted payload does not match expected identity shape')
    }

    expect(typeof decoded.secret).toBe('string')
    expect(typeof decoded.identity).toBe('string')
    expect(typeof decoded.device).toBe('string')
    expect(typeof decoded.browser).toBe('string')

    conduit.send(JSON.stringify([RiftOpcode.REPLY, peerId, [MobileOpcode.SECRET_RESPONSE, true]]))

    await Bun.sleep(50)
    expect(openTriggered).toBe(true)
    expect(client.state).toBe(RiftClientState.CONNECTED)

    client.close()
    conduit.close()
  })

  it('transitions to deny state and supports retry with a new connection', async () => {
    if (!runtime) {
      throw new Error('runtime not initialized')
    }

    const { publicPem } = await createPemKeyPair()
    const { code, token } = await registerConduit(runtime.port, publicPem)

    const firstConduit = new WebSocket(
      `ws://127.0.0.1:${runtime.port}/conduit?token=${encodeURIComponent(token)}&publicKey=${encodeURIComponent(publicPem)}`,
    )
    await waitForOpen(firstConduit)

    const deniedClient = new RiftClient({
      code,
      wsBaseUrl: `ws://127.0.0.1:${runtime.port}`,
    })

    const firstOpenFrame = await waitForMessage(firstConduit)
    const firstPeerId = firstOpenFrame[1]
    await waitForMessage(firstConduit)
    firstConduit.send(JSON.stringify([RiftOpcode.REPLY, firstPeerId, [MobileOpcode.SECRET_RESPONSE, false]]))

    await Bun.sleep(50)
    expect(deniedClient.state).toBe(RiftClientState.FAILED_DESKTOP_DENY)
    deniedClient.close()
    firstConduit.close()

    const secondConduit = new WebSocket(
      `ws://127.0.0.1:${runtime.port}/conduit?token=${encodeURIComponent(token)}&publicKey=${encodeURIComponent(publicPem)}`,
    )
    await waitForOpen(secondConduit)

    let opened = false
    const retryClient = new RiftClient({
      code,
      wsBaseUrl: `ws://127.0.0.1:${runtime.port}`,
      onOpen() {
        opened = true
      },
    })

    const secondOpenFrame = await waitForMessage(secondConduit)
    const secondPeerId = secondOpenFrame[1]
    await waitForMessage(secondConduit)
    secondConduit.send(JSON.stringify([RiftOpcode.REPLY, secondPeerId, [MobileOpcode.SECRET_RESPONSE, true]]))

    await Bun.sleep(50)
    expect(opened).toBe(true)
    expect(retryClient.state).toBe(RiftClientState.CONNECTED)

    retryClient.close()
    secondConduit.close()
  })

  it('transitions to disconnected when conduit closes after a successful handshake', async () => {
    if (!runtime) {
      throw new Error('runtime not initialized')
    }

    const { publicPem } = await createPemKeyPair()
    const { code, token } = await registerConduit(runtime.port, publicPem)

    const conduit = new WebSocket(
      `ws://127.0.0.1:${runtime.port}/conduit?token=${encodeURIComponent(token)}&publicKey=${encodeURIComponent(publicPem)}`,
    )
    await waitForOpen(conduit)

    let closeTriggered = false
    const client = new RiftClient({
      code,
      wsBaseUrl: `ws://127.0.0.1:${runtime.port}`,
      onClose() {
        closeTriggered = true
      },
    })

    const openFrame = await waitForMessage(conduit)
    const peerId = openFrame[1]
    await waitForMessage(conduit)
    conduit.send(JSON.stringify([RiftOpcode.REPLY, peerId, [MobileOpcode.SECRET_RESPONSE, true]]))

    await Bun.sleep(50)
    expect(client.state).toBe(RiftClientState.CONNECTED)

    conduit.close()

    await Bun.sleep(100)
    expect(client.state).toBe(RiftClientState.DISCONNECTED)
    expect(closeTriggered).toBe(true)

    client.close()
  })
})
