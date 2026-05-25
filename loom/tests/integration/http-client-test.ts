import { createServer, type Server, type IncomingMessage } from 'node:http'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'

import type {
  CheckTokenResponse,
  ProtocolHealthResponse,
  RegisterConduitRequest,
  RegisterConduitResponse,
} from '../../src/core/http/http-client'

type HttpClientModule = {
  checkToken: (token: string) => Promise<CheckTokenResponse>
  getProtocolHealth: () => Promise<ProtocolHealthResponse>
  registerConduit: (payload: RegisterConduitRequest) => Promise<RegisterConduitResponse>
}

let server: Server | null = null
let httpClient: HttpClientModule | null = null
let httpBaseUrl = ''
const requests: Array<{ body: unknown; method: string; path: string; search: string }> = []

const envMock = vi.hoisted(() => {return {
  env: {
    VITE_LEYLINE_HTTP_BASE_URL: '',
    VITE_LEYLINE_WS_BASE_URL: '',
  },
}})

vi.mock('@/core/config/env-config', () => {return envMock})

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []

  for await (const chunk of request) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }

  const rawBody = Buffer.concat(chunks).toString('utf8')
  return rawBody ? JSON.parse(rawBody) : null
}

beforeAll(async () => {
  server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1')
    const body = request.method === 'POST' ? await readJsonBody(request) : null
    requests.push({ body, method: request.method ?? 'GET', path: url.pathname, search: url.search })

    if (url.pathname === '/register') {
      response.writeHead(200, { 'content-type': 'application/json' })
      response.end(JSON.stringify({ ok: true, token: 'registered-token' }))
      return
    }

    if (url.pathname === '/check') {
      response.writeHead(200, { 'content-type': 'application/json' })
      response.end(JSON.stringify(url.searchParams.get('token') === 'registered-token'))
      return
    }

    if (url.pathname === '/health/protocol') {
      response.writeHead(200, { 'content-type': 'application/json' })
      response.end(JSON.stringify({ relayOpcodesLoaded: true }))
      return
    }

    response.writeHead(404, { 'content-type': 'application/json' })
    response.end(JSON.stringify({ error: 'not found' }))
  })

  const currentServer = server
  if (!currentServer) {
    throw new Error('Server failed to start')
  }

  await new Promise<void>((resolve) => {
    currentServer.listen(0, '127.0.0.1', resolve)
  })

  const address = currentServer.address()
  if (!address || typeof address === 'string') {
    throw new Error('Server failed to start')
  }

  httpBaseUrl = `http://127.0.0.1:${address.port}`

  envMock.env.VITE_LEYLINE_HTTP_BASE_URL = httpBaseUrl

  httpClient = await import('../../src/core/http/http-client')
})

afterAll(async () => {
  httpBaseUrl = ''

  if (!server) {
    return
  }

  const currentServer = server

  await new Promise<void>((resolve) => {
    currentServer.close(() => {
      resolve()
    })
  })
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
    expect(requests.some((request) => {return request.path === '/check' && request.search === '?token=registered-token'})).toBe(true)
  })

  test('loads protocol health', async () => {
    if (!httpClient) {
      throw new Error('http client was not initialized')
    }

    expect(await httpClient.getProtocolHealth()).toEqual({ relayOpcodesLoaded: true })
  })
})
