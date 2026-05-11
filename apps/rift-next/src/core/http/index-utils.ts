import type { ConduitOpenData } from './index-types'
import {
  decodeConduitAuth,
  decodeRegisterBody,
  decodeTokenCode,
  MissingConduitAuthError,
  MissingPublicKeyError,
  readConduitOpenShape,
  TokenMissingCodeError,
} from './http-schemas'

export function readPubkeyFromBody(value: unknown): string | null {
  const result = decodeRegisterBody(value)

  return result instanceof MissingPublicKeyError ? null : result
}

export function readConduitOpenData(value: unknown): ConduitOpenData {
  return readConduitOpenShape(value)
}

export function readTokenCode(value: unknown): string | null {
  const result = decodeTokenCode(value)

  return result instanceof TokenMissingCodeError ? null : result
}

export function extractConduitAuth(data: ConduitOpenData): { token?: string; publicKey?: string } {
  const query = data.query ?? {}
  const headers = data.headers ?? {}

  let token = query.token
  let publicKey = query.publicKey ?? query.publickey ?? query['public-key']

  token = token ?? headers.token
  publicKey = publicKey ?? headers['public-key'] ?? headers.publickey

  if ((!token || !publicKey) && data.request?.url) {
    const url = new URL(data.request.url)

    token = token ?? url.searchParams.get('token') ?? undefined
    publicKey =
      publicKey ??
      url.searchParams.get('publicKey') ??
      url.searchParams.get('publickey') ??
      url.searchParams.get('public-key') ??
      undefined
  }

  const result = decodeConduitAuth({ token, publicKey })

  return result instanceof MissingConduitAuthError ? { token, publicKey } : result
}
