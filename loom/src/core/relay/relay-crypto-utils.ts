export function utf8ToBuffer(value: string): ArrayBuffer {
  const bytes = new TextEncoder().encode(value)

  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
}

export function bufferToUtf8(buffer: ArrayBuffer): string {
  return new TextDecoder('utf-8').decode(new Uint8Array(buffer))
}

export function bufferToBase64(buffer: ArrayBuffer): string {
  let binary = ''
  const bytes = new Uint8Array(buffer)

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary)
}

export function base64ToBuffer(value: string): ArrayBuffer {
  const decoded = atob(value)
  const bytes = new Uint8Array(decoded.length)

  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index)
  }

  return bytes.buffer
}

export function pemToSpkiBuffer(publicKeyPem: string): ArrayBuffer {
  const normalized = publicKeyPem
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\s+/g, '')

  return base64ToBuffer(normalized)
}

export async function encryptWithPublicKeyPem(publicKeyPem: string, payload: string): Promise<string> {
  const publicKey = await globalThis.crypto.subtle.importKey(
    'spki',
    pemToSpkiBuffer(publicKeyPem),
    { hash: 'SHA-1', name: 'RSA-OAEP' },
    false,
    ['encrypt'],
  )
  const encrypted = await globalThis.crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, utf8ToBuffer(payload))

  return bufferToBase64(encrypted)
}

export function parseEncryptedPayload(payload: string): { encrypted: string; iv: string } | null {
  const separator = payload.indexOf(':')

  if (separator <= 0 || separator === payload.length - 1) {
    return null
  }

  return {
    encrypted: payload.slice(separator + 1),
    iv: payload.slice(0, separator),
  }
}
