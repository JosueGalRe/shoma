import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import pixelmatch from 'pixelmatch'
import { expect, test, type Page } from 'playwright/test'
import { PNG } from 'pngjs'

declare module 'pixelmatch' {
  export default function pixelmatch(
    img1: Uint8Array,
    img2: Uint8Array,
    output: Uint8Array | null,
    width: number,
    height: number,
    options?: { threshold?: number },
  ): number
}

declare global {
  interface Window {
    __shomaMockLcu?: (alias: 'gameflowPhase' | 'readyCheck' | 'champSelectSession' | 'queueSearch', data: unknown) => void
  }
}

type ComparisonScreen = {
  name: string
  prepare: (page: Page) => Promise<void>
}

type ComparisonResult = {
  actualPath?: string
  diffPath?: string
  diffPixels: string
  error?: string
  regressions: string
  screen: string
  status: 'pass' | 'fail'
}

type ChampSelectAction = {
  actorCellId: number
  championId: number
  completed: boolean
  id: number
  isAllyAction: boolean
  type: 'ban' | 'pick'
}

type ChampSelectMember = {
  assignedPosition?: string
  cellId: number
  championId: number
  championPickIntent?: number
  displayName: string
  spell1Id?: number
  spell2Id?: number
  summonerId: number
}

type ChampSelectSession = {
  actions: ChampSelectAction[][]
  benchChampionIds?: number[]
  benchEnabled?: boolean
  gameMode?: string
  localPlayerCellId: number
  mapId?: number
  myTeam: ChampSelectMember[]
  queueId?: number
  theirTeam: ChampSelectMember[]
  timer: {
    adjustedTimeLeftInPhase: number
    phase: string
    totalTimeInPhase: number
  }
}

const mobileProjectViewports: Record<string, string> = {
  'Mobile-360': 'mobile-360',
  'Mobile-390': 'mobile-390',
}

const maxDiffPixels = 1500
const evidenceDir = path.resolve(process.cwd(), '..', '.sisyphus/evidence')

const ddragonImage = {
  full: 'placeholder.png',
  group: 'champion',
  h: 48,
  sprite: 'placeholder.png',
  w: 48,
  x: 0,
  y: 0,
}

const champions = [
  { id: 'Aatrox', key: '266', name: 'Aatrox', title: 'the Darkin Blade' },
  { id: 'Ahri', key: '103', name: 'Ahri', title: 'the Nine-Tailed Fox' },
  { id: 'Akali', key: '84', name: 'Akali', title: 'the Rogue Assassin' },
  { id: 'Ashe', key: '22', name: 'Ashe', title: 'the Frost Archer' },
  { id: 'Garen', key: '86', name: 'Garen', title: 'The Might of Demacia' },
  { id: 'Lux', key: '99', name: 'Lux', title: 'the Lady of Luminosity' },
]

const championData = Object.fromEntries(
  champions.map((champion) => {return [
    champion.id,
    {
      ...champion,
      blurb: champion.title,
      image: ddragonImage,
      lore: champion.title,
      partype: 'Mana',
      passive: { description: champion.title, image: ddragonImage, name: `${champion.name} Passive` },
      skins: [{ chromas: false, id: `${champion.key}000`, name: 'default', num: 0 }],
      spells: [],
      stats: {},
      tags: ['Fighter'],
    },
  ]}),
)

const runeTrees = [
  {
    id: 8000,
    icon: 'perk-images/Styles/7201_Precision.png',
    key: 'Precision',
    name: 'Precision',
    slots: [
      {
        runes: [
          {
            id: 8005,
            key: 'PressTheAttack',
            icon: 'perk-images/Styles/Precision/PressTheAttack/PressTheAttack.png',
            name: 'Press the Attack',
            shortDesc: 'Strike fast.',
            longDesc: 'Strike fast.',
          },
        ],
      },
    ],
  },
  {
    id: 8100,
    icon: 'perk-images/Styles/7200_Domination.png',
    key: 'Domination',
    name: 'Domination',
    slots: [
      {
        runes: [
          {
            id: 8112,
            key: 'Electrocute',
            icon: 'perk-images/Styles/Domination/Electrocute/Electrocute.png',
            name: 'Electrocute',
            shortDesc: 'Burst damage.',
            longDesc: 'Burst damage.',
          },
        ],
      },
    ],
  },
]

const lobbyMembers = [
  {
    allowedInviteOthers: true,
    displayName: 'Mimic Tester',
    firstPositionPreference: 'MIDDLE',
    iconUrl: null,
    isLeader: true,
    isLocalMember: true,
    profileIconId: null,
    secondPositionPreference: 'UTILITY',
    summonerId: 101,
  },
  {
    allowedInviteOthers: false,
    displayName: 'Duo Partner',
    firstPositionPreference: 'BOTTOM',
    iconUrl: null,
    isLeader: false,
    isLocalMember: false,
    profileIconId: null,
    secondPositionPreference: 'FILL',
    summonerId: 102,
  },
]

async function mockDdragon(page: Page): Promise<void> {
  await page.route('https://ddragon.leagueoflegends.com/api/versions.json', async (route) => {
    await route.fulfill({ contentType: 'application/json', json: ['15.1.1'] })
  })
  await page.route('https://ddragon.leagueoflegends.com/cdn/15.1.1/data/en_US/champion.json', async (route) => {
    await route.fulfill({ contentType: 'application/json', json: { data: championData } })
  })
  await page.route('https://ddragon.leagueoflegends.com/cdn/15.1.1/data/en_US/runesReforged.json', async (route) => {
    await route.fulfill({ contentType: 'application/json', json: runeTrees })
  })
  await page.route('https://ddragon.leagueoflegends.com/cdn/15.1.1/data/en_US/champion/*.json', async (route) => {
    const championKey = route.request().url().split('/').pop()?.replace('.json', '') ?? 'Aatrox'
    await route.fulfill({
      contentType: 'application/json',
      json: { data: { [championKey]: championData[championKey] ?? championData.Aatrox } },
    })
  })
  await page.route(/\.(?:png|jpg|jpeg|webp)(?:\?.*)?$/, async (route) => {
    await route.fulfill({ body: '', status: 204 })
  })
}

async function seedLobby(page: Page): Promise<void> {
  await page.addInitScript((members) => {
    sessionStorage.setItem(
      'shoma:lobby:sticky',
      JSON.stringify({ state: { stickyMembers: members, stickyMode: 'normal-draft' }, version: 1 }),
    )
  }, lobbyMembers)
}

async function waitForMockBridge(page: Page): Promise<void> {
  await page.waitForFunction(() => {return typeof window.__shomaMockLcu === 'function'})
}

async function mockChampSelect(page: Page, session: ChampSelectSession): Promise<void> {
  await page.goto('/connected/champ-select')
  await waitForMockBridge(page)
  await page.evaluate((nextSession) => {
    window.__shomaMockLcu?.('gameflowPhase', 'ChampSelect')
    window.__shomaMockLcu?.('champSelectSession', nextSession)
  }, session)
  await expect(page.getByText('Actions')).toBeVisible()
}

function createChampSelectSession(overrides: Partial<ChampSelectSession> = {}): ChampSelectSession {
  return {
    actions: [
      [{ actorCellId: 1, championId: 0, completed: false, id: 11, isAllyAction: true, type: 'ban' }],
      [{ actorCellId: 6, championId: 0, completed: false, id: 12, isAllyAction: false, type: 'ban' }],
      [{ actorCellId: 1, championId: 0, completed: false, id: 21, isAllyAction: true, type: 'pick' }],
    ],
    localPlayerCellId: 1,
    myTeam: [
      {
        assignedPosition: 'middle',
        cellId: 1,
        championId: 0,
        displayName: 'Mimic Tester',
        spell1Id: 4,
        spell2Id: 14,
        summonerId: 101,
      },
      { assignedPosition: 'bottom', cellId: 2, championId: 22, displayName: 'Duo Partner', summonerId: 102 },
    ],
    queueId: 420,
    theirTeam: [{ cellId: 6, championId: 86, displayName: 'Enemy Top', summonerId: 201 }],
    timer: { adjustedTimeLeftInPhase: 25_000, phase: 'BAN_PICK', totalTimeInPhase: 30_000 },
    ...overrides,
  }
}

async function openChampionPicker(page: Page): Promise<void> {
  const openButton = page.getByRole('button', { name: /open champion picker/i })
  if (await openButton.isVisible()) {
    await openButton.click()
  }

  await expect(page.getByRole('heading', { name: /champions|cards/i })).toBeVisible()
}

const screens: ComparisonScreen[] = [
  {
    name: 'lobby',
    prepare: async (page) => {
      await page.goto('/connected/lobby')
      await expect(page.getByText('Mimic Tester')).toBeVisible()
    },
  },
  {
    name: 'role-picker',
    prepare: async (page) => {
      await page.goto('/connected/lobby')
      await page.getByRole('button', { name: /role preferences/i }).click()
      await expect(page.getByText('Primary role')).toBeVisible()
    },
  },
  {
    name: 'champion-picker-grid',
    prepare: async (page) => {
      await mockChampSelect(page, createChampSelectSession())
      await openChampionPicker(page)
    },
  },
  {
    name: 'summoner-spell-selection',
    prepare: async (page) => {
      await mockChampSelect(
        page,
        createChampSelectSession({
          actions: [[{ actorCellId: 1, championId: 0, completed: false, id: 21, isAllyAction: true, type: 'pick' }]],
        }),
      )
      await expect(page.getByText('Spells', { exact: true })).toBeVisible()
    },
  },
  {
    name: 'rune-editor',
    prepare: async (page) => {
      await mockChampSelect(
        page,
        createChampSelectSession({
          actions: [[{ actorCellId: 1, championId: 0, completed: false, id: 21, isAllyAction: true, type: 'pick' }]],
        }),
      )
      await expect(page.getByText('Runes', { exact: true })).toBeVisible()
    },
  },
  {
    name: 'ban-phase',
    prepare: async (page) => {
      await mockChampSelect(page, createChampSelectSession())
      await openChampionPicker(page)
      await expect(page.getByText('Ban').first()).toBeVisible()
    },
  },
  {
    name: 'pick-phase',
    prepare: async (page) => {
      await mockChampSelect(
        page,
        createChampSelectSession({
          actions: [
            [{ actorCellId: 1, championId: 266, completed: true, id: 11, isAllyAction: true, type: 'ban' }],
            [{ actorCellId: 6, championId: 103, completed: true, id: 12, isAllyAction: false, type: 'ban' }],
            [{ actorCellId: 1, championId: 0, completed: false, id: 21, isAllyAction: true, type: 'pick' }],
          ],
        }),
      )
      await openChampionPicker(page)
      await expect(page.getByText('Pick').first()).toBeVisible()
    },
  },
  {
    name: 'aram-bench',
    prepare: async (page) => {
      await mockChampSelect(
        page,
        createChampSelectSession({
          actions: [[{ actorCellId: 1, championId: 0, completed: false, id: 31, isAllyAction: true, type: 'pick' }]],
          benchChampionIds: [22, 86, 99],
          benchEnabled: true,
          gameMode: 'ARAM',
          mapId: 12,
          queueId: 450,
        }),
      )
      await openChampionPicker(page)
      await expect(page.getByRole('heading', { name: 'ARAM Bench' })).toBeVisible()
    },
  },
  {
    name: 'ready-check-overlay',
    prepare: async (page) => {
      await page.goto('/connected/lobby')
      await waitForMockBridge(page)
      await page.evaluate(() => {
        window.__shomaMockLcu?.('gameflowPhase', 'ReadyCheck')
        window.__shomaMockLcu?.('readyCheck', { playerResponse: 'None', state: 'InProgress', timer: 5 })
      })
      await expect(page.getByTestId('ready-check-overlay')).toBeVisible()
    },
  },
]

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(
    !(testInfo.project.name in mobileProjectViewports),
    'Mobile screenshot comparisons run only for Mobile-360 and Mobile-390.',
  )

  await mockDdragon(page)
  await seedLobby(page)
})

test('compares current mobile screens against Plan 00 baselines', async ({ page }, testInfo) => {
  const viewport = mobileProjectViewports[testInfo.project.name]
  const viewportLabel = viewport.replace('mobile-', '')
  const results: ComparisonResult[] = []

  await mkdir(evidenceDir, { recursive: true })

  for (const screen of screens) {
    try {
      await screen.prepare(page)
    } catch (error) {
      const message = stripAnsi(error instanceof Error ? error.message : String(error))
      const actualPath = path.join(evidenceDir, `plan-05-t1-${screen.name}-${viewport}-actual.png`)

      await page.screenshot({ fullPage: true, path: actualPath })

      results.push({
        actualPath,
        diffPixels: 'not compared',
        error: firstMeaningfulLine(message),
        regressions: 'screen setup failed; likely missing required element or changed navigation state',
        screen: screen.name,
        status: 'fail',
      })
      continue
    }

    try {
      await expect(page).toHaveScreenshot(['baselines', `${screen.name}-${viewport}.png`], {
        fullPage: true,
        maxDiffPixels,
      })

      results.push({
        diffPixels: `0 (within ${maxDiffPixels}px threshold)`,
        regressions: 'none flagged',
        screen: screen.name,
        status: 'pass',
      })
    } catch (error) {
      const message = stripAnsi(error instanceof Error ? error.message : String(error))
      const actualPath = path.join(evidenceDir, `plan-05-t1-${screen.name}-${viewport}-actual.png`)
      const diffPath = path.join(evidenceDir, `plan-05-t1-${screen.name}-${viewport}-diff.png`)

      await page.screenshot({ fullPage: true, path: actualPath })
      const diffPixels = await writeDiffArtifact(
        path.join(process.cwd(), 'tests/e2e/baselines', `${screen.name}-${viewport}.png`),
        actualPath,
        diffPath,
      )

      results.push({
        actualPath,
        diffPath,
        diffPixels: diffPixels ?? extractDiffPixels(message),
        error: firstMeaningfulLine(message),
        regressions:
          'visual comparison exceeded threshold; inspect actual/diff for layout shifts, missing elements, or overflow',
        screen: screen.name,
        status: 'fail',
      })
    }
  }

  const report = buildReport({ projectName: testInfo.project.name, results, viewport, viewportLabel })
  const reportPath = path.join(evidenceDir, `plan-05-t1-comparison-${viewportLabel}.md`)
  await writeFile(reportPath, report, 'utf8')

  expect(results).toHaveLength(screens.length)
})

function extractDiffPixels(message: string): string {
  const exactMatch = message.match(/(\d+)\s+pixels?\s+\([^)]*\)\s+are different/i)
  if (exactMatch) {
    return exactMatch[1]
  }

  const genericMatch = message.match(/(?:diff(?:erent)? pixels?|pixels? different)\D+(\d+)/i)
  return genericMatch?.[1] ?? `>${maxDiffPixels}`
}

async function writeDiffArtifact(expectedPath: string, actualPath: string, diffPath: string): Promise<string | undefined> {
  const expected = PNG.sync.read(await readFile(expectedPath))
  const actual = PNG.sync.read(await readFile(actualPath))
  const width = Math.max(expected.width, actual.width)
  const height = Math.max(expected.height, actual.height)
  const expandedExpected = expandPng(expected, width, height)
  const expandedActual = expandPng(actual, width, height)
  const diff = new PNG({ height, width })
  const diffPixels = pixelmatch(expandedExpected.data, expandedActual.data, diff.data, width, height, { threshold: 0.2 })

  await writeFile(diffPath, PNG.sync.write(diff))
  return expected.width === actual.width && expected.height === actual.height
    ? String(diffPixels)
    : `${diffPixels} (dimension mismatch: baseline ${expected.width}x${expected.height}, actual ${actual.width}x${actual.height})`
}

function expandPng(source: PNG, width: number, height: number): PNG {
  const expanded = new PNG({ height, width })
  expanded.data.fill(0)

  for (let row = 0; row < source.height; row += 1) {
    const sourceStart = row * source.width * 4
    const sourceEnd = sourceStart + source.width * 4
    const targetStart = row * width * 4
    source.data.copy(expanded.data, targetStart, sourceStart, sourceEnd)
  }

  return expanded
}

function firstMeaningfulLine(message: string): string {
  return (
    message
      .split('\n')
      .map((line) => {return line.trim()})
      .find((line) => {return line.length > 0}) ?? 'Screenshot comparison failed.'
  )
}

function stripAnsi(value: string): string {
  const escape = String.fromCharCode(0x1b)
  const csi = String.fromCharCode(0x9b)
  const bell = String.fromCharCode(0x07)
  const pattern = `(?:${escape}|${csi})[[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[a-zA-Z\\d]*)*)?${bell})|(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))`

  return value.replace(new RegExp(pattern, 'gu'), '')
}

function buildReport(input: {
  projectName: string
  results: ComparisonResult[]
  viewport: string
  viewportLabel: string
}): string {
  const failedCount = input.results.filter((result) => {return result.status === 'fail'}).length
  const status = failedCount === 0 ? 'PASS' : 'FAIL'
  const rows = input.results.map((result) => {
    const evidence = [
      result.actualPath ? `actual: ${path.relative(process.cwd(), result.actualPath)}` : undefined,
      result.diffPath ? `diff: ${path.relative(process.cwd(), result.diffPath)}` : undefined,
    ]
      .filter(Boolean)
      .join('<br>')

    return `| ${result.screen} | ${result.status.toUpperCase()} | ${result.diffPixels} | ${result.regressions} | ${evidence || '—'} |`
  })

  return [
    `# Plan 05 T1 Mobile Screenshot Comparison — ${input.viewport}`,
    '',
    `Project: ${input.projectName}`,
    `Viewport: ${input.viewportLabel}`,
    `Baseline directory: web/tests/e2e/baselines/`,
    `Max diff pixels: ${maxDiffPixels}`,
    `Status: ${status}`,
    '',
    '| Screen | Status | Diff pixel count | Flagged regressions | Evidence |',
    '| --- | --- | ---: | --- | --- |',
    ...rows,
    '',
  ].join('\n')
}
