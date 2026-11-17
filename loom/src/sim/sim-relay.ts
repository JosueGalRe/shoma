import { MobileOpcode, RelayOpcode } from '@shoma/protocol-contract'

import {
  base64ToBuffer,
  bufferToBase64,
  bufferToUtf8,
  parseEncryptedPayload,
  utf8ToBuffer,
} from '@/core/relay/relay-crypto-utils'
import { isRecord } from '@/lib/type-guards'

import type { SimWorld } from './sim-world'

// A code the relay doesn't know, to see the pairing error
export const SIM_INVALID_CODE = '000000'

export type SimApprovalMode = 'auto' | 'manual'

export interface SimPendingApproval {
  device: string
  resolve: (isApproved: boolean) => void
}

// What the panel draws, rebuilt on every change
export interface SimSnapshot {
  approvalMode: SimApprovalMode
  autoPopMs: number | null
  isConduitAway: boolean
  latencyMs: number
  memberCount: number
  pendingApprovals: SimPendingApproval[]
  phase: string
  queueSeconds: number | null
}

const SOCKET_OPEN = 1
const SOCKET_CLOSING = 2
const SOCKET_CLOSED = 3

function readFrame(data: unknown): unknown[] | null {
  try {
    const frame: unknown = JSON.parse(String(data))

    return Array.isArray(frame) ? frame : null
  } catch {
    return null
  }
}

async function createKeyPair(): Promise<{ pem: string; privateKey: CryptoKey }> {
  const keys = await crypto.subtle.generateKey(
    { hash: 'SHA-1', modulusLength: 2048, name: 'RSA-OAEP', publicExponent: new Uint8Array([1, 0, 1]) },
    true,
    ['encrypt', 'decrypt'],
  )
  const spki = bufferToBase64(await crypto.subtle.exportKey('spki', keys.publicKey))
  const lines = spki.match(/.{1,64}/g) ?? [spki]

  return { pem: `-----BEGIN PUBLIC KEY-----\n${lines.join('\n')}\n-----END PUBLIC KEY-----`, privateKey: keys.privateKey }
}

/**
 * Leyline and Conduit in one: answers loom's relay socket with Conduit's handshake, approval and mobile frames,
 * and serves them from the simulated world. Every socket (the app's and each route loader's) shares the world.
 */
export class SimRelay {
  readonly world: SimWorld
  readonly #keyPair = createKeyPair()
  readonly #approvedDevices = new Set<string>()
  readonly #listeners = new Set<() => void>()
  // The open sockets, which leyline closes when Conduit leaves
  readonly sockets = new Set<SimRelaySocket>()
  #approvalMode: SimApprovalMode = 'auto'
  // Conduit left the relay: a phone's CONNECT finds no desktop until it's back
  #isConduitAway = false
  #pendingApprovals: SimPendingApproval[] = []
  #snapshot: SimSnapshot
  // One way; a request waits for it twice
  latencyMs = 80

  constructor(world: SimWorld) {
    this.world = world
    this.#snapshot = this.#createSnapshot()

    world.onChange(() => {
      this.#notify()
    })
  }

  get isConduitAway(): boolean {
    return this.#isConduitAway
  }

  // Conduit leaves the relay (the PC dropped, or the League client closed, which it tells the phones first) and
  // Leyline closes their sockets
  dropConduit(isClientClosed: boolean): void {
    this.#isConduitAway = true

    this.sockets.forEach((socket) => {
      void socket.drop(isClientClosed)
    })

    this.#notify()
  }

  restoreConduit(): void {
    this.#isConduitAway = false
    this.#notify()
  }

  get publicKey(): Promise<string> {
    return this.#keyPair.then(({ pem }) => {
      return pem
    })
  }

  readonly subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener)

    return () => {
      this.#listeners.delete(listener)
    }
  }

  readonly getSnapshot = (): SimSnapshot => {
    return this.#snapshot
  }

  // Manual forgets approved devices, so the next pairing waits on the panel
  setApprovalMode(mode: SimApprovalMode): void {
    if (mode === 'manual') {
      this.#approvedDevices.clear()
    }

    this.#approvalMode = mode
    this.#notify()
  }

  setLatency(latencyMs: number): void {
    this.latencyMs = latencyMs
    this.#notify()
  }

  resolveApproval(approval: SimPendingApproval, isApproved: boolean): void {
    this.#pendingApprovals = this.#pendingApprovals.filter((pending) => {
      return pending !== approval
    })

    approval.resolve(isApproved)
    this.#notify()
  }

  // Conduit asks once per device; a device it approved reconnects silently
  approve(identity: string, device: string): Promise<boolean> {
    if (this.#approvalMode === 'auto' || this.#approvedDevices.has(identity)) {
      this.#approvedDevices.add(identity)

      return Promise.resolve(true)
    }

    return new Promise((resolve) => {
      this.#pendingApprovals = [
        ...this.#pendingApprovals,
        {
          device,
          resolve: (isApproved) => {
            if (isApproved) {
              this.#approvedDevices.add(identity)
            }

            resolve(isApproved)
          },
        },
      ]

      this.#notify()
    })
  }

  async decryptIdentity(encrypted: string): Promise<Record<string, unknown>> {
    const { privateKey } = await this.#keyPair
    const decrypted = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, base64ToBuffer(encrypted))
    const identity: unknown = JSON.parse(bufferToUtf8(decrypted))

    return isRecord(identity) ? { ...identity } : {}
  }

  #createSnapshot(): SimSnapshot {
    const { state } = this.world

    return {
      approvalMode: this.#approvalMode,
      autoPopMs: state.autoPopMs,
      isConduitAway: this.#isConduitAway,
      latencyMs: this.latencyMs,
      memberCount: state.lobby?.members.length ?? 0,
      pendingApprovals: this.#pendingApprovals,
      phase: state.champSelect ? `${this.world.phase} · ${state.champSelect.phase}` : this.world.phase,
      queueSeconds: state.search ? Math.floor((Date.now() - state.search.startedAt) / 1000) : null,
    }
  }

  #notify(): void {
    this.#snapshot = this.#createSnapshot()

    this.#listeners.forEach((listener) => {
      listener()
    })
  }
}

class SimRelaySocket extends EventTarget {
  readyState = 0
  readonly #relay: SimRelay
  readonly #patterns = new Map<string, RegExp>()
  #aesKey: CryptoKey | null = null
  #disposeWorld: (() => void) | null = null

  constructor(relay: SimRelay) {
    super()
    this.#relay = relay
    relay.sockets.add(this)

    this.#later(() => {
      this.readyState = SOCKET_OPEN
      this.dispatchEvent(new Event('open'))
    })
  }

  send(data: unknown): void {
    this.#receive(data).catch((error: unknown) => {
      console.error('[sim] relay frame failed', error)
    })
  }

  // Like a real socket, the close event waits for the closing handshake (a round trip, at least a frame), so the
  // App renders the failure state the client set before it
  close(): void {
    if (this.readyState >= SOCKET_CLOSING) {
      return
    }

    this.readyState = SOCKET_CLOSING
    this.#disposeWorld?.()
    this.#relay.sockets.delete(this)

    setTimeout(
      () => {
        this.readyState = SOCKET_CLOSED
        this.dispatchEvent(new Event('close'))
      },
      Math.max(16, this.#relay.latencyMs * 2),
    )
  }

  // Closed from the relay's side, after the notice if there's one
  async drop(isClientClosed: boolean): Promise<void> {
    if (isClientClosed) {
      await this.#emitEncrypted([MobileOpcode.CLIENT_CLOSED])
    }

    this.#later(() => {
      this.readyState = SOCKET_CLOSED
      this.#disposeWorld?.()
      this.#relay.sockets.delete(this)
      this.dispatchEvent(new Event('close'))
    })
  }

  #later(callback: () => void): void {
    setTimeout(() => {
      if (this.readyState < SOCKET_CLOSING) {
        callback()
      }
    }, this.#relay.latencyMs)
  }

  #emit(frame: unknown[]): void {
    this.#later(() => {
      this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(frame) }))
    })
  }

  async #emitEncrypted(frame: unknown[]): Promise<void> {
    if (!this.#aesKey) {
      return
    }

    const iv = crypto.getRandomValues(new Uint8Array(16))
    const encrypted = await crypto.subtle.encrypt({ iv, name: 'AES-CBC' }, this.#aesKey, utf8ToBuffer(JSON.stringify(frame)))

    this.#emit([RelayOpcode.RECEIVE, `${bufferToBase64(iv.buffer)}:${bufferToBase64(encrypted)}`])
  }

  async #receive(data: unknown): Promise<void> {
    const [opcode, payload] = readFrame(data) ?? []

    if (opcode === RelayOpcode.CONNECT) {
      if (payload === SIM_INVALID_CODE) {
        this.#emit([RelayOpcode.ERROR, { code: 'invalid_code' }])
      } else if (this.#relay.isConduitAway) {
        this.#emit([RelayOpcode.ERROR, { code: 'relay_unreachable' }])
      } else {
        this.#emit([RelayOpcode.CONNECT_PUBKEY, await this.#relay.publicKey])
      }

      return
    }

    if (opcode !== RelayOpcode.SEND) {
      return
    }

    if (Array.isArray(payload) && payload[0] === MobileOpcode.SECRET) {
      await this.#handshake(String(payload[1]))

      return
    }

    const parsed = typeof payload === 'string' ? parseEncryptedPayload(payload) : null

    if (!parsed || !this.#aesKey) {
      return
    }

    const decrypted = await crypto.subtle.decrypt(
      { iv: new Uint8Array(base64ToBuffer(parsed.iv)), name: 'AES-CBC' },
      this.#aesKey,
      base64ToBuffer(parsed.encrypted),
    )

    this.#handleMobileFrame(readFrame(bufferToUtf8(decrypted)) ?? [])
  }

  async #handshake(encryptedIdentity: string): Promise<void> {
    const identity = await this.#relay.decryptIdentity(encryptedIdentity)
    const secret = typeof identity.secret === 'string' ? identity.secret : ''
    const device = [identity.device, identity.browser].filter(Boolean).join(' · ')
    const isApproved = await this.#relay.approve(String(identity.identity), device || 'Unknown device')

    if (isApproved) {
      this.#aesKey = await crypto.subtle.importKey('raw', base64ToBuffer(secret), { name: 'AES-CBC' }, false, [
        'encrypt',
        'decrypt',
      ])

      this.#disposeWorld = this.#relay.world.onEvent((event) => {
        const isObserved = [...this.#patterns.values()].some((pattern) => {
          return pattern.test(event.path)
        })

        if (isObserved) {
          void this.#emitEncrypted([MobileOpcode.UPDATE, event.path, event.status, event.content])
        }
      })
    }

    this.#emit([RelayOpcode.RECEIVE, [MobileOpcode.SECRET_RESPONSE, isApproved]])
  }

  #handleMobileFrame([opcode, ...args]: unknown[]): void {
    if (opcode === MobileOpcode.REQUEST) {
      const [id, path, method, body] = args

      // Answered after the round trip, from the world as it is then
      this.#later(() => {
        const response = this.#relay.world.request(String(method), String(path), body)

        void this.#emitEncrypted([MobileOpcode.RESPONSE, id, response.status, response.content])
      })

      return
    }

    if (opcode === MobileOpcode.SUBSCRIBE && typeof args[0] === 'string') {
      this.#patterns.set(args[0], new RegExp(args[0]))

      return
    }

    if (opcode === MobileOpcode.UNSUBSCRIBE && typeof args[0] === 'string') {
      this.#patterns.delete(args[0])

      return
    }

    if (opcode === MobileOpcode.VERSION) {
      void this.#emitEncrypted([MobileOpcode.VERSION_RESPONSE, '0.0.0-sim', 'Sho’ma Sim'])
    }
  }
}

// Swaps the relay socket (URLs ending in /mobile) for the simulated one; Vite's HMR socket stays real
export function installSimRelay(relay: SimRelay): void {
  const RealWebSocket = globalThis.WebSocket

  globalThis.WebSocket = new Proxy(RealWebSocket, {
    construct(target, args) {
      const [url] = args

      return String(url).endsWith('/mobile') ? new SimRelaySocket(relay) : Reflect.construct(target, args)
    },
  })
}
