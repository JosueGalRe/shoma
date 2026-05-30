#!/usr/bin/env bun
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import {
  EmptyChangelogError,
  bumpVersion,
  filterConduitCommits,
  findLatestValidTag,
  generateChangelogEntry,
  groupChangelogCommits,
  insertChangelogEntry,
  parseConduitTag,
  planVersionFileUpdates,
  validateLatestJson,
  type CommitInfo,
  type VersionBump,
} from './release-conduit-utils.ts'

interface CommandResult {
  exitCode: number
  stderr: string
  stdout: string
}

interface RunOptions {
  cwd?: string
}

export interface ReleaseCliDeps {
  env: Record<string, string | undefined>
  exists: (path: string) => boolean
  readText: (path: string) => string
  run: (command: string, args: string[], options?: RunOptions) => CommandResult
  today: () => string
  writeText: (path: string, content: string) => void
}

interface ParsedArgs {
  bump: VersionBump
  dryRun: boolean
}

interface GitHubRunSummary {
  conclusion: string | null
  createdAt: string
  databaseId: number
  displayTitle: string
  event: string
  headBranch: string | null
  headSha: string
  status: string
}

interface GitHubJobSummary {
  conclusion: string | null
  name: string
  status: string
}

interface GitHubReleaseAsset {
  name: string
}

interface GitHubReleaseSummary {
  assets: GitHubReleaseAsset[]
  isDraft: boolean
  isPrerelease: boolean
  tagName: string
  url: string
}

interface ReleasePlan {
  changelogEntry: string
  latestTag: string
  nextTag: string
  nextVersion: string
  plannedFileChanges: string[]
  signingKeyPresent: boolean
}

class CliError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CliError'
  }
}

class ReleaseCommandError extends Error {
  readonly commandLabel: string
  readonly exitCode: number
  readonly stderr: string
  readonly stdout: string

  constructor(commandLabel: string, result: CommandResult) {
    super(`${commandLabel} failed with exit code ${result.exitCode}`)
    this.name = 'ReleaseCommandError'
    this.commandLabel = commandLabel
    this.exitCode = result.exitCode
    this.stderr = result.stderr
    this.stdout = result.stdout
  }
}

const usage = [
  'Usage: ./scripts/release-conduit.sh --bump patch|minor|major [--dry-run]',
  '',
  'Options:',
  '  --bump patch|minor|major  Calculate the next version from the latest conduit-v* tag',
  '  --dry-run                 Print the release plan without editing files, committing, tagging, pushing, or creating releases',
  '  --help                    Show this help',
].join('\n')

const localChecks = [
  'pnpm --filter @shoma/conduit typecheck',
  'pnpm --filter @shoma/conduit test',
  'pnpm --filter @shoma/conduit build:frontend',
  'cargo check --manifest-path conduit/src-tauri/Cargo.toml',
  'cargo test --manifest-path conduit/src-tauri/Cargo.toml',
]

const releaseSteps = (version: string): string[] => [
  `Update conduit/package.json to ${version}`,
  `Update conduit/src-tauri/Cargo.toml to ${version}`,
  `Update conduit/src-tauri/tauri.conf.json to ${version}`,
  `Insert generated changelog entry in conduit/CHANGELOG.md`,
  'Run pnpm exec vp fmt conduit/src-tauri/tauri.conf.json',
  'Run cargo update -w in conduit/src-tauri',
  ...localChecks.map((check) => `Run ${check}`),
  `Commit chore(conduit): release v${version}`,
  `Create annotated tag conduit-v${version}`,
  'Push origin main',
  `Push origin conduit-v${version}`,
]

const defaultDeps: ReleaseCliDeps = {
  env: process.env,
  exists: existsSync,
  readText: (path) => readFileSync(path, 'utf8'),
  run: (command, args, options) => {
    const result = spawnSync(command, args, { cwd: options?.cwd, encoding: 'utf8' })

    return {
      exitCode: result.status ?? 1,
      stderr: result.stderr,
      stdout: result.stdout,
    }
  },
  today: () => new Date().toISOString().slice(0, 10),
  writeText: (path, content) => {
    writeFileSync(path, content)
  },
}

export const parseReleaseArgs = (args: string[]): ParsedArgs | 'help' => {
  let bump: VersionBump | null = null
  let dryRun = false

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--help' || arg === '-h') {
      return 'help'
    }

    if (arg === '--dry-run') {
      dryRun = true
      continue
    }

    if (arg === '--bump') {
      const value = args[index + 1]

      if (value !== 'patch' && value !== 'minor' && value !== 'major') {
        throw new CliError('Expected --bump patch|minor|major')
      }

      bump = value
      index += 1
      continue
    }

    if (arg.startsWith('--bump=')) {
      const value = arg.slice('--bump='.length)

      if (value !== 'patch' && value !== 'minor' && value !== 'major') {
        throw new CliError('Expected --bump patch|minor|major')
      }

      bump = value
      continue
    }

    if (arg.startsWith('-')) {
      throw new CliError(`Unknown option: ${arg}`)
    }

    throw new CliError(`Explicit version arguments are unsupported; use --bump patch|minor|major instead of ${arg}`)
  }

  if (bump === null) {
    throw new CliError('Missing required --bump patch|minor|major')
  }

  return { bump, dryRun }
}

export const runReleaseCli = (args: string[], deps: ReleaseCliDeps = defaultDeps): number => {
  try {
    const parsed = parseReleaseArgs(args)

    if (parsed === 'help') {
      console.log(usage)
      return 0
    }

    const plan = createReleasePlan(parsed.bump, deps)

    if (parsed.dryRun) {
      printDryRun(plan)
    } else {
      executeRelease(plan, deps)
    }

    return 0
  } catch (error: unknown) {
    if (error instanceof ReleaseCommandError) {
      printReleaseCommandFailure(error, deps)
      return 1
    }

    const message = error instanceof Error ? error.message : String(error)
    console.error(`Error: ${message}`)
    return 1
  }
}

const createReleasePlan = (bump: VersionBump, deps: ReleaseCliDeps): ReleasePlan => {
  runRequired(deps, 'git', ['fetch', '--tags', 'origin'], 'git fetch --tags origin')
  ensureCurrentBranchMain(deps)
  ensureOriginRemote(deps)
  ensureMainUpToDate(deps)
  ensureCleanWorktree(deps)
  runRequired(deps, 'gh', ['auth', 'status'], 'gh auth status')

  const latestTag = findLatestValidTag(listLocalTags(deps))

  if (latestTag === null) {
    throw new CliError('No conduit-v* tags found; initial release path is not implemented.')
  }

  const latestVersion = parseConduitTag(latestTag)?.version

  if (latestVersion === undefined) {
    throw new CliError(`Latest tag ${latestTag} is not a valid conduit release tag`)
  }

  const nextVersion = bumpVersion(latestVersion, bump)
  const nextTag = `conduit-v${nextVersion}`

  ensureTargetTagAbsent(deps, nextTag)
  ensureWorkflow(deps)
  ensureUpdaterArtifacts(deps)

  const commits = readCommitsSince(deps, latestTag)
  const groups = groupChangelogCommits(filterConduitCommits(commits, latestTag))
  const changelogEntry = generateChangelogEntry(nextVersion, deps.today(), groups)

  return {
    changelogEntry,
    latestTag,
    nextTag,
    nextVersion,
    plannedFileChanges: planVersionFileUpdates(nextVersion).map((update) => update.path),
    signingKeyPresent: typeof deps.env.TAURI_SIGNING_PRIVATE_KEY === 'string' && deps.env.TAURI_SIGNING_PRIVATE_KEY.length > 0,
  }
}

const executeRelease = (plan: ReleasePlan, deps: ReleaseCliDeps): void => {
  applyVersionFileUpdates(plan.nextVersion, deps)
  deps.writeText('conduit/CHANGELOG.md', insertChangelogEntry(deps.readText('conduit/CHANGELOG.md'), plan.changelogEntry))

  runReleaseCommand(deps, 'pnpm', ['exec', 'vp', 'fmt', 'conduit/src-tauri/tauri.conf.json'], 'pnpm exec vp fmt conduit/src-tauri/tauri.conf.json')
  runReleaseCommand(deps, 'cargo', ['update', '-w'], 'cargo update -w', { cwd: 'conduit/src-tauri' })

  for (const check of releaseCheckCommands) {
    runReleaseCommand(deps, check.command, check.args, check.label)
  }

  runReleaseCommand(
    deps,
    'git',
    [
      'add',
      'conduit/package.json',
      'conduit/src-tauri/Cargo.toml',
      'conduit/src-tauri/tauri.conf.json',
      'conduit/CHANGELOG.md',
      'conduit/src-tauri/Cargo.lock',
    ],
    'git add release files',
  )
  runReleaseCommand(deps, 'git', ['commit', '-m', `chore(conduit): release v${plan.nextVersion}`], `git commit -m "chore(conduit): release v${plan.nextVersion}"`)
  runReleaseCommand(deps, 'git', ['tag', '-a', plan.nextTag, '-m', `Conduit v${plan.nextVersion}`], `git tag -a ${plan.nextTag} -m "Conduit v${plan.nextVersion}"`)
  runReleaseCommand(deps, 'git', ['push', 'origin', 'main'], 'git push origin main')
  runReleaseCommand(deps, 'git', ['push', 'origin', plan.nextTag], `git push origin ${plan.nextTag}`)
  verifyRelease(plan.nextTag, deps)
}

export const verifyRelease = (tag: string, deps: ReleaseCliDeps): void => {
  const version = parseConduitTag(tag)?.version

  if (version === undefined) {
    throw new CliError(`Release tag ${tag} is not a valid conduit release tag`)
  }

  const run = findReleaseRun(tag, deps)
  waitForReleaseJobs(run.databaseId, deps)
  verifyReleaseAssets(tag, version, deps)
}

const findReleaseRun = (tag: string, deps: ReleaseCliDeps): GitHubRunSummary => {
  const result = runRequired(
    deps,
    'gh',
    ['run', 'list', '--workflow', 'conduit.yml', '--json', 'databaseId,headBranch,headSha,event,status,conclusion,displayTitle,createdAt'],
    'gh run list --workflow conduit.yml',
  )
  const runs = parseGitHubRunSummaries(result.stdout)
  const run = runs.find((entry) => {
    return entry.event === 'push' && (entry.headBranch === tag || entry.displayTitle.includes(tag))
  })

  if (run === undefined) {
    throw new CliError(`Could not find tag-triggered conduit.yml run for ${tag}`)
  }

  console.log(`Found GitHub Actions run ${run.databaseId} for ${tag}`)
  return run
}

const waitForReleaseJobs = (runId: number, deps: ReleaseCliDeps): void => {
  for (let attempt = 1; attempt <= 60; attempt += 1) {
    const jobs = readReleaseJobs(runId, deps)
    const requiredJobs = selectRequiredReleaseJobs(jobs)
    const failedJobs = requiredJobs.filter((job) => {
      return job.conclusion !== null && job.conclusion !== 'success'
    })

    if (failedJobs.length > 0) {
      const failedLog = deps.run('gh', ['run', 'view', String(runId), '--log-failed'])
      const evidence = [failedLog.stdout.trim(), failedLog.stderr.trim()].filter((line) => {
        return line.length > 0
      }).join('\n')
      throw new CliError(`GitHub Actions release run ${runId} failed: ${failedJobs.map((job) => job.name).join(', ')}\nFailed log excerpt:\n${formatExcerpt(evidence)}`)
    }

    if (requiredJobs.every((job) => job.status === 'completed' && job.conclusion === 'success')) {
      console.log(`GitHub Actions release jobs passed for run ${runId}`)
      return
    }
  }

  throw new CliError(`Timed out waiting for GitHub Actions release jobs to complete`)
}

const readReleaseJobs = (runId: number, deps: ReleaseCliDeps): GitHubJobSummary[] => {
  const result = runRequired(deps, 'gh', ['run', 'view', String(runId), '--json', 'jobs'], `gh run view ${runId} --json jobs`)
  const parsed: unknown = JSON.parse(result.stdout)

  if (!isRecord(parsed) || !Array.isArray(parsed.jobs)) {
    throw new CliError(`gh run view ${runId} returned malformed jobs JSON`)
  }

  return parsed.jobs.map(parseGitHubJobSummary)
}

const selectRequiredReleaseJobs = (jobs: GitHubJobSummary[]): GitHubJobSummary[] => {
  const macJob = jobs.find((job) => /macos|darwin|apple|aarch64/i.test(job.name))
  const windowsJob = jobs.find((job) => /windows|x64|x86_64|nsis/i.test(job.name))

  if (macJob === undefined || windowsJob === undefined) {
    throw new CliError('GitHub Actions run must include macOS arm64 and Windows x64 release jobs')
  }

  return [macJob, windowsJob]
}

const verifyReleaseAssets = (tag: string, version: string, deps: ReleaseCliDeps): void => {
  const result = runRequired(
    deps,
    'gh',
    ['release', 'view', tag, '--json', 'tagName,isDraft,isPrerelease,assets,url'],
    `gh release view ${tag}` ,
  )
  const release = parseGitHubReleaseSummary(JSON.parse(result.stdout))

  if (release.tagName !== tag) {
    throw new CliError(`GitHub release tagName must be ${tag}`)
  }

  if (release.isDraft) {
    throw new CliError(`GitHub release ${tag} must not be a draft`)
  }

  if (release.isPrerelease) {
    throw new CliError(`GitHub release ${tag} must not be a prerelease`)
  }

  const assetNames = release.assets.map((asset) => asset.name)
  const missingSuffixes = ['_aarch64.dmg', '_aarch64.dmg.sig', '_x64-setup.exe', '_x64-setup.exe.sig', 'latest.json'].filter((suffix) => {
    return !assetNames.some((name) => name.endsWith(suffix))
  })

  if (missingSuffixes.length > 0) {
    throw new CliError(`GitHub release ${tag} is missing required assets: ${missingSuffixes.join(', ')}`)
  }

  const latestJsonDir = `/tmp/shoma-conduit-release-${version}`
  runReleaseCommand(
    deps,
    'gh',
    ['release', 'download', tag, '--pattern', 'latest.json', '--dir', latestJsonDir],
    `gh release download ${tag} --pattern latest.json`,
  )
  const latestJson: unknown = JSON.parse(deps.readText(`${latestJsonDir}/latest.json`))
  const validation = validateLatestJson(latestJson, version)

  if (!validation.ok) {
    throw new CliError(`latest.json validation failed: ${validation.errors.join('; ')}`)
  }

  console.log(`Verified GitHub release assets and latest.json for ${tag}: ${release.url}`)
}

const parseGitHubRunSummaries = (value: string): GitHubRunSummary[] => {
  const parsed: unknown = JSON.parse(value)

  if (!Array.isArray(parsed)) {
    throw new CliError('gh run list returned malformed JSON')
  }

  return parsed.map(parseGitHubRunSummary)
}

const parseGitHubRunSummary = (value: unknown): GitHubRunSummary => {
  if (!isRecord(value)) {
    throw new CliError('gh run list entry must be an object')
  }

  return {
    conclusion: readNullableString(value, 'conclusion'),
    createdAt: readString(value, 'createdAt'),
    databaseId: readNumber(value, 'databaseId'),
    displayTitle: readString(value, 'displayTitle'),
    event: readString(value, 'event'),
    headBranch: readNullableString(value, 'headBranch'),
    headSha: readString(value, 'headSha'),
    status: readString(value, 'status'),
  }
}

const parseGitHubJobSummary = (value: unknown): GitHubJobSummary => {
  if (!isRecord(value)) {
    throw new CliError('gh run view job entry must be an object')
  }

  return {
    conclusion: readNullableString(value, 'conclusion'),
    name: readString(value, 'name'),
    status: readString(value, 'status'),
  }
}

const parseGitHubReleaseSummary = (value: unknown): GitHubReleaseSummary => {
  if (!isRecord(value) || !Array.isArray(value.assets)) {
    throw new CliError('gh release view returned malformed JSON')
  }

  return {
    assets: value.assets.map(parseGitHubReleaseAsset),
    isDraft: readBoolean(value, 'isDraft'),
    isPrerelease: readBoolean(value, 'isPrerelease'),
    tagName: readString(value, 'tagName'),
    url: readString(value, 'url'),
  }
}

const parseGitHubReleaseAsset = (value: unknown): GitHubReleaseAsset => {
  if (!isRecord(value)) {
    throw new CliError('gh release asset entry must be an object')
  }

  return { name: readString(value, 'name') }
}

const readString = (record: Record<string, unknown>, key: string): string => {
  const value = record[key]

  if (typeof value !== 'string') {
    throw new CliError(`${key} must be a string`)
  }

  return value
}

const readNullableString = (record: Record<string, unknown>, key: string): string | null => {
  const value = record[key]

  if (value === null) {
    return null
  }

  if (typeof value !== 'string') {
    throw new CliError(`${key} must be a string or null`)
  }

  return value
}

const readNumber = (record: Record<string, unknown>, key: string): number => {
  const value = record[key]

  if (typeof value !== 'number') {
    throw new CliError(`${key} must be a number`)
  }

  return value
}

const readBoolean = (record: Record<string, unknown>, key: string): boolean => {
  const value = record[key]

  if (typeof value !== 'boolean') {
    throw new CliError(`${key} must be a boolean`)
  }

  return value
}

const applyVersionFileUpdates = (version: string, deps: ReleaseCliDeps): void => {
  for (const update of planVersionFileUpdates(version)) {
    deps.writeText(update.path, update.update(deps.readText(update.path)))
  }
}

const releaseCheckCommands = [
  { args: ['--filter', '@shoma/conduit', 'typecheck'], command: 'pnpm', label: 'pnpm --filter @shoma/conduit typecheck' },
  { args: ['--filter', '@shoma/conduit', 'test'], command: 'pnpm', label: 'pnpm --filter @shoma/conduit test' },
  { args: ['--filter', '@shoma/conduit', 'build:frontend'], command: 'pnpm', label: 'pnpm --filter @shoma/conduit build:frontend' },
  { args: ['check', '--manifest-path', 'conduit/src-tauri/Cargo.toml'], command: 'cargo', label: 'cargo check --manifest-path conduit/src-tauri/Cargo.toml' },
  { args: ['test', '--manifest-path', 'conduit/src-tauri/Cargo.toml'], command: 'cargo', label: 'cargo test --manifest-path conduit/src-tauri/Cargo.toml' },
]

const runReleaseCommand = (
  deps: ReleaseCliDeps,
  command: string,
  args: string[],
  label: string,
  options?: RunOptions,
): CommandResult => {
  const result = deps.run(command, args, options)

  if (result.exitCode !== 0) {
    throw new ReleaseCommandError(label, result)
  }

  return result
}

const printReleaseCommandFailure = (error: ReleaseCommandError, deps: ReleaseCliDeps): void => {
  console.error(`Error: ${error.commandLabel} failed with exit code ${error.exitCode}`)
  console.error(`stdout excerpt:\n${formatExcerpt(error.stdout)}`)
  console.error(`stderr excerpt:\n${formatExcerpt(error.stderr)}`)

  const status = deps.run('git', ['status', '--short'])
  const statusOutput = [status.stdout.trim(), status.stderr.trim()].filter((line) => line.length > 0).join('\n')
  console.error(`git status --short:\n${statusOutput.length > 0 ? statusOutput : '(clean)'}`)
}

const formatExcerpt = (output: string): string => {
  const trimmed = output.trim()

  if (trimmed.length === 0) {
    return '(empty)'
  }

  return trimmed.slice(0, 4000)
}

const runRequired = (deps: ReleaseCliDeps, command: string, args: string[], label: string, options?: RunOptions): CommandResult => {
  const result = deps.run(command, args, options)

  if (result.exitCode !== 0) {
    const details = [
      `command: ${label}`,
      `exit code: ${result.exitCode}`,
      result.stderr.trim().length > 0 ? `stderr:\n${result.stderr.trim()}` : '',
      result.stdout.trim().length > 0 ? `stdout:\n${result.stdout.trim()}` : '',
    ].filter((line) => line.length > 0).join('\n')

    throw new CliError(details)
  }

  return result
}

const ensureCurrentBranchMain = (deps: ReleaseCliDeps): void => {
  const branch = runRequired(deps, 'git', ['branch', '--show-current'], 'git branch --show-current').stdout.trim()

  if (branch !== 'main') {
    throw new CliError(`Current branch must be main; found ${branch || '(detached HEAD)'}`)
  }
}

const ensureOriginRemote = (deps: ReleaseCliDeps): void => {
  runRequired(deps, 'git', ['remote', 'get-url', 'origin'], 'git remote get-url origin')
}

const ensureMainUpToDate = (deps: ReleaseCliDeps): void => {
  const localMain = runRequired(deps, 'git', ['rev-parse', 'main'], 'git rev-parse main').stdout.trim()
  const originMain = runRequired(deps, 'git', ['rev-parse', 'origin/main'], 'git rev-parse origin/main').stdout.trim()

  if (localMain !== originMain) {
    throw new CliError(`Local main is not up to date with origin/main (${localMain} != ${originMain})`)
  }
}

const ensureCleanWorktree = (deps: ReleaseCliDeps): void => {
  const status = runRequired(deps, 'git', ['status', '--porcelain=v1'], 'git status --porcelain=v1').stdout.trim()

  if (status.length > 0) {
    throw new CliError(`Worktree must be clean before release:\n${status}`)
  }
}

const listLocalTags = (deps: ReleaseCliDeps): string[] =>
  runRequired(deps, 'git', ['tag', '--list', 'conduit-v*'], 'git tag --list conduit-v*')
    .stdout.split('\n')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)

const ensureTargetTagAbsent = (deps: ReleaseCliDeps, tag: string): void => {
  const localTag = deps.run('git', ['rev-parse', '--verify', '--quiet', `refs/tags/${tag}`])

  if (localTag.exitCode === 0) {
    throw new CliError(`Target tag ${tag} already exists locally`)
  }

  const remoteTag = deps.run('git', ['ls-remote', '--exit-code', '--tags', 'origin', `refs/tags/${tag}`])

  if (remoteTag.exitCode === 0) {
    throw new CliError(`Target tag ${tag} already exists on origin`)
  }
}

const ensureWorkflow = (deps: ReleaseCliDeps): void => {
  const path = '.github/workflows/conduit.yml'

  if (!deps.exists(path)) {
    throw new CliError(`${path} is required`)
  }

  const workflow = deps.readText(path)

  if (!workflow.includes("'conduit-v*'") && !workflow.includes('conduit-v*')) {
    throw new CliError(`${path} must trigger on conduit-v* tags`)
  }

  const releaseMatrix = workflow.match(/matrix:\n(?<matrix>[\s\S]*?)\n\s*steps:/)?.groups?.matrix ?? ''
  const includeEntries = releaseMatrix.match(/\n\s*- platform:/g) ?? []

  if (includeEntries.length !== 2) {
    throw new CliError('Conduit release matrix must contain only macOS arm64 and Windows x64 NSIS targets')
  }

  const hasMacArm64 = releaseMatrix.includes("platform: 'macos-latest'") && releaseMatrix.includes('--target aarch64-apple-darwin')
  const hasWindowsNsis =
    releaseMatrix.includes("platform: 'windows-latest'") &&
    releaseMatrix.includes('--target x86_64-pc-windows-msvc --bundles nsis')
  const forbiddenTarget = /ubuntu-latest|x86_64-apple-darwin|universal-apple-darwin|universal/.test(releaseMatrix)

  if (!hasMacArm64 || !hasWindowsNsis || forbiddenTarget) {
    throw new CliError('Conduit release matrix must be exactly macOS arm64 plus Windows x64 NSIS')
  }
}

const ensureUpdaterArtifacts = (deps: ReleaseCliDeps): void => {
  const path = 'conduit/src-tauri/tauri.conf.json'
  const tauriConfig: unknown = JSON.parse(deps.readText(path))

  if (!isRecord(tauriConfig) || !isRecord(tauriConfig.bundle) || tauriConfig.bundle.createUpdaterArtifacts !== true) {
    throw new CliError(`${path} must set bundle.createUpdaterArtifacts to true`)
  }
}

const readCommitsSince = (deps: ReleaseCliDeps, latestTag: string): CommitInfo[] => {
  const log = runRequired(
    deps,
    'git',
    ['log', `${latestTag}..HEAD`, '--format=%x1e%H%x1f%s%x1f%b', '--name-only'],
    `git log ${latestTag}..HEAD`,
  ).stdout
  const commits = log
    .split('\x1e')
    .map((record) => record.trim())
    .filter((record) => record.length > 0)
    .map(parseCommitRecord)

  if (commits.length === 0) {
    throw new EmptyChangelogError()
  }

  return commits
}

const parseCommitRecord = (record: string): CommitInfo => {
  const [header = '', ...rest] = record.split('\n')
  const [sha = '', subject = '', body = ''] = header.split('\x1f')
  const files = rest.map((line) => line.trim()).filter((line) => line.length > 0)

  return { body, files, sha, subject }
}

const printDryRun = (plan: ReleasePlan): void => {
  console.log(`Conduit release dry-run: ${plan.nextTag}`)
  console.log('')
  console.log('Version')
  console.log(`- Latest tag: ${plan.latestTag}`)
  console.log(`- Calculated version: ${plan.nextVersion}`)
  console.log(`- Target tag: ${plan.nextTag}`)
  console.log('')
  console.log('Changelog preview')
  console.log(plan.changelogEntry)
  console.log('')
  console.log('Planned file changes')
  for (const path of plan.plannedFileChanges) {
    console.log(`- ${path}: set version to ${plan.nextVersion}`)
  }
  console.log('- conduit/CHANGELOG.md: insert generated changelog entry')
  console.log('- conduit/src-tauri/Cargo.lock: update via cargo update -w during real release')
  console.log('')
  console.log('Local checks')
  for (const check of localChecks) {
    console.log(`- ${check}`)
  }
  console.log('')
  console.log('Signing')
  console.log(`- TAURI_SIGNING_PRIVATE_KEY: ${plan.signingKeyPresent ? 'present (value redacted)' : 'absent'}`)
  console.log('')
  console.log('Exact release steps')
  for (const step of releaseSteps(plan.nextVersion)) {
    console.log(`- ${step}`)
  }
  console.log('')
  console.log('Dry-run mode: no files edited, no cargo update, no commit, no tag, no push, no release created.')
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

if (import.meta.main) {
  process.exitCode = runReleaseCli(process.argv.slice(2))
}
