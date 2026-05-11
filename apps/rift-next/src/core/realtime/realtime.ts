import { Effect } from 'effect'

import { logger } from '../logger/logger-utils'
import { makeRealtimeService, makeRealtimeStateService } from './realtime-service'
import type { RealtimeDependencies, RealtimeSocket } from './realtime-types'

const syncLogger = {
  info: (event: string, context?: Record<string, unknown>) => Effect.sync(() => logger.info(event, context)),
  warn: (event: string, context?: Record<string, unknown>) => Effect.sync(() => logger.warn(event, context)),
  error: (event: string, context?: Record<string, unknown>) => Effect.sync(() => logger.error(event, context)),
  debug: (event: string, context?: Record<string, unknown>) => Effect.sync(() => logger.debug(event, context)),
}

export class RiftRealtimeManager {
  #service

  constructor(deps: RealtimeDependencies) {
    this.#service = makeRealtimeService(deps, syncLogger, makeRealtimeStateService())
  }

  handleMobileOpen(socket: RealtimeSocket) {
    Effect.runSync(this.#service.handleMobileOpen(socket))
  }

  handleConduitOpen(socket: RealtimeSocket, token: string | undefined, pubkey: string | undefined): boolean {
    const exit = Effect.runSyncExit(this.#service.handleConduitOpen(socket, token, pubkey))
    return exit._tag === 'Success'
  }

  handleConduitClose(socket: RealtimeSocket) {
    Effect.runSync(this.#service.handleConduitClose(socket))
  }

  handleConduitMessage(socket: RealtimeSocket, rawMessage: unknown) {
    Effect.runSync(this.#service.handleConduitMessage(socket, rawMessage))
  }

  handleMobileClose(socket: RealtimeSocket) {
    Effect.runSync(this.#service.handleMobileClose(socket))
  }

  startKeepAlive(intervalMs: number = 10000) {
    Effect.runSync(this.#service.startKeepAlive(intervalMs))
  }

  stopKeepAlive() {
    Effect.runSync(this.#service.stopKeepAlive)
  }

  shutdown() {
    Effect.runSync(this.#service.shutdown)
  }

  handleMobileMessage(socket: RealtimeSocket, rawMessage: unknown) {
    Effect.runSync(this.#service.handleMobileMessage(socket, rawMessage))
  }
}
