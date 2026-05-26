import { unlinkSync } from 'node:fs'

export function createTempDbPath(prefix: string): string {
  return new URL(`../.${prefix}-${Date.now()}-${Math.random()}.db`, import.meta.url).pathname
}

export function cleanupDbFiles(files: string[]) {
  for (const file of files.splice(0, files.length)) {
    try {
      unlinkSync(file)
    } catch {
      // Ignore cleanup issues in test environments
    }
  }
}
