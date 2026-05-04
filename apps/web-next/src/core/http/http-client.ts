import ky, { HTTPError } from 'ky'

export type RegisterConduitRequest = {
  pubkey: string
}

export type RegisterConduitResponse = {
  ok: boolean
  token?: string
  error?: string
}

export type CheckTokenResponse = boolean

export type ProtocolHealthResponse = {
  riftOpcodesLoaded: boolean
}

const DEFAULT_HTTP_BASE_URL = 'http://localhost:51001'
const HTTP_TIMEOUT_MS = 10_000

function resolveHttpBaseUrl(): string {
  return import.meta.env.VITE_RIFT_HTTP_BASE_URL || DEFAULT_HTTP_BASE_URL
}

function createHttpError(message: string, cause?: unknown): Error {
  return new Error(message, { cause })
}

export const httpClient = ky.create({
  prefix: resolveHttpBaseUrl(),
  timeout: HTTP_TIMEOUT_MS,
  retry: {
    limit: 2,
    methods: ['get'],
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
  },
})

async function readJson<T>(request: Promise<unknown>, message: string): Promise<T> {
  try {
    return (await request) as T
  } catch (error) {
    if (error instanceof HTTPError) {
      throw createHttpError(`${message} (${error.response.status})`, error)
    }

    throw createHttpError(message, error)
  }
}

export async function registerConduit(payload: RegisterConduitRequest): Promise<RegisterConduitResponse> {
  return readJson<RegisterConduitResponse>(
    httpClient.post('register', { json: payload }).json<RegisterConduitResponse>(),
    'Failed to register conduit',
  )
}

export async function checkToken(token: string): Promise<CheckTokenResponse> {
  return readJson<CheckTokenResponse>(
    httpClient.get('check', { searchParams: { token } }).json<CheckTokenResponse>(),
    'Failed to check token',
  )
}

export async function getProtocolHealth(): Promise<ProtocolHealthResponse> {
  return readJson<ProtocolHealthResponse>(
    httpClient.get('health/protocol').json<ProtocolHealthResponse>(),
    'Failed to load protocol health',
  )
}
