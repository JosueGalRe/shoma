import { RiftOpcode } from '@mimic/protocol-contract'

import { logger } from '../logger/logger-utils'
import type { ConduitRecord, RealtimeDependencies, RealtimeSocket } from './realtime-types'
import { parseFrame, socketKey } from './realtime-utils'

export class RiftRealtimeManager {
  #conduitConnections = new Map<string, RealtimeSocket>()
  #conduitSocketToCode = new Map<object, string>()
  #conduitToMobileMap = new Map<object, ConduitRecord[]>()
  #mobileToConduitMap = new Map<object, ConduitRecord>()
  #mobileSockets = new Set<RealtimeSocket>()
  #conduitSockets = new Set<RealtimeSocket>()
  #keepAliveInterval: ReturnType<typeof setInterval> | null = null
  #deps: RealtimeDependencies

  constructor(deps: RealtimeDependencies) {
    this.#deps = deps
  }

  handleMobileOpen(socket: RealtimeSocket) {
    this.#mobileSockets.add(socket)
    logger.debug('mobile_open', { mobileCount: this.#mobileSockets.size })
  }

  handleConduitOpen(socket: RealtimeSocket, token: string | undefined, pubkey: string | undefined): boolean {
    if (!token || !pubkey) {
      logger.warn('conduit_open_rejected_missing_auth', {
        hasToken: Boolean(token),
        hasPublicKey: Boolean(pubkey),
      })
      return false
    }

    const decoded = this.#deps.verifyToken(token)
    if (!decoded || typeof decoded.code !== 'string') {
      logger.warn('conduit_open_rejected_invalid_token')
      return false
    }

    const code = decoded.code
    if (!this.#deps.potentiallyUpdate(code, pubkey)) {
      logger.warn('conduit_open_rejected_stale_code', { code })
      return false
    }

    const existing = this.#conduitConnections.get(code)
    if (existing && existing !== socket) {
      this.handleConduitClose(existing)
      existing.close()
      logger.info('conduit_connection_evicted', { code })
    }

    const conduitIdentity = socketKey(socket)
    this.#conduitSockets.add(socket)
    this.#conduitConnections.set(code, socket)
    this.#conduitSocketToCode.set(conduitIdentity, code)
    this.#conduitToMobileMap.set(conduitIdentity, [])
    logger.info('conduit_open', { code, conduitCount: this.#conduitSockets.size })
    return true
  }

  handleConduitClose(socket: RealtimeSocket) {
    const conduitIdentity = socketKey(socket)
    const code = this.#conduitSocketToCode.get(conduitIdentity)
    const peers = this.#conduitToMobileMap.get(conduitIdentity) ?? []

    this.#conduitSockets.delete(socket)

    for (const peer of peers) {
      this.#mobileToConduitMap.delete(socketKey(peer.socket))
      peer.socket.close()
    }

    this.#conduitToMobileMap.delete(conduitIdentity)
    if (code) {
      this.#conduitConnections.delete(code)
      this.#conduitSocketToCode.delete(conduitIdentity)
    }

    logger.info('conduit_close', {
      code,
      detachedPeers: peers.length,
      conduitCount: this.#conduitSockets.size,
    })
  }

  handleConduitMessage(socket: RealtimeSocket, rawMessage: unknown) {
    try {
      const [op, ...args] = parseFrame(rawMessage)

      if (op !== RiftOpcode.REPLY) {
        throw new Error('Conduit sent invalid opcode.')
      }

      const peerId = args[0]
      if (typeof peerId !== 'string') {
        throw new Error('Conduit sent invalid peer id.')
      }

      const peers = this.#conduitToMobileMap.get(socketKey(socket)) ?? []
      const peer = peers.find((entry) => entry.uuid === peerId)
      if (!peer) {
        logger.debug('conduit_reply_ignored_unknown_peer', { peerId })
        return
      }

      peer.socket.send(JSON.stringify([RiftOpcode.RECEIVE, args[1]]))
    } catch (error) {
      logger.warn('conduit_message_error', {
        reason: error instanceof Error ? error.message : 'unknown',
      })
      socket.close()
    }
  }

  handleMobileClose(socket: RealtimeSocket) {
    this.#mobileSockets.delete(socket)

    const mobileIdentity = socketKey(socket)
    const peer = this.#mobileToConduitMap.get(mobileIdentity)
    if (!peer) {
      logger.debug('mobile_close_no_peer', { mobileCount: this.#mobileSockets.size })
      return
    }

    this.#mobileToConduitMap.delete(mobileIdentity)

    const conduitPeers = this.#conduitToMobileMap.get(socketKey(peer.conduitSocket))
    if (conduitPeers) {
      const index = conduitPeers.findIndex((entry) => entry.uuid === peer.uuid)
      if (index >= 0) {
        conduitPeers.splice(index, 1)
      }
    }

    peer.conduitSocket.send(JSON.stringify([RiftOpcode.CLOSE, peer.uuid]))
    logger.info('mobile_close', {
      peerId: peer.uuid,
      mobileCount: this.#mobileSockets.size,
    })
  }

  startKeepAlive(intervalMs: number = 10000) {
    this.stopKeepAlive()

    this.#keepAliveInterval = setInterval(() => {
      for (const socket of this.#mobileSockets) {
        socket.ping?.()
      }

      for (const socket of this.#conduitSockets) {
        socket.ping?.()
      }
    }, intervalMs)

    logger.info('keepalive_started', { intervalMs })
  }

  stopKeepAlive() {
    if (!this.#keepAliveInterval) {
      return
    }

    clearInterval(this.#keepAliveInterval)
    this.#keepAliveInterval = null
    logger.info('keepalive_stopped')
  }

  shutdown() {
    this.stopKeepAlive()

    for (const socket of this.#mobileSockets) {
      socket.close()
    }

    for (const socket of this.#conduitSockets) {
      socket.close()
    }

    this.#mobileSockets.clear()
    this.#conduitSockets.clear()
    this.#mobileToConduitMap.clear()
    this.#conduitToMobileMap.clear()
    this.#conduitSocketToCode.clear()
    this.#conduitConnections.clear()
    logger.info('realtime_shutdown_complete')
  }

  handleMobileMessage(socket: RealtimeSocket, rawMessage: unknown) {
    try {
      const [op, ...args] = parseFrame(rawMessage)

      if (op === RiftOpcode.CONNECT) {
        const mobileIdentity = socketKey(socket)
        if (this.#mobileToConduitMap.has(mobileIdentity)) {
          logger.warn('mobile_connect_duplicate_session')
          socket.close()
          return
        }

        const code = args[0]
        if (typeof code !== 'string') {
          throw new Error('Mobile sent invalid code.')
        }

        const entry = this.#deps.lookup(code)
        const conduit = this.#conduitConnections.get(code)
        if (!entry || !conduit) {
          socket.send(JSON.stringify([RiftOpcode.CONNECT_PUBKEY, null]))
          logger.info('mobile_connect_no_conduit', { code })
          return
        }

        const uuid = this.#deps.createConnectionId()
        const peer: ConduitRecord = { uuid, socket, conduitSocket: conduit }

        const conduitIdentity = socketKey(conduit)
        const conduitPeers = this.#conduitToMobileMap.get(conduitIdentity)
        if (conduitPeers) {
          conduitPeers.push(peer)
        } else {
          this.#conduitToMobileMap.set(conduitIdentity, [peer])
        }

        this.#mobileToConduitMap.set(mobileIdentity, peer)
        conduit.send(JSON.stringify([RiftOpcode.OPEN, uuid]))
        socket.send(JSON.stringify([RiftOpcode.CONNECT_PUBKEY, entry.public_key]))
        logger.info('mobile_connect_attached', { code, peerId: uuid })
        return
      }

      if (op === RiftOpcode.SEND) {
        const peer = this.#mobileToConduitMap.get(socketKey(socket))
        if (!peer) {
          logger.warn('mobile_send_without_peer')
          socket.close()
          return
        }

        peer.conduitSocket.send(JSON.stringify([RiftOpcode.MSG, peer.uuid, args[0]]))
        return
      }

      throw new Error('Mobile sent invalid opcode.')
    } catch (error) {
      logger.warn('mobile_message_error', {
        reason: error instanceof Error ? error.message : 'unknown',
      })
      socket.close()
    }
  }
}
