import { readNumber, readObject, readString } from './base'

export type ReadyCheckSnapshot = {
  playerResponse?: string
  state?: string
  timer: number
}

export function parseReadyCheck(content: unknown): ReadyCheckSnapshot | null {
  const candidate = readObject(content)
  if (!candidate) {
    return null
  }

  const timer = readNumber(candidate.timer)
  if (timer === null) {
    return null
  }

  return {
    playerResponse: readString(candidate.playerResponse) ?? undefined,
    state: readString(candidate.state) ?? undefined,
    timer,
  }
}
