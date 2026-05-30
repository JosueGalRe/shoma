export type VersionBump = 'patch' | 'minor' | 'major'

export interface CommitInfo {
  sha: string
  subject: string
  body?: string
  files: string[]
}

export interface ChangelogGroups {
  added: CommitInfo[]
  fixed: CommitInfo[]
  changed: CommitInfo[]
  maintenance: CommitInfo[]
  other: CommitInfo[]
}

export interface FileUpdate {
  path: string
  update: (content: string) => string
}

interface Semver {
  major: number
  minor: number
  patch: number
}

interface LatestJsonPlatform {
  url?: unknown
  signature?: unknown
}

const semverPartPattern = String.raw`(0|[1-9]\d*)`
const conduitTagPattern = new RegExp(String.raw`^conduit-v${semverPartPattern}\.${semverPartPattern}\.${semverPartPattern}$`)
const semverPattern = new RegExp(String.raw`^${semverPartPattern}\.${semverPartPattern}\.${semverPartPattern}$`)
const releaseCommitPattern = /^chore\(conduit\): release v\d+\.\d+\.\d+$/

export class EmptyChangelogError extends Error {
  constructor() {
    super('No Conduit-related commits found for changelog')
    this.name = 'EmptyChangelogError'
  }
}

export function parseConduitTag(tag: string): { version: string } | null {
  const match = conduitTagPattern.exec(tag)

  if (match === null) {
    return null
  }

  return { version: `${Number(match[1])}.${Number(match[2])}.${Number(match[3])}` }
}

export function findLatestValidTag(tags: string[]): string | null {
  const validTags = tags
    .map((tag) => {
      return { parsed: parseConduitTag(tag), tag }
    })
    .filter((entry): entry is { parsed: { version: string }; tag: string } => {
      return entry.parsed !== null
    })
    .toSorted((left, right) => {
      return compareSemver(parseSemver(left.parsed.version), parseSemver(right.parsed.version))
    })

  return validTags.at(-1)?.tag ?? null
}

export function bumpVersion(version: string, bump: VersionBump): string {
  const parsed = parseSemver(version)

  if (bump === 'major') {
    return `${parsed.major + 1}.0.0`
  }

  if (bump === 'minor') {
    return `${parsed.major}.${parsed.minor + 1}.0`
  }

  return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`
}

export function filterConduitCommits(commits: CommitInfo[], sinceTag: string): CommitInfo[] {
  void sinceTag

  return commits.filter((commit) => {
    if (releaseCommitPattern.test(commit.subject)) {
      return false
    }

    return isConduitRelatedCommit(commit)
  })
}

export function groupChangelogCommits(commits: CommitInfo[]): ChangelogGroups {
  const groups = emptyGroups()

  for (const commit of commits) {
    const type = parseConventionalCommitType(commit.subject)

    if (type === 'feat') {
      groups.added.push(commit)
    } else if (type === 'fix') {
      groups.fixed.push(commit)
    } else if (type === 'perf' || type === 'refactor') {
      groups.changed.push(commit)
    } else if (type === 'docs' || type === 'test' || type === 'build' || type === 'ci' || type === 'chore') {
      groups.maintenance.push(commit)
    } else {
      groups.other.push(commit)
    }
  }

  return groups
}

export function generateChangelogEntry(version: string, date: string, groups: ChangelogGroups): string {
  if (isChangelogEmpty(groups)) {
    throw new EmptyChangelogError()
  }

  const sections = [
    formatChangelogSection('Added', groups.added),
    formatChangelogSection('Fixed', groups.fixed),
    formatChangelogSection('Changed', groups.changed),
    formatChangelogSection('Maintenance', groups.maintenance),
    formatChangelogSection('Other', groups.other),
  ].filter((section) => {
    return section.length > 0
  })

  return [`## [${version}] — ${date}`, ...sections].join('\n\n')
}

export function insertChangelogEntry(changelog: string, entry: string): string {
  const unreleasedHeading = '## [Unreleased]'
  const index = changelog.indexOf(unreleasedHeading)

  if (index === -1) {
    throw new Error('Could not find ## [Unreleased] heading in conduit/CHANGELOG.md')
  }

  const insertionPoint = index + unreleasedHeading.length
  const before = changelog.slice(0, insertionPoint)
  const after = changelog.slice(insertionPoint).replace(/^\n+/, '\n')

  return `${before}\n\n${entry}\n${after}`
}

export function planVersionFileUpdates(nextVersion: string): FileUpdate[] {
  return [
    {
      path: 'conduit/package.json',
      update: replaceFirstVersionJson(nextVersion),
    },
    {
      path: 'conduit/src-tauri/Cargo.toml',
      update: replaceCargoPackageVersion(nextVersion),
    },
    {
      path: 'conduit/src-tauri/tauri.conf.json',
      update: replaceFirstVersionJson(nextVersion),
    },
  ]
}

export function validateLatestJson(json: unknown, expectedVersion: string): { ok: boolean; errors: string[] } {
  const errors: string[] = []

  if (!isRecord(json)) {
    return { errors: ['latest.json must be an object'], ok: false }
  }

  if (json.version !== expectedVersion) {
    errors.push(`version must be ${expectedVersion}`)
  }

  if (!isRecord(json.platforms)) {
    errors.push('platforms must be an object')

    return { errors, ok: errors.length === 0 }
  }

  validatePlatform(json.platforms, 'darwin-aarch64', errors)

  const hasWindowsKey = isRecord(json.platforms['windows-x86_64']) || isRecord(json.platforms['windows-x86_64-nsis'])

  if (!hasWindowsKey) {
    errors.push('platforms.windows-x86_64 or platforms.windows-x86_64-nsis is required')
  } else {
    if (isRecord(json.platforms['windows-x86_64'])) {
      validatePlatform(json.platforms, 'windows-x86_64', errors)
    }

    if (isRecord(json.platforms['windows-x86_64-nsis'])) {
      validatePlatform(json.platforms, 'windows-x86_64-nsis', errors)
    }
  }

  return { errors, ok: errors.length === 0 }
}

function emptyGroups(): ChangelogGroups {
  return {
    added: [],
    changed: [],
    fixed: [],
    maintenance: [],
    other: [],
  }
}

function parseSemver(version: string): Semver {
  const match = semverPattern.exec(version)

  if (match === null) {
    throw new Error(`Invalid semver version: ${version}`)
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  }
}

function compareSemver(left: Semver, right: Semver): number {
  if (left.major !== right.major) {
    return left.major - right.major
  }

  if (left.minor !== right.minor) {
    return left.minor - right.minor
  }

  return left.patch - right.patch
}

function isConduitRelatedCommit(commit: CommitInfo): boolean {
  const lowerMessage = `${commit.subject}\n${commit.body ?? ''}`.toLowerCase()
  const touchesConduit = commit.files.some((file) => {
    return file.startsWith('conduit/')
  })
  const touchesProtocol = commit.files.some((file) => {
    return file.startsWith('packages/protocol-contract/')
  })

  return commit.files.some((file) => {
    if (file.startsWith('conduit/')) {
      return true
    }

    if (file === '.github/workflows/conduit.yml') {
      return true
    }

    if (file.startsWith('scripts/release-conduit.')) {
      return true
    }

    if (file.startsWith('.agents/skills/conduit-release/')) {
      return true
    }

    if (file === 'AGENTS.md') {
      return touchesConduit || lowerMessage.includes('conduit')
    }

    if (touchesProtocol && file.startsWith('packages/protocol-contract/')) {
      return touchesConduit || lowerMessage.includes('conduit')
    }

    return false
  })
}

function parseConventionalCommitType(subject: string): string | null {
  const match = /^(\w+)(?:\([^)]*\))?!?:/.exec(subject)

  return match?.[1] ?? null
}

function isChangelogEmpty(groups: ChangelogGroups): boolean {
  return (
    groups.added.length === 0 &&
    groups.fixed.length === 0 &&
    groups.changed.length === 0 &&
    groups.maintenance.length === 0 &&
    groups.other.length === 0
  )
}

function formatChangelogSection(heading: string, commits: CommitInfo[]): string {
  if (commits.length === 0) {
    return ''
  }

  const bullets = commits.map((commit) => {
    return `- ${commit.subject} (${commit.sha.slice(0, 7)})`
  })

  return [`### ${heading}`, ...bullets].join('\n')
}

function replaceFirstVersionJson(nextVersion: string): (content: string) => string {
  return (content: string): string => {
    const updated = content.replace(/"version":\s*"[^"]+"/, `"version": "${nextVersion}"`)

    if (updated === content) {
      throw new Error('Could not find JSON version field')
    }

    return updated
  }
}

function replaceCargoPackageVersion(nextVersion: string): (content: string) => string {
  return (content: string): string => {
    const updated = content.replace(/^(version\s*=\s*)"[^"]+"/m, `$1"${nextVersion}"`)

    if (updated === content) {
      throw new Error('Could not find Cargo package version field')
    }

    return updated
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function validatePlatform(platforms: Record<string, unknown>, platform: string, errors: string[]): void {
  const value = platforms[platform]

  if (!isRecord(value)) {
    errors.push(`platforms.${platform} is required`)

    return
  }

  const entry: LatestJsonPlatform = value

  if (typeof entry.url !== 'string' || entry.url.length === 0) {
    errors.push(`platforms.${platform}.url is required`)
  } else if (platform === 'darwin-aarch64' && !entry.url.endsWith('_aarch64.dmg')) {
    errors.push('platforms.darwin-aarch64.url must end with _aarch64.dmg')
  } else if ((platform === 'windows-x86_64' || platform === 'windows-x86_64-nsis') && !entry.url.endsWith('_x64-setup.exe')) {
    errors.push(`platforms.${platform}.url must end with _x64-setup.exe`)
  }

  if (typeof entry.signature !== 'string' || entry.signature.length === 0) {
    errors.push(`platforms.${platform}.signature is required`)
  }
}
