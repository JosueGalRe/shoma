import { MobileOpcode } from '@mimic/protocol-contract'

import type { RiftLcuResult, RiftObserver } from './rift-lcu-types'
import {
  buildObservePattern,
  frameIsResponse,
  frameIsUpdate,
  frameIsVersionResponse,
  parseMobileFrame,
  safeRegexMatch,
} from './rift-lcu-utils'

type PendingResolver = (value: RiftLcuResult) => void

type RiftLcuTransportOptions = {
  send: (payload: string) => Promise<void>
  isConnected: () => boolean
  onPeer: (version: string, name: string) => void
  onQueuePathUpdate: (queueId: number) => void
  onMapPathUpdate: (mapId: number) => void
  onObserverError: (matcher: string) => void
}

export class RiftLcuTransport {
  #observers = new Map<string, RiftObserver>()
  #requestResolvers = new Map<number, PendingResolver>()
  #requestId = 0
  #options: RiftLcuTransportOptions

  constructor(options: RiftLcuTransportOptions) {
    this.#options = options
  }

  async request(path: string, method: string = 'GET', body?: string): Promise<RiftLcuResult> {
    const id = this.#requestId
    this.#requestId += 1

    const pending = new Promise<RiftLcuResult>((resolve) => {
      this.#requestResolvers.set(id, resolve)
    })

    try {
      await this.#options.send(JSON.stringify([MobileOpcode.REQUEST, id, path, method, body]))
    } catch (error) {
      this.#requestResolvers.delete(id)
      throw error
    }

    return pending
  }

  async observe(path: string, handler: RiftObserver): Promise<void> {
    const pattern = buildObservePattern(path)
    this.#observers.set(pattern, handler)

    if (this.#options.isConnected()) {
      await this.#options.send(JSON.stringify([MobileOpcode.SUBSCRIBE, pattern]))
    }

    const initial = await this.request(path)
    await handler(initial)
  }

  async unobserve(path: string): Promise<void> {
    const pattern = buildObservePattern(path)
    this.#observers.delete(pattern)

    if (this.#options.isConnected()) {
      await this.#options.send(JSON.stringify([MobileOpcode.UNSUBSCRIBE, pattern]))
    }
  }

  handlePayload(payload: string): void {
    const frame = parseMobileFrame(payload)
    if (!frame) {
      return
    }

    if (frameIsUpdate(frame)) {
      const [, path, nextStatus, nextContent] = frame

      const queuePatternMatch = /^\/lol-game-queues\/v1\/queues\/(\d+)$/.exec(path)
      if (queuePatternMatch) {
        this.#options.onQueuePathUpdate(Number(queuePatternMatch[1]))
      }

      const mapPatternMatch = /^\/lol-maps\/v1\/map\/(\d+)$/.exec(path)
      if (mapPatternMatch) {
        this.#options.onMapPathUpdate(Number(mapPatternMatch[1]))
      }

      this.#observers.forEach((handler, matcher) => {
        if (!safeRegexMatch(matcher, path)) {
          return
        }

        Promise.resolve(handler({ status: nextStatus, content: nextContent })).catch(() => {
          this.#options.onObserverError(matcher)
        })
      })
      return
    }

    if (frameIsResponse(frame)) {
      const resolver = this.#requestResolvers.get(frame[1])
      if (!resolver) {
        return
      }

      resolver({ status: frame[2], content: frame[3] })
      this.#requestResolvers.delete(frame[1])
      return
    }

    if (frameIsVersionResponse(frame)) {
      this.#options.onPeer(frame[1], frame[2])
    }
  }

  reset(): void {
    this.#observers.clear()
    this.#requestResolvers.clear()
    this.#requestId = 0
  }
}
