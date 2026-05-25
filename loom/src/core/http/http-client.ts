import ky, { HTTPError } from 'ky'
import { boolean, fallback, type GenericSchema, type InferOutput, object, optional, safeParse, string } from 'valibot'

import { env } from '@/core/config/env-config'

export interface RegisterConduitRequest {
  pubkey: string
}

export const RegisterConduitResponseSchema = object({
  error: fallback(optional(string()), undefined),
  ok: boolean(),
  token: fallback(optional(string()), undefined),
})

export const CheckTokenResponseSchema = boolean()

export const ProtocolHealthResponseSchema = object({
  relayOpcodesLoaded: boolean(),
})

export type RegisterConduitResponse = InferOutput<typeof RegisterConduitResponseSchema>
export type CheckTokenResponse = InferOutput<typeof CheckTokenResponseSchema>
export type ProtocolHealthResponse = InferOutput<typeof ProtocolHealthResponseSchema>

const DEFAULT_HTTP_BASE_URL = 'http://localhost:51001'
const HTTP_TIMEOUT_MS = 10_000

function resolveHttpBaseUrl(): string {
  return env.VITE_LEYLINE_HTTP_BASE_URL || DEFAULT_HTTP_BASE_URL
}

function createHttpError(message: string, cause?: unknown): Error {
  return new Error(message, { cause })
}

export const httpClient = ky.create({
  prefix: resolveHttpBaseUrl(),
  retry: {
    limit: 2,
    methods: ['get'],
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
  },
  timeout: HTTP_TIMEOUT_MS,
})

async function readJson<const TSchema extends GenericSchema>(
  request: Promise<unknown>,
  schema: TSchema,
  message: string,
): Promise<InferOutput<TSchema>> {
  try {
    const parsed = safeParse(schema, await request)

    if (!parsed.success) {
      throw createHttpError(message)
    }

    return parsed.output
  } catch (error) {
    if (error instanceof HTTPError) {
      throw createHttpError(`${message  } (${  error.response.status  })`, error)
    }

    throw error instanceof Error && error.message === message ? error : createHttpError(message, error)
  }
}

export async function registerConduit(payload: RegisterConduitRequest): Promise<RegisterConduitResponse> {
  return readJson(
    httpClient.post('register', { json: payload }).json<unknown>(),
    RegisterConduitResponseSchema,
    'Failed to register conduit',
  )
}

export async function checkToken(token: string): Promise<CheckTokenResponse> {
  return readJson(
    httpClient.get('check', { searchParams: { token } }).json<unknown>(),
    CheckTokenResponseSchema,
    'Failed to check token',
  )
}

export async function getProtocolHealth(): Promise<ProtocolHealthResponse> {
  return readJson(
    httpClient.get('health/protocol').json<unknown>(),
    ProtocolHealthResponseSchema,
    'Failed to load protocol health',
  )
}
