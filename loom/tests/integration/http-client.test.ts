import { afterAll, beforeAll, describe, expect, mock, test } from 'bun:test'

import type { CheckTokenResponse, ProtocolHealthResponse, RegisterConduitRequest, RegisterConduitResponse } from '../../src/core/http/http-client'

type HttpClientModule = {
  checkToken: (token: string) => Promise<CheckTokenResponse>
  getProtocolHealth: () => Promise<ProtocolHealthResponse>
  registerConduit: (payload: RegisterConduitRequest) => Promise<RegisterConduitResponse>
}

let server: Bun.Server<undefined> | null = null
let httpClient: HttpClientModule | null = null
const requests: Array<{ body: unknown; method: string; path: string; search: string }> = []

beforeAll(async () => {
  server = Bun.serve({
    port: 0,
    async fetch(request) {
      const url = new URL(request.url)
      const body = request.method === 'POST' ? ((await request.json()) as unknown) : null
      requests.push({ body, method: request.method, path: url.pathname, search: url.search })

      if (url.pathname === '/register') {
        return Response.json({ ok: true, token: 'registered-token' })
      }

      if (url.pathname === '/check') {
        return Response.json(url.searchParams.get('token') === 'registered-token')
      }

      if (url.pathname === '/health/protocol') {
        return Response.json({ riftOpcodesLoaded: true })
      }

      return Response.json({ error: 'not found' }, { status: 404 })
    },
  })

  const baseUrl = `http://127.0.0.1:${server.port}`

  mock.module('@/core/config/env-config', () => ({
    env: {
      VITE_RIFT_WS_BASE_URL: '',
      VITE_RIFT_HTTP_BASE_URL: baseUrl,
    },
  }))

  httpClient = await import('../../src/core/http/http-client')
})

afterAll(() => {
  void server?.stop(true)
  Bun.env.VITE_RIFT_HTTP_BASE_URL = undefined
})

describe('http-client', () => {
  test('registers conduit payloads', async () => {
    if (!httpClient) {
      throw new Error('http client was not initialized')
    }

    expect(await httpClient.registerConduit({ pubkey: 'pubkey' })).toEqual({ ok: true, token: 'registered-token' })
    expect(requests).toContainEqual({ body: { pubkey: 'pubkey' }, method: 'POST', path: '/register', search: '' })
  })

  test('checks tokens using query parameters', async () => {
    if (!httpClient) {
      throw new Error('http client was not initialized')
    }

    expect(await httpClient.checkToken('registered-token')).toBe(true)
    expect(await httpClient.checkToken('bad-token')).toBe(false)
    expect(requests.some((request) => request.path === '/check' && request.search === '?token=registered-token')).toBe(true)
  })

  test('loads protocol health', async () => {
    if (!httpClient) {
      throw new Error('http client was not initialized')
    }

    expect(await httpClient.getProtocolHealth()).toEqual({ riftOpcodesLoaded: true })
  })
})
