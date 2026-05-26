import type { LcuHttpMethodValue } from '@shoma/protocol-contract'

export interface LiveClientResult {
  content: unknown
  status: number
}

export interface LiveClientTransportOptions {
  requestTimeoutMs?: number
}

export interface LiveClientTransport {
  close(): void
  request(path: string, method: LcuHttpMethodValue, body?: unknown): Promise<LiveClientResult>
}

export interface LiveClientTransportContextValue {
  transport: LiveClientTransport | null
}
