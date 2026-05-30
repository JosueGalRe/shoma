import { describe, expect, spyOn, test } from 'bun:test'
import { runReleaseCli, verifyRelease, type ReleaseCliDeps } from './release-conduit.ts'

import {
  bumpVersion,
  type CommitInfo,
  EmptyChangelogError,
  filterConduitCommits,
  findLatestValidTag,
  generateChangelogEntry,
  groupChangelogCommits,
  insertChangelogEntry,
  parseConduitTag,
  planVersionFileUpdates,
  validateLatestJson,
} from './release-conduit-utils.ts'

interface CommandCall {
  args: string[]
  command: string
  cwd?: string
}

interface FakeCliDeps {
  calls: CommandCall[]
  deps: ReleaseCliDeps
  events: string[]
  outputs: Map<string, { exitCode: number; stderr?: string; stdout?: string }>
  writes: Map<string, string>
}

const workflow = [
  'name: Build Conduit',
  'on:',
  '  push:',
  '    tags:',
  "      - 'conduit-v*'",
  'jobs:',
  '  release:',
  '    strategy:',
  '      matrix:',
  '        include:',
  "          - platform: 'macos-latest'",
  "            args: '--target aarch64-apple-darwin'",
  "          - platform: 'windows-latest'",
  "            args: '--target x86_64-pc-windows-msvc --bundles nsis'",
  '    steps:',
].join('\n')

const commandKey = (command: string, args: string[]): string => `${command} ${args.join(' ')}`


const successfulRunListJson = JSON.stringify([
  {
    conclusion: null,
    createdAt: '2026-05-30T00:00:00Z',
    databaseId: 12345,
    displayTitle: 'conduit-v0.1.17',
    event: 'push',
    headBranch: 'conduit-v0.1.17',
    headSha: 'abcdef1234567890',
    status: 'in_progress',
  },
])

const successfulJobsJson = JSON.stringify({
  jobs: [
    { conclusion: 'success', name: 'release (macos-latest, aarch64-apple-darwin)', status: 'completed' },
    { conclusion: 'success', name: 'release (windows-latest, x86_64-pc-windows-msvc)', status: 'completed' },
  ],
})

const releaseViewJson = JSON.stringify({
  assets: [
    { name: 'Shoma_0.1.17_aarch64.dmg' },
    { name: 'Shoma_0.1.17_aarch64.dmg.sig' },
    { name: 'Shoma_0.1.17_x64-setup.exe' },
    { name: 'Shoma_0.1.17_x64-setup.exe.sig' },
    { name: 'latest.json' },
  ],
  isDraft: false,
  isPrerelease: false,
  tagName: 'conduit-v0.1.17',
  url: 'https://github.com/JosueGalRe/shoma/releases/tag/conduit-v0.1.17',
})

const validLatestJson = JSON.stringify({
  platforms: {
    'darwin-aarch64': {
      signature: 'darwin-signature',
      url: 'https://github.com/JosueGalRe/shoma/releases/download/conduit-v0.1.17/Shoma_0.1.17_aarch64.dmg',
    },
    'windows-x86_64-nsis': {
      signature: 'windows-signature',
      url: 'https://github.com/JosueGalRe/shoma/releases/download/conduit-v0.1.17/Shoma_0.1.17_x64-setup.exe',
    },
  },
  version: '0.1.17',
})

const createFakeCliDeps = (overrides?: {
  env?: Record<string, string | undefined>
  outputs?: Record<string, { exitCode: number; stderr?: string; stdout?: string }>
}): FakeCliDeps => {
  const calls: CommandCall[] = []
  const events: string[] = []
  const writes = new Map<string, string>()
  const outputs = new Map<string, { exitCode: number; stderr?: string; stdout?: string }>([
    ['git fetch --tags origin', { exitCode: 0 }],
    ['git branch --show-current', { exitCode: 0, stdout: 'main\n' }],
    ['git remote get-url origin', { exitCode: 0, stdout: 'git@github.com:JosueGalRe/shoma.git\n' }],
    ['git rev-parse main', { exitCode: 0, stdout: 'abc123\n' }],
    ['git rev-parse origin/main', { exitCode: 0, stdout: 'abc123\n' }],
    ['git status --porcelain=v1', { exitCode: 0, stdout: '' }],
    ['gh auth status', { exitCode: 0, stdout: 'Logged in\n' }],
    ['git tag --list conduit-v*', { exitCode: 0, stdout: 'conduit-v0.1.15\nconduit-v0.1.16\n' }],
    ['git rev-parse --verify --quiet refs/tags/conduit-v0.1.17', { exitCode: 1 }],
    ['git rev-parse --verify --quiet refs/tags/conduit-v0.2.0', { exitCode: 1 }],
    ['git ls-remote --exit-code --tags origin refs/tags/conduit-v0.1.17', { exitCode: 2 }],
    ['git ls-remote --exit-code --tags origin refs/tags/conduit-v0.2.0', { exitCode: 2 }],
    [
      'git log conduit-v0.1.16..HEAD --format=%x1e%H%x1f%s%x1f%b --name-only',
      { exitCode: 0, stdout: '\x1eabcdef1234567890\x1ffeat(conduit): add release dry-run\x1f\nconduit/src/main.ts\n' },
    ],
    [
      'gh run list --workflow conduit.yml --json databaseId,headBranch,headSha,event,status,conclusion,displayTitle,createdAt',
      { exitCode: 0, stdout: successfulRunListJson },
    ],
    ['gh run view 12345 --json jobs', { exitCode: 0, stdout: successfulJobsJson }],
    ['gh release view conduit-v0.1.17 --json tagName,isDraft,isPrerelease,assets,url', { exitCode: 0, stdout: releaseViewJson }],
    ['gh release download conduit-v0.1.17 --pattern latest.json --dir /tmp/shoma-conduit-release-0.1.17', { exitCode: 0 }],
  ])

  for (const [key, value] of Object.entries(overrides?.outputs ?? {})) {
    outputs.set(key, value)
  }

  return {
    calls,
    deps: {
      env: overrides?.env ?? {},
      exists: (path) => path === '.github/workflows/conduit.yml',
      readText: (path) => {
        events.push(`read:${path}`)

        const written = writes.get(path)

        if (written !== undefined) {
          return written
        }

        if (path === '.github/workflows/conduit.yml') {
          return workflow
        }

        if (path === 'conduit/src-tauri/tauri.conf.json') {
          return '{\n  "version": "0.1.16",\n  "bundle": {\n    "createUpdaterArtifacts": true\n  }\n}\n'
        }

        if (path === 'conduit/package.json') {
          return '{\n  "name": "@shoma/conduit",\n  "version": "0.1.16"\n}\n'
        }

        if (path === 'conduit/src-tauri/Cargo.toml') {
          return '[package]\nname = "shoma"\nversion = "0.1.16"\n'
        }

        if (path === 'conduit/CHANGELOG.md') {
          return '# Changelog\n\n## [Unreleased]\n\n## [0.1.16] — 2026-05-29\n'
        }

        if (path === '/tmp/shoma-conduit-release-0.1.17/latest.json') {
          return validLatestJson
        }

        throw new Error(`Unexpected read: ${path}`)
      },
      run: (command, args, options) => {
        calls.push({ args, command, cwd: options?.cwd })
        events.push(`run:${commandKey(command, args)}${options?.cwd === undefined ? '' : ` cwd=${options.cwd}`}`)
        const output = outputs.get(commandKey(command, args))

        return {
          exitCode: output?.exitCode ?? 0,
          stderr: output?.stderr ?? '',
          stdout: output?.stdout ?? '',
        }
      },
      today: () => '2026-05-30',
      writeText: (path, content) => {
        events.push(`write:${path}`)
        writes.set(path, content)
      },
    },
    events,
    outputs,
    writes,
  }
}

const captureConsole = (): { errors: string[]; logs: string[]; restore: () => void } => {
  const logs: string[] = []
  const errors: string[] = []
  const logSpy = spyOn(console, 'log').mockImplementation((message?: unknown) => {
    logs.push(String(message ?? ''))
  })
  const errorSpy = spyOn(console, 'error').mockImplementation((message?: unknown) => {
    errors.push(String(message ?? ''))
  })

  return {
    errors,
    logs,
    restore: () => {
      logSpy.mockRestore()
      errorSpy.mockRestore()
    },
  }
}

function commit(overrides: Partial<CommitInfo>): CommitInfo {
  return {
    body: overrides.body,
    files: overrides.files ?? ['conduit/src/main.ts'],
    sha: overrides.sha ?? '1234567890abcdef',
    subject: overrides.subject ?? 'feat(conduit): add release automation',
  }
}

describe('tag parsing', () => {
  test('parses valid conduit semver tags', () => {
    expect(parseConduitTag('conduit-v0.1.16')).toEqual({ version: '0.1.16' })
    expect(parseConduitTag('conduit-v10.20.30')).toEqual({ version: '10.20.30' })
  })

  test('rejects malformed conduit tags', () => {
    expect(parseConduitTag('v0.1.16')).toBeNull()
    expect(parseConduitTag('conduit-0.1.16')).toBeNull()
    expect(parseConduitTag('conduit-v0.1')).toBeNull()
    expect(parseConduitTag('conduit-v0.1.16-beta.1')).toBeNull()
    expect(parseConduitTag('conduit-v01.1.1')).toBeNull()
  })

  test('returns latest valid tag by semver and ignores malformed tags', () => {
    expect(findLatestValidTag(['conduit-v0.1.9', 'not-conduit', 'conduit-v0.10.0', 'conduit-v0.2.0'])).toBe('conduit-v0.10.0')
  })

  test('returns null when no valid tags exist', () => {
    expect(findLatestValidTag([])).toBeNull()
    expect(findLatestValidTag(['conduit-v1.2', 'loom-v9.9.9'])).toBeNull()
  })
})

describe('version bumping', () => {
  test('bumps patch minor and major versions', () => {
    expect(bumpVersion('0.1.16', 'patch')).toBe('0.1.17')
    expect(bumpVersion('0.1.16', 'minor')).toBe('0.2.0')
    expect(bumpVersion('0.1.16', 'major')).toBe('1.0.0')
  })

  test('rejects malformed versions', () => {
    expect(() => {
      return bumpVersion('1.2', 'patch')
    }).toThrow('Invalid semver version: 1.2')

    expect(() => {
      return bumpVersion('01.2.3', 'patch')
    }).toThrow('Invalid semver version: 01.2.3')
  })
})

describe('commit filtering', () => {
  test('includes conduit release-related paths and excludes unrelated commits', () => {
    const commits = [
      commit({ files: ['conduit/src-tauri/src/main.rs'], sha: 'a111111' }),
      commit({ files: ['.github/workflows/conduit.yml'], sha: 'b222222', subject: 'ci(conduit): harden release workflow' }),
      commit({ files: ['scripts/release-conduit.test.ts'], sha: 'c333333', subject: 'test(conduit): cover release utils' }),
      commit({ files: ['.agents/skills/conduit-release/SKILL.md'], sha: 'd444444', subject: 'docs: document release skill' }),
      commit({
        files: ['AGENTS.md', '.agents/skills/conduit-release/SKILL.md'],
        sha: 'e555555',
        subject: 'docs: register release skill',
      }),
      commit({ files: ['loom/src/main.tsx'], sha: 'f666666', subject: 'feat(loom): update lobby' }),
    ]

    expect(
      filterConduitCommits(commits, 'conduit-v0.1.16').map((entry) => {
        return entry.sha
      }),
    ).toEqual(['a111111', 'b222222', 'c333333', 'd444444', 'e555555'])
  })

  test('applies protocol-contract inclusion rule', () => {
    const commits = [
      commit({
        files: ['packages/protocol-contract/src/index.ts'],
        sha: 'a111111',
        subject: 'feat(protocol): shared frame change',
      }),
      commit({
        files: ['packages/protocol-contract/src/index.ts'],
        sha: 'b222222',
        subject: 'feat(protocol): support conduit handshake',
      }),
      commit({
        files: ['packages/protocol-contract/src/index.ts', 'conduit/src-tauri/src/protocol.rs'],
        sha: 'c333333',
        subject: 'feat(protocol): shared payload',
      }),
      commit({
        body: 'Conduit needs this schema for updater traffic.',
        files: ['packages/protocol-contract/src/index.ts'],
        sha: 'd444444',
        subject: 'feat(protocol): shared payload',
      }),
    ]

    expect(
      filterConduitCommits(commits, 'conduit-v0.1.16').map((entry) => {
        return entry.sha
      }),
    ).toEqual(['b222222', 'c333333', 'd444444'])
  })

  test('excludes release commits', () => {
    const commits = [
      commit({ files: ['conduit/package.json'], sha: 'a111111', subject: 'chore(conduit): release v0.1.16' }),
      commit({ files: ['conduit/src/App.tsx'], sha: 'b222222', subject: 'fix(conduit): repair updater prompt' }),
    ]

    expect(
      filterConduitCommits(commits, 'conduit-v0.1.15').map((entry) => {
        return entry.sha
      }),
    ).toEqual(['b222222'])
  })
})

describe('changelog generation', () => {
  test('groups conventional commits into changelog sections', () => {
    const groups = groupChangelogCommits([
      commit({ sha: 'a1111111', subject: 'feat(conduit): add updater checks' }),
      commit({ sha: 'b2222222', subject: 'fix(conduit): keep prompt date valid' }),
      commit({ sha: 'c3333333', subject: 'perf(conduit): reduce reconnect churn' }),
      commit({ sha: 'd4444444', subject: 'docs(conduit): explain release flow' }),
      commit({ sha: 'e5555555', subject: 'ship conduit release helper' }),
    ])

    expect(groups.added).toHaveLength(1)
    expect(groups.fixed).toHaveLength(1)
    expect(groups.changed).toHaveLength(1)
    expect(groups.maintenance).toHaveLength(1)
    expect(groups.other).toHaveLength(1)
  })

  test('generates grouped changelog output with short SHA and subject', () => {
    const groups = groupChangelogCommits([
      commit({ sha: 'a111111999', subject: 'feat(conduit): add updater checks' }),
      commit({ sha: 'b222222999', subject: 'fix(conduit): keep prompt date valid' }),
    ])

    expect(generateChangelogEntry('0.1.17', '2026-05-30', groups)).toBe(
      [
        '## [0.1.17] — 2026-05-30',
        '### Added\n- feat(conduit): add updater checks (a111111)',
        '### Fixed\n- fix(conduit): keep prompt date valid (b222222)',
      ].join('\n\n'),
    )
  })

  test('empty changelog hard stop throws typed error', () => {
    expect(() => {
      return generateChangelogEntry('0.1.17', '2026-05-30', groupChangelogCommits([]))
    }).toThrow(EmptyChangelogError)
  })

  test('inserts changelog entry after Unreleased heading', () => {
    const changelog = '# Changelog\n\n## [Unreleased]\n\n## [0.1.16] — 2026-05-30\n'
    const entry = '## [0.1.17] — 2026-05-31\n\n### Fixed\n- fix(conduit): repair updater (abc1234)'

    expect(insertChangelogEntry(changelog, entry)).toBe(
      '# Changelog\n\n## [Unreleased]\n\n## [0.1.17] — 2026-05-31\n\n### Fixed\n- fix(conduit): repair updater (abc1234)\n\n## [0.1.16] — 2026-05-30\n',
    )
  })
})

describe('version update planning', () => {
  test('plans all three version file updates together', () => {
    expect(
      planVersionFileUpdates('0.1.17').map((update) => {
        return update.path
      }),
    ).toEqual(['conduit/package.json', 'conduit/src-tauri/Cargo.toml', 'conduit/src-tauri/tauri.conf.json'])
  })

  test('normalizes mismatched version files to next version', () => {
    const updates = planVersionFileUpdates('0.1.17')
    const byPath = new Map(
      updates.map((update) => {
        return [update.path, update.update]
      }),
    )

    expect(byPath.get('conduit/package.json')?.('{\n  "version": "0.1.15"\n}\n')).toBe('{\n  "version": "0.1.17"\n}\n')

    expect(byPath.get('conduit/src-tauri/Cargo.toml')?.('[package]\nversion = "0.1.14"\n')).toBe(
      '[package]\nversion = "0.1.17"\n',
    )

    expect(byPath.get('conduit/src-tauri/tauri.conf.json')?.('{\n  "version": "0.1.16"\n}\n')).toBe(
      '{\n  "version": "0.1.17"\n}\n',
    )
  })
})

describe('latest.json validation', () => {
  test('accepts valid darwin and windows updater entries', () => {
    expect(
      validateLatestJson(
        {
          platforms: {
            'darwin-aarch64': {
              signature: 'darwin-signature',
              url: 'https://github.com/JosueGalRe/shoma/releases/download/conduit-v0.1.17/Shoma_0.1.17_aarch64.dmg',
            },
            'windows-x86_64-nsis': {
              signature: 'windows-signature',
              url: 'https://github.com/JosueGalRe/shoma/releases/download/conduit-v0.1.17/Shoma_0.1.17_x64-setup.exe',
            },
          },
          version: '0.1.17',
        },
        '0.1.17',
      ),
    ).toEqual({ errors: [], ok: true })
  })

  test('reports missing signatures', () => {
    expect(
      validateLatestJson(
        {
          platforms: {
            'darwin-aarch64': { url: 'https://example.com/conduit.dmg' },
            'windows-x86_64': { signature: 'windows-signature', url: 'https://example.com/conduit.exe' },
          },
          version: '0.1.17',
        },
        '0.1.17',
      ),
    ).toEqual({ errors: ['platforms.darwin-aarch64.signature is required'], ok: false })
  })

  test('reports wrong version', () => {
    expect(
      validateLatestJson(
        {
          platforms: {
            'darwin-aarch64': { signature: 'darwin-signature', url: 'https://example.com/conduit.dmg' },
            'windows-x86_64': { signature: 'windows-signature', url: 'https://example.com/conduit.exe' },
          },
          version: '0.1.16',
        },
        '0.1.17',
      ),
    ).toEqual({ errors: ['version must be 0.1.17'], ok: false })
  })
})

describe('release CLI dry-run', () => {
  test('rejects positional version arguments and points to --bump', () => {
    const fake = createFakeCliDeps()
    const consoleCapture = captureConsole()

    try {
      expect(runReleaseCli(['0.1.17', '--dry-run'], fake.deps)).toBe(1)
      expect(consoleCapture.errors.join('\n')).toContain('use --bump patch|minor|major')
      expect(fake.calls).toEqual([])
    } finally {
      consoleCapture.restore()
    }
  })

  test('dry-run leaves worktree clean and does not run mutation commands', () => {
    const fake = createFakeCliDeps()
    const consoleCapture = captureConsole()

    try {
      expect(runReleaseCli(['--bump', 'patch', '--dry-run'], fake.deps)).toBe(0)
      expect(fake.outputs.get('git status --porcelain=v1')?.stdout).toBe('')
      expect(fake.calls.map((call) => commandKey(call.command, call.args))).not.toContain('cargo update -w')
      expect(fake.calls.map((call) => call.command)).not.toContain('git commit')
      expect(fake.calls.map((call) => call.command)).not.toContain('git tag')
      expect(fake.calls.map((call) => call.command)).not.toContain('git push')
      expect(consoleCapture.logs.join('\n')).toContain('Dry-run mode: no files edited')
    } finally {
      consoleCapture.restore()
    }
  })

  test('dirty worktree hard-stops with dirty file evidence', () => {
    const fake = createFakeCliDeps({
      outputs: {
        'git status --porcelain=v1': { exitCode: 0, stdout: ' M scripts/release-conduit.ts\n?? scratch.txt\n' },
      },
    })
    const consoleCapture = captureConsole()

    try {
      expect(runReleaseCli(['--bump', 'patch', '--dry-run'], fake.deps)).toBe(1)
      expect(consoleCapture.errors.join('\n')).toContain('Worktree must be clean before release')
      expect(consoleCapture.errors.join('\n')).toContain('scripts/release-conduit.ts')
      expect(consoleCapture.errors.join('\n')).toContain('scratch.txt')
      expect(fake.calls.map((call) => commandKey(call.command, call.args))).not.toContain('gh auth status')
    } finally {
      consoleCapture.restore()
    }
  })

  test('preflight output includes required dry-run sections', () => {
    const fake = createFakeCliDeps()
    const consoleCapture = captureConsole()

    try {
      expect(runReleaseCli(['--bump', 'patch', '--dry-run'], fake.deps)).toBe(0)
      const output = consoleCapture.logs.join('\n')

      expect(output).toContain('Version')
      expect(output).toContain('Latest tag: conduit-v0.1.16')
      expect(output).toContain('Calculated version: 0.1.17')
      expect(output).toContain('Changelog preview')
      expect(output).toContain('Planned file changes')
      expect(output).toContain('Local checks')
      expect(output).toContain('Signing')
      expect(output).toContain('Exact release steps')
    } finally {
      consoleCapture.restore()
    }
  })

  test('signing detection redacts secrets', () => {
    const fake = createFakeCliDeps({ env: { TAURI_SIGNING_PRIVATE_KEY: 'super-secret-private-key' } })
    const consoleCapture = captureConsole()

    try {
      expect(runReleaseCli(['--bump', 'patch', '--dry-run'], fake.deps)).toBe(0)
      const output = consoleCapture.logs.join('\n')

      expect(output).toContain('TAURI_SIGNING_PRIVATE_KEY: present (value redacted)')
      expect(output).not.toContain('super-secret-private-key')
    } finally {
      consoleCapture.restore()
    }
  })
})


describe('release verification', () => {
  test('verifies successful Actions run, release assets, and latest.json', () => {
    const fake = createFakeCliDeps()
    const consoleCapture = captureConsole()

    try {
      verifyRelease('conduit-v0.1.17', fake.deps)
      const commands = fake.calls.map((call) => {
        return commandKey(call.command, call.args)
      })

      expect(commands).toEqual([
        'gh run list --workflow conduit.yml --json databaseId,headBranch,headSha,event,status,conclusion,displayTitle,createdAt',
        'gh run view 12345 --json jobs',
        'gh release view conduit-v0.1.17 --json tagName,isDraft,isPrerelease,assets,url',
        'gh release download conduit-v0.1.17 --pattern latest.json --dir /tmp/shoma-conduit-release-0.1.17',
      ])
      expect(consoleCapture.logs.join('\n')).toContain('Verified GitHub release assets and latest.json for conduit-v0.1.17')
    } finally {
      consoleCapture.restore()
    }
  })

  test('collects failed Actions log evidence', () => {
    const fake = createFakeCliDeps({
      outputs: {
        'gh run view 12345 --json jobs': {
          exitCode: 0,
          stdout: JSON.stringify({
            jobs: [
              { conclusion: 'failure', name: 'release (macos-latest, aarch64-apple-darwin)', status: 'completed' },
              { conclusion: 'success', name: 'release (windows-latest, x86_64-pc-windows-msvc)', status: 'completed' },
            ],
          }),
        },
        'gh run view 12345 --log-failed': { exitCode: 0, stdout: 'macOS signer failed\nstack trace line\n' },
      },
    })
    const consoleCapture = captureConsole()

    try {
      expect(runReleaseCli(['--bump', 'patch'], fake.deps)).toBe(1)
      const errors = consoleCapture.errors.join('\n')

      expect(errors).toContain('GitHub Actions release run 12345 failed')
      expect(errors).toContain('Failed log excerpt:')
      expect(errors).toContain('macOS signer failed')
      expect(fake.calls.map((call) => commandKey(call.command, call.args))).toContain('gh run view 12345 --log-failed')
    } finally {
      consoleCapture.restore()
    }
  })

  test('rejects broken latest.json after download', () => {
    const fake = createFakeCliDeps()
    const originalReadText = fake.deps.readText
    fake.deps.readText = (path) => {
      if (path === '/tmp/shoma-conduit-release-0.1.17/latest.json') {
        return JSON.stringify({
          platforms: {
            'darwin-aarch64': { signature: 'darwin-signature', url: 'https://example.com/conduit.dmg' },
          },
          version: '0.1.16',
        })
      }

      return originalReadText(path)
    }
    const consoleCapture = captureConsole()

    try {
      expect(runReleaseCli(['--bump', 'patch'], fake.deps)).toBe(1)
      const errors = consoleCapture.errors.join('\n')

      expect(errors).toContain('latest.json validation failed')
      expect(errors).toContain('version must be 0.1.17')
      expect(errors).toContain('platforms.windows-x86_64 or platforms.windows-x86_64-nsis is required')
    } finally {
      consoleCapture.restore()
    }
  })
})

describe('release CLI real mode', () => {
  test('runs version writes, changelog insertion, checks, commit, tag, and pushes in order', () => {
    const fake = createFakeCliDeps()
    const consoleCapture = captureConsole()

    try {
      expect(runReleaseCli(['--bump', 'patch'], fake.deps)).toBe(0)

      const mutationEvents = fake.events
        .filter((event) => {
          return event.startsWith('write:') || event.startsWith('run:pnpm exec') || event.startsWith('run:cargo update') || event.startsWith('run:pnpm --filter') || event.startsWith('run:cargo check') || event.startsWith('run:cargo test') || event.startsWith('run:git add') || event.startsWith('run:git commit') || event.startsWith('run:git tag') || event.startsWith('run:git push') || event.startsWith('run:gh release download')
        })

      expect(mutationEvents).toEqual([
        'run:git tag --list conduit-v*',
        'write:conduit/package.json',
        'write:conduit/src-tauri/Cargo.toml',
        'write:conduit/src-tauri/tauri.conf.json',
        'write:conduit/CHANGELOG.md',
        'run:pnpm exec vp fmt conduit/src-tauri/tauri.conf.json',
        'run:cargo update -w cwd=conduit/src-tauri',
        'run:pnpm --filter @shoma/conduit typecheck',
        'run:pnpm --filter @shoma/conduit test',
        'run:pnpm --filter @shoma/conduit build:frontend',
        'run:cargo check --manifest-path conduit/src-tauri/Cargo.toml',
        'run:cargo test --manifest-path conduit/src-tauri/Cargo.toml',
        'run:git add conduit/package.json conduit/src-tauri/Cargo.toml conduit/src-tauri/tauri.conf.json conduit/CHANGELOG.md conduit/src-tauri/Cargo.lock',
        'run:git commit -m chore(conduit): release v0.1.17',
        'run:git tag -a conduit-v0.1.17 -m Conduit v0.1.17',
        'run:git push origin main',
        'run:git push origin conduit-v0.1.17',
        'run:gh release download conduit-v0.1.17 --pattern latest.json --dir /tmp/shoma-conduit-release-0.1.17',
      ])
      expect(fake.writes.get('conduit/package.json')).toContain('"version": "0.1.17"')
      expect(fake.writes.get('conduit/src-tauri/Cargo.toml')).toContain('version = "0.1.17"')
      expect(fake.writes.get('conduit/src-tauri/tauri.conf.json')).toContain('"version": "0.1.17"')
      expect(fake.writes.get('conduit/CHANGELOG.md')).toContain('## [0.1.17] — 2026-05-30')
    } finally {
      consoleCapture.restore()
    }
  })

  test('stops on first failed strict check before commit tag or push', () => {
    const fake = createFakeCliDeps({
      outputs: {
        'pnpm --filter @shoma/conduit build:frontend': { exitCode: 1, stderr: 'frontend build failed\n' },
      },
    })
    const consoleCapture = captureConsole()

    try {
      expect(runReleaseCli(['--bump', 'patch'], fake.deps)).toBe(1)
      const commands = fake.calls.map((call) => {
        return commandKey(call.command, call.args)
      })

      expect(consoleCapture.errors.join('\n')).toContain('Error: pnpm --filter @shoma/conduit build:frontend failed with exit code 1')
      expect(consoleCapture.errors.join('\n')).toContain('stdout excerpt:\n(empty)')
      expect(consoleCapture.errors.join('\n')).toContain('stderr excerpt:\nfrontend build failed')
      expect(consoleCapture.errors.join('\n')).toContain('git status --short:')
      expect(commands).toContain('pnpm --filter @shoma/conduit typecheck')
      expect(commands).toContain('pnpm --filter @shoma/conduit test')
      expect(commands).toContain('pnpm --filter @shoma/conduit build:frontend')
      expect(commands).not.toContain('cargo check --manifest-path conduit/src-tauri/Cargo.toml')
      expect(commands).not.toContain('git add -A')
      expect(commands).not.toContain('git commit -m chore(conduit): release v0.1.17')
      expect(commands).not.toContain('git tag -a conduit-v0.1.17 -m Conduit v0.1.17')
      expect(commands).not.toContain('git push origin main')
      expect(commands).not.toContain('git push origin conduit-v0.1.17')
    } finally {
      consoleCapture.restore()
    }
  })

  test('hard-stops when target tag already exists before any mutation', () => {
    const fake = createFakeCliDeps({
      outputs: {
        'git rev-parse --verify --quiet refs/tags/conduit-v0.1.17': { exitCode: 0, stdout: 'existing-tag\n' },
      },
    })
    const consoleCapture = captureConsole()

    try {
      expect(runReleaseCli(['--bump', 'patch'], fake.deps)).toBe(1)
      const commands = fake.calls.map((call) => {
        return commandKey(call.command, call.args)
      })

      expect(consoleCapture.errors.join('\n')).toContain('Target tag conduit-v0.1.17 already exists locally')
      expect(fake.writes.size).toBe(0)
      expect(commands).not.toContain('git log conduit-v0.1.16..HEAD --format=%x1e%H%x1f%s%x1f%b --name-only')
      expect(commands).not.toContain('pnpm exec vp fmt conduit/src-tauri/tauri.conf.json')
      expect(commands).not.toContain('cargo update -w')
      expect(commands).not.toContain('git commit -m chore(conduit): release v0.1.17')
      expect(commands).not.toContain('git tag -a conduit-v0.1.17 -m Conduit v0.1.17')
      expect(commands).not.toContain('git push origin main')
      expect(commands).not.toContain('git push origin conduit-v0.1.17')
    } finally {
      consoleCapture.restore()
    }
  })
})
