import { MobileOpcode, RiftOpcode } from '@mimic/protocol-contract'

import type { RiftClientOptions, RiftClientState } from './rift-client-types'
import { RiftClientState as RiftClientStates } from './rift-client-types'
import { base64ToBuffer, bufferToBase64, bufferToUtf8, parseFrame, utf8ToBuffer } from './rift-client-utils'
import { getDeviceDescription, getDeviceId } from './rift-device-utils'

function resolveMobileWsBaseUrl(): string {
  const configured = import.meta.env.VITE_RIFT_WS_BASE_URL
  if (configured) {
    return configured
  }

  return 'ws://127.0.0.1:51001'
}

function parseEncryptedPayload(value: string): { iv: string; encrypted: string } | null {
  const separator = value.indexOf(':')
  if (separator < 0) {
    return null
  }

  const iv = value.slice(0, separator)
  const encrypted = value.slice(separator + 1)
  if (!iv || !encrypted) {
    return null
  }

  return { iv, encrypted }
}

function pemToSpkiBuffer(publicKeyPem: string): ArrayBuffer {
  const normalized = publicKeyPem
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\s+/g, '')

  return base64ToBuffer(normalized)
}

async function encryptWithPublicKeyPem(publicKeyPem: string, payload: string): Promise<string> {
  const spki = pemToSpkiBuffer(publicKeyPem)
  const importedKey = await window.crypto.subtle.importKey(
    'spki',
    spki,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-1',
    },
    false,
    ['encrypt'],
  )

  const encrypted = await window.crypto.subtle.encrypt({ name: 'RSA-OAEP' }, importedKey, utf8ToBuffer(payload))
  return bufferToBase64(encrypted)
}

export class RiftClient {
  #socket: WebSocket
  #state: RiftClientState = RiftClientStates.CONNECTING
  #callbacks: RiftClientOptions
  #code: string
  #sharedKey: CryptoKey | null = null
  #encrypted = false

  constructor(options: RiftClientOptions) {
    this.#callbacks = options
    this.#code = options.code

    const baseUrl = options.wsBaseUrl ?? resolveMobileWsBaseUrl()
    this.#socket = new WebSocket(`${baseUrl}/mobile`)
    this.#socket.addEventListener('open', this.#handleOpen)
    this.#socket.addEventListener('message', this.#handleMessage)
    this.#socket.addEventListener('close', this.#handleClose)
  }

  get state(): RiftClientState {
    return this.#state
  }

  close() {
    this.#socket.close()
  }

  async send(payload: string) {
    if (!this.#sharedKey || !this.#encrypted) {
      throw new Error('Cannot send payload before handshake is complete.')
    }

    const iv = new Uint8Array(16)
    window.crypto.getRandomValues(iv)

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-CBC',
        iv,
      },
      this.#sharedKey,
      utf8ToBuffer(payload),
    )

    const encodedPayload = `${bufferToBase64(iv.buffer)}:${bufferToBase64(encryptedBuffer)}`
    this.#socket.send(JSON.stringify([RiftOpcode.SEND, encodedPayload]))
  }

  #setState(state: RiftClientState) {
    this.#state = state

    if (this.#callbacks.onStateChange) {
      this.#callbacks.onStateChange(state)
    }
  }

  #handleOpen = () => {
    this.#socket.send(JSON.stringify([RiftOpcode.CONNECT, this.#code]))
  }

  #handleClose = () => {
    this.#setState(RiftClientStates.DISCONNECTED)

    if (this.#callbacks.onClose) {
      this.#callbacks.onClose()
    }
  }

  #handleMessage = async (event: MessageEvent) => {
    const frame = parseFrame(String(event.data))
    if (!frame) {
      return
    }

    const [op, ...args] = frame

    if (op === RiftOpcode.CONNECT_PUBKEY) {
      const publicKey = args[0]
      if (typeof publicKey !== 'string') {
        this.#setState(RiftClientStates.FAILED_NO_DESKTOP)
        return
      }

      this.#setState(RiftClientStates.HANDSHAKING)
      await this.#sendIdentity(publicKey)
      return
    }

    if (op === RiftOpcode.RECEIVE) {
      await this.#handleRelayPayload(args[0])
    }
  }

  async #sendIdentity(publicKey: string) {
    const secret = new Uint8Array(32)
    window.crypto.getRandomValues(secret)

    this.#sharedKey = await window.crypto.subtle.importKey(
      'raw',
      secret.buffer,
      {
        name: 'AES-CBC',
      },
      false,
      ['encrypt', 'decrypt'],
    )

    const description = getDeviceDescription()
    const identityPayload = {
      secret: bufferToBase64(secret.buffer),
      identity: getDeviceId(),
      device: description.device,
      browser: description.browser,
    }

    const encryptedIdentity = await encryptWithPublicKeyPem(publicKey, JSON.stringify(identityPayload))
    this.#socket.send(JSON.stringify([RiftOpcode.SEND, [MobileOpcode.SECRET, encryptedIdentity]]))
  }

  async #handleRelayPayload(payload: unknown) {
    if (this.#encrypted && this.#sharedKey && typeof payload === 'string') {
      const parsed = parseEncryptedPayload(payload)
      if (!parsed) {
        return
      }

      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: 'AES-CBC',
          iv: new Uint8Array(base64ToBuffer(parsed.iv)),
        },
        this.#sharedKey,
        base64ToBuffer(parsed.encrypted),
      )

      const text = bufferToUtf8(decrypted)
      if (this.#callbacks.onData) {
        this.#callbacks.onData(text)
      }

      return
    }

    if (Array.isArray(payload) && payload[0] === MobileOpcode.SECRET_RESPONSE) {
      const accepted = Boolean(payload[1])
      if (!accepted) {
        this.#sharedKey = null
        this.#setState(RiftClientStates.FAILED_DESKTOP_DENY)
        return
      }

      this.#encrypted = true
      this.#setState(RiftClientStates.CONNECTED)
      if (this.#callbacks.onOpen) {
        this.#callbacks.onOpen()
      }
    }
  }
}
