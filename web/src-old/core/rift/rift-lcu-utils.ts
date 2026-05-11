import { MobileOpcode } from '@mimic/protocol-contract'

export function parseMobileFrame(rawPayload: string): [number, ...unknown[]] | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(rawPayload)
  } catch {
    return null
  }

  if (!Array.isArray(parsed) || typeof parsed[0] !== 'number') {
    return null
  }

  return parsed as [number, ...unknown[]]
}

export function buildObservePattern(path: string): string {
  return `^${path}$`
}

export function frameIsUpdate(frame: [number, ...unknown[]]): frame is [typeof MobileOpcode.UPDATE, string, number, unknown] {
  return frame[0] === MobileOpcode.UPDATE && typeof frame[1] === 'string' && typeof frame[2] === 'number'
}

export function frameIsResponse(
  frame: [number, ...unknown[]],
): frame is [typeof MobileOpcode.RESPONSE, number, number, unknown] {
  return frame[0] === MobileOpcode.RESPONSE && typeof frame[1] === 'number' && typeof frame[2] === 'number'
}

export function frameIsVersionResponse(
  frame: [number, ...unknown[]],
): frame is [typeof MobileOpcode.VERSION_RESPONSE, string, string] {
  return frame[0] === MobileOpcode.VERSION_RESPONSE && typeof frame[1] === 'string' && typeof frame[2] === 'string'
}

export function safeRegexMatch(patternSource: string, value: string): boolean {
  try {
    return Boolean(new RegExp(patternSource).exec(value))
  } catch {
    return false
  }
}

export function formatSeconds(value: number): string {
  const minutes = Math.floor(value / 60)
  const seconds = Math.round(value) % 60
  return `${minutes}:${`00${seconds}`.slice(-2)}`
}
