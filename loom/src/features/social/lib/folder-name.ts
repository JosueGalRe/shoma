export type FolderNameError = 'exists' | 'reserved'

export interface FolderNameRules {
  // The folders' names, General's among them
  taken: readonly string[]
  // The groups the client makes itself: Riot Mobile, Offline, Other Servers
  reserved: readonly string[]
}

// The client's check before it creates a folder, whatever the case: not a folder's name, nor a group it makes itself
export function validateFolderName(name: string, { reserved, taken }: FolderNameRules): FolderNameError | null {
  const upper = name.trim().toUpperCase()

  function matches(other: string) {
    return other.toUpperCase() === upper
  }

  if (taken.some(matches)) {
    return 'exists'
  }

  return reserved.some(matches) ? 'reserved' : null
}
