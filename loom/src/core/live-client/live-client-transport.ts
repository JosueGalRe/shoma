import { createContext, use } from 'react'

import { type LcuHttpMethodValue, MobileOpcode } from '@shoma/protocol-contract'
import { array, safeParse, unknown } from 'valibot'

import {
  type LiveClientResult,
  type LiveClientTransportContextValue,
  type LiveClientTransport as LiveClientTransportContract,
  type LiveClientTransportOptions,
} from '@/core/live-client/live-client-transport-types'
import { type RelayClient, RelayClientDisconnectedError } from '@/core/relay/relay-client'

type Unsubscribe = () => void
type MobileFrame = [number, ...unknown[]]

interface PendingRequest {
  path: string
  reject(error: Error): void
  resolve(value: LiveClientResult): void
  timeout: ReturnType<typeof setTimeout>
}

type RelayClientLike = Pick<RelayClient, 'isConnected' | 'onData' | 'onClose' | 'send'>

const DEFAULT_REQUEST_TIMEOUT_MS = 10_000

const MobileFrameSchema = array(unknown())

export class LiveClientTransportMalformedResponseError extends Error {
  constructor() {
    super('Live Client transport received a malformed response frame.')
    this.name = 'LiveClientTransportMalformedResponseError'
  }
}

export const LiveClientTransportContext = createContext<LiveClientTransportContextValue | null>(null)

export class LiveClientTransport implements LiveClientTransportContract {
  readonly #client: RelayClientLike
  readonly #requestTimeoutMs: number
  readonly #pendingRequests = new Map<number, PendingRequest>()
  readonly #disposeData: Unsubscribe
  readonly #disposeClose: Unsubscribe

  #requestId = 0

  constructor(client: RelayClientLike, options: LiveClientTransportOptions = {}) {
    this.#client = client
    this.#requestTimeoutMs = options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS

    this.#disposeData = client.onData((payload) => {
      this.#handlePayload(payload)
    })

    this.#disposeClose = client.onClose(() => {
      this.#handleClose()
    })
  }

  close(): void {
    this.#rejectPending(new RelayClientDisconnectedError())
    this.#disposeData()
    this.#disposeClose()
  }

  request(path: string, method: LcuHttpMethodValue, body?: unknown): Promise<LiveClientResult> {
    if (!this.#client.isConnected) {
      throw new RelayClientDisconnectedError()
    }

    const id = this.#requestId

    this.#requestId += 1

    return new Promise<LiveClientResult>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.#pendingRequests.delete(id)
        reject(new Error(`Live Client request timed out after ${this.#requestTimeoutMs}ms: ${path}`))
      }, this.#requestTimeoutMs)

      const pendingRequest: PendingRequest = {
        path,
        reject(error) {
          reject(error)
        },
        resolve(value) {
          resolve(value)
        },
        timeout,
      }

      this.#pendingRequests.set(id, pendingRequest)

      const frame =
        body !== undefined ? [MobileOpcode.REQUEST, id, path, method, body] : [MobileOpcode.REQUEST, id, path, method]

      this.#client.send(JSON.stringify(frame)).catch((error: unknown) => {
        this.#pendingRequests.delete(id)
        clearTimeout(timeout)
        reject(error instanceof Error ? error : new Error('Failed to send Live Client request.'))
      })
    })
  }

  #handlePayload(payload: string): void {
    const frame = parseMobileFrame(payload)

    if (!frame) {
      return
    }

    if (frame[0] === MobileOpcode.RESPONSE) {
      this.#handleResponse(frame)
    }
  }

  #handleClose(): void {
    this.#rejectPending(new RelayClientDisconnectedError())
  }

  #handleResponse(frame: MobileFrame): void {
    const [, id, status, content] = frame

    if (typeof id !== 'number') {
      return
    }

    const pending = this.#pendingRequests.get(id)

    if (!pending) {
      return
    }

    this.#pendingRequests.delete(id)
    clearTimeout(pending.timeout)

    if (typeof status !== 'number') {
      pending.reject(new LiveClientTransportMalformedResponseError())

      return
    }

    try {
      pending.resolve({
        content: parseJsonContent(content),
        status,
      })
    } catch {
      pending.reject(new LiveClientTransportMalformedResponseError())
    }
  }

  #rejectPending(error: Error): void {
    this.#pendingRequests.forEach((pending) => {
      clearTimeout(pending.timeout)
      pending.reject(error)
    })

    this.#pendingRequests.clear()
  }
}

export function useSharedLiveClientTransport(): LiveClientTransportContract | null {
  const context = use(LiveClientTransportContext)

  if (!context) {
    throw new Error('useSharedLiveClientTransport must be used within a LiveClientTransport provider')
  }

  return context.transport
}

function parseMobileFrame(payload: string): MobileFrame | null {
  try {
    const parsed = safeParse(MobileFrameSchema, JSON.parse(payload))

    if (!parsed.success) {
      return null
    }

    const [opcode, ...args] = parsed.output

    return typeof opcode === 'number' ? [opcode, ...args] : null
  } catch {
    return null
  }
}

function parseJsonContent(content: unknown): unknown {
  if (typeof content !== 'string') {
    return content
  }

  try {
    return JSON.parse(content)
  } catch {
    throw new LiveClientTransportMalformedResponseError()
  }
}
