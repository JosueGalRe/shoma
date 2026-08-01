export function readElapsedSeconds(startTime: number | null): number {
  if (startTime === null) {
    return 0
  }

  return Math.max(0, Math.floor((Date.now() - startTime) / 1000))
}
