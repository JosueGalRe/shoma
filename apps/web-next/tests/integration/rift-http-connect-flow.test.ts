import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { unlinkSync } from 'node:fs'

import { startRuntime } from '../../../rift-next/src/index'
import type { checkToken, registerConduit } from '../../src/core/http/rift-api'

type RuntimeHandle = ReturnType<typeof startRuntime>

type RiftApiModule = {
  registerConduit: typeof registerConduit
  checkToken: typeof checkToken
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

let runtime: RuntimeHandle | null = null
let dbPath = ''
let riftApi: RiftApiModule | null = null

beforeAll(async () => {
  Bun.env.RIFT_JWT_SECRET = 'web-next-http-flow-secret'

  const randomPort = 57500 + Math.floor(Math.random() * 300)
  dbPath = new URL(`./.http-flow-${Date.now()}-${Math.random()}.db`, import.meta.url).pathname

  runtime = startRuntime({
    port: randomPort,
    databasePath: dbPath,
    keepAliveIntervalMs: 50,
  })

  Bun.env.VITE_RIFT_HTTP_BASE_URL = `http://127.0.0.1:${runtime.port}`
  riftApi = await import('../../src/core/http/rift-api')
})

afterAll(() => {
  runtime?.stop()
  Bun.env.VITE_RIFT_HTTP_BASE_URL = undefined

  try {
    unlinkSync(dbPath)
  } catch {
    // ignore test file cleanup issues
  }
})

describe('web-next rift HTTP connect flow', () => {
  it('registers and validates a token through web-next API client against live rift-next runtime', async () => {
    if (!runtime || !riftApi) {
      throw new Error('runtime not initialized')
    }

    const registerResponse = await riftApi.registerConduit({ pubkey: 'web-next-http-flow-pubkey' })
    expect(registerResponse.ok).toBe(true)
    expect(typeof registerResponse.token).toBe('string')

    if (!registerResponse.token) {
      throw new Error('Expected register token in response.')
    }

    const code = decodeCodeFromToken(registerResponse.token)
    expect(code).toHaveLength(6)

    const isValid = await riftApi.checkToken(registerResponse.token)
    expect(isValid).toBe(true)
  })

  it('returns false for malformed tokens in /check through the web-next API client', async () => {
    if (!riftApi) {
      throw new Error('riftApi not initialized')
    }

    const isValid = await riftApi.checkToken('not-a-jwt')
    expect(isValid).toBe(false)
  })
})
