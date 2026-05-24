export function normalizeSeconds(seconds: number): number {
  return Math.max(0, Math.ceil(seconds))
}
