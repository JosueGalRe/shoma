import { Match } from 'effect'

import {
  decodeConduitAuth,
  decodeRegisterBody,
  decodeTokenCode,
  MissingConduitAuthError,
  MissingPublicKeyError,
  readConduitOpenShape,
  TokenMissingCodeError,
} from './http-schemas'

import type { ConduitOpenData } from './http-types'

export function readPubkeyFromBody(value: unknown): string | null {
  const result = decodeRegisterBody(value)

  return Match.value(result).pipe(
    Match.when((r): r is MissingPublicKeyError => r instanceof MissingPublicKeyError, () => null),
    Match.orElse((r: string) => r),
  )
}

export function readConduitOpenData(value: unknown): ConduitOpenData {
  return readConduitOpenShape(value)
}

export function readTokenCode(value: unknown): string | null {
  const result = decodeTokenCode(value)

  return Match.value(result).pipe(
    Match.when((r): r is TokenMissingCodeError => r instanceof TokenMissingCodeError, () => null),
    Match.orElse((r: string) => r),
  )
}

export function extractConduitAuth(data: ConduitOpenData): { token?: string; publicKey?: string } {
  const query = data.query ?? {}
  const headers = data.headers ?? {}

  const {
    token: queryToken,
    publicKey: queryPublicKey,
    publickey: queryPublickey,
  } = query
  const queryPublicKeyHyphen = query['public-key']

  let token: string | undefined = queryToken
  let publicKey: string | undefined = queryPublicKey ?? queryPublickey ?? queryPublicKeyHyphen

  token ??= headers.token
  publicKey ??= headers['public-key'] ?? headers.publickey

  if ((!token || !publicKey) && data.request?.url) {
    const url = new URL(data.request.url)

    token ??= url.searchParams.get('token') ?? undefined
    publicKey ??=
      url.searchParams.get('publicKey') ??
      url.searchParams.get('publickey') ??
      url.searchParams.get('public-key') ??
      undefined
  }

  const result = decodeConduitAuth({ publicKey, token })

  return Match.value(result).pipe(
    Match.when((r): r is MissingConduitAuthError => r instanceof MissingConduitAuthError, () => ({ publicKey, token })),
    Match.orElse((r) => r),
  )
}
