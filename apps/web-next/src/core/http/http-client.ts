import { queryOptions } from '@tanstack/react-query'
import ky from 'ky'

import type {
  CheckTokenResponse,
  ProtocolHealthResponse,
  RegisterConduitRequest,
  RegisterConduitResponse,
} from './rift-api-types'

function resolveHttpBaseUrl(): string {
  const configured = import.meta.env.VITE_RIFT_HTTP_BASE_URL
  if (configured) {
    return configured
  }

  return 'http://127.0.0.1:51001'
}

export const httpClient = ky.create({
  prefixUrl: resolveHttpBaseUrl(),
  timeout: 10_000,
  retry: {
    limit: 1,
    methods: ['get'],
    statusCodes: [408, 413, 429, 500, 502, 503, 504],
  },
})

export async function registerConduit(payload: RegisterConduitRequest): Promise<RegisterConduitResponse> {
  return httpClient
    .post('register', {
      json: payload,
    })
    .json<RegisterConduitResponse>()
}

export async function checkToken(token: string): Promise<CheckTokenResponse> {
  return httpClient
    .get('check', {
      searchParams: { token },
    })
    .json<CheckTokenResponse>()
}

export async function getProtocolHealth(): Promise<ProtocolHealthResponse> {
  return httpClient.get('health/protocol').json<ProtocolHealthResponse>()
}

export function protocolHealthQueryOptions() {
  return queryOptions({
    queryKey: ['protocol-health'] as const,
    queryFn: getProtocolHealth,
    refetchInterval: 60_000,
    retry: 0,
  })
}
