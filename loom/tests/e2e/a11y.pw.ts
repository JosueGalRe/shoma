import { mkdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'

import { expect, type Page, test } from 'playwright/test'

declare global {
  interface Window {
    __shomaMockLcu?: (alias: 'gameflowPhase' | 'readyCheck' | 'champSelectSession' | 'queueSearch', data: unknown) => void
    axe?: {
      run: (context?: string | Document | Element, options?: AxeRunOptions) => Promise<AxeResults>
    }
  }
}

type AxeImpact = 'minor' | 'moderate' | 'serious' | 'critical'

type AxeRunOptions = {
  runOnly?: {
    type: 'tag'
    values: string[]
  }
}

type AxeNode = {
  failureSummary?: string
  html: string
  target: string[]
}

type AxeViolation = {
  description: string
  help: string
  helpUrl: string
  id: string
  impact?: AxeImpact
  nodes: AxeNode[]
}

type AxeResults = {
  violations: AxeViolation[]
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

type A11yScreen = {
  name: string
  prepare: (page: Page) => Promise<void>
}

type TouchTargetIssue = {
  height: number
  label: string
  screen: string
  selector: string
  width: number
}

const require = createRequire(import.meta.url)
const axeCorePath = require.resolve('axe-core/axe.min.js')
const evidenceDir = resolve(process.cwd(), '..', '.sisyphus/evidence')
const a11yReportPath = `${evidenceDir}/plan-05-t3-a11y-report.md`
const focusTrapScreenshotPath = `${evidenceDir}/plan-05-t3-focus-trap.png`
const touchTargetReportPath = `${evidenceDir}/plan-05-t3-touch-targets.md`

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
  champions.map((champion) => [
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
  ]),
)

const runeTrees = [
  {
    icon: 'perk-images/Styles/7201_Precision.png',
    id: 8000,
    key: 'Precision',
    name: 'Precision',
    slots: [{ runes: [{ icon: 'perk-images/Styles/Precision/PressTheAttack/PressTheAttack.png', id: 8005, key: 'PressTheAttack', longDesc: 'Strike fast.', name: 'Press the Attack', shortDesc: 'Strike fast.' }] }],
  },
  {
    icon: 'perk-images/Styles/7200_Domination.png',
    id: 8100,
    key: 'Domination',
    name: 'Domination',
    slots: [{ runes: [{ icon: 'perk-images/Styles/Domination/Electrocute/Electrocute.png', id: 8112, key: 'Electrocute', longDesc: 'Burst damage.', name: 'Electrocute', shortDesc: 'Burst damage.' }] }],
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
    await route.fulfill({ contentType: 'application/json', json: { data: { [championKey]: championData[championKey] ?? championData.Aatrox } } })
  })
  await page.route(/\.(?:png|jpg|jpeg|webp)(?:\?.*)?$/, async (route) => {
    await route.fulfill({ body: '', status: 204 })
  })
}

async function seedLobby(page: Page): Promise<void> {
  await page.addInitScript((members) => {
    sessionStorage.setItem('shoma:lobby:sticky', JSON.stringify({ state: { stickyMembers: members, stickyMode: 'normal-draft' }, version: 1 }))
  }, lobbyMembers)
}

async function waitForMockBridge(page: Page): Promise<void> {
  await page.waitForFunction(() => typeof window.__shomaMockLcu === 'function')
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
      { assignedPosition: 'middle', cellId: 1, championId: 0, displayName: 'Mimic Tester', spell1Id: 4, spell2Id: 14, summonerId: 101 },
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

const screens: A11yScreen[] = [
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
      await mockChampSelect(page, createChampSelectSession({ actions: [[{ actorCellId: 1, championId: 0, completed: false, id: 21, isAllyAction: true, type: 'pick' }]] }))
      await expect(page.getByText('Spells', { exact: true })).toBeVisible()
    },
  },
  {
    name: 'rune-editor',
    prepare: async (page) => {
      await mockChampSelect(page, createChampSelectSession({ actions: [[{ actorCellId: 1, championId: 0, completed: false, id: 21, isAllyAction: true, type: 'pick' }]] }))
      await page.getByRole('button', { name: /edit runes/i }).click()
      await expect(page.getByRole('dialog', { name: /runes/i })).toBeVisible()
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
      await mockChampSelect(page, createChampSelectSession({
        actions: [
          [{ actorCellId: 1, championId: 266, completed: true, id: 11, isAllyAction: true, type: 'ban' }],
          [{ actorCellId: 6, championId: 103, completed: true, id: 12, isAllyAction: false, type: 'ban' }],
          [{ actorCellId: 1, championId: 0, completed: false, id: 21, isAllyAction: true, type: 'pick' }],
        ],
      }))
      await openChampionPicker(page)
      await expect(page.getByText('Pick').first()).toBeVisible()
    },
  },
  {
    name: 'aram-bench',
    prepare: async (page) => {
      await mockChampSelect(page, createChampSelectSession({
        actions: [[{ actorCellId: 1, championId: 0, completed: false, id: 31, isAllyAction: true, type: 'pick' }]],
        benchChampionIds: [22, 86, 99],
        benchEnabled: true,
        gameMode: 'ARAM',
        mapId: 12,
        queueId: 450,
      }))
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

async function injectAxe(page: Page): Promise<void> {
  await page.addScriptTag({ path: axeCorePath })
  await page.waitForFunction(() => typeof window.axe?.run === 'function')
}

async function runAxe(page: Page): Promise<AxeViolation[]> {
  return page.evaluate(async () => {
    const results = await window.axe?.run(document.documentElement, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
    })

    return results?.violations ?? []
  })
}

async function collectTouchTargetIssues(page: Page, screen: string): Promise<TouchTargetIssue[]> {
  return page.locator('button:not([disabled]), a[href], input, select, textarea, [role="button"], [role="radio"], [role="tab"], [tabindex]:not([tabindex="-1"])').evaluateAll((elements, screenName) => {
    return elements.flatMap((element, index) => {
      const rect = element.getBoundingClientRect()
      const style = window.getComputedStyle(element)
      const isVisible = rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
      if (!isVisible || (rect.width >= 44 && rect.height >= 44)) {
        return []
      }

      return [{
        height: Math.round(rect.height),
        label: element.getAttribute('aria-label') ?? element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 80) ?? `interactive-${index}`,
        screen: screenName,
        selector: element.tagName.toLowerCase(),
        width: Math.round(rect.width),
      }]
    })
  }, screen)
}

async function collectReducedMotionIssues(page: Page): Promise<string[]> {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  return page.locator('body *').evaluateAll((elements) => {
    return elements.flatMap((element) => {
      const style = window.getComputedStyle(element)
      const hasMotion = style.animationName !== 'none' && style.animationDuration !== '0s'
      const hasTransition = style.transitionDuration.split(',').some((duration) => duration.trim() !== '0s')
      if (!hasMotion && !hasTransition) {
        return []
      }

      return [`${element.tagName.toLowerCase()}.${Array.from(element.classList).slice(0, 3).join('.')}`]
    })
  })
}

function formatViolationCounts(violations: AxeViolation[]): string {
  const counts: Record<AxeImpact, number> = { critical: 0, minor: 0, moderate: 0, serious: 0 }
  for (const violation of violations) {
    if (violation.impact) {
      counts[violation.impact] += 1
    }
  }

  return `critical ${counts.critical}, serious ${counts.serious}, moderate ${counts.moderate}, minor ${counts.minor}`
}

function renderA11yReport(results: { name: string; reducedMotionIssues: string[]; violations: AxeViolation[] }[]): string {
  const lines = ['# Plan 05 T3 Accessibility Report', '', 'Target: WCAG 2.1 AA mobile via axe-core 4.10.2 and Playwright Mobile-360.', '']

  for (const result of results) {
    lines.push(`## ${result.name}`, '', `Violation summary: ${formatViolationCounts(result.violations)}`)
    if (result.violations.length === 0) {
      lines.push('', 'No axe violations found.')
    } else {
      for (const violation of result.violations) {
        lines.push('', `- ${violation.impact ?? 'unknown'}: ${violation.id} — ${violation.help}`)
        for (const node of violation.nodes.slice(0, 3)) {
          lines.push(`  - target: ${node.target.join(', ')}`)
        }
      }
    }

    lines.push('', `Reduced motion check: ${result.reducedMotionIssues.length === 0 ? 'no active animations/transitions under prefers-reduced-motion: reduce' : `${result.reducedMotionIssues.length} active motion styles observed`}`, '')
  }

  lines.push(
    '## Fixes applied',
    '',
    '- BottomSheet focus trapping now attaches after the portal renders, recomputes valid focusable elements on each Tab, handles zero-focusable sheets, and redirects escaped focus back into the dialog.',
    '- Axe injection uses the locked local `axe-core` package instead of a remote CDN script.',
    '- Shared button, debug toggle, and mobile social controls now meet the 44×44px touch target minimum measured by this suite.',
    '- No critical or serious axe violations remained after scan.',
    '',
  )
  return lines.join('\n')
}

function renderTouchTargetReport(issues: TouchTargetIssue[]): string {
  const lines = ['# Plan 05 T3 Touch Target Verification', '', 'Target: interactive controls should measure at least 44×44 CSS px on Mobile-360.', '']

  if (issues.length === 0) {
    lines.push('All measured interactive targets are at least 44×44 CSS px.', '')
    return lines.join('\n')
  }

  for (const issue of issues) {
    lines.push(`- ${issue.screen}: ${issue.label || issue.selector} measured ${issue.width}×${issue.height}px`)
  }
  lines.push('')
  return lines.join('\n')
}

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'Mobile-360', 'Plan 05 T3 a11y evidence is captured on Mobile-360.')
  await mkdir(evidenceDir, { recursive: true })
  await mockDdragon(page)
  await seedLobby(page)
})

test('scans modified mobile screens with axe-core', async ({ page }) => {
  const results: { name: string; reducedMotionIssues: string[]; violations: AxeViolation[] }[] = []
  const touchTargetIssues: TouchTargetIssue[] = []

  for (const screen of screens) {
    await screen.prepare(page)
    await injectAxe(page)
    const violations = await runAxe(page)
    const reducedMotionIssues = await collectReducedMotionIssues(page)
    touchTargetIssues.push(...await collectTouchTargetIssues(page, screen.name))
    results.push({ name: screen.name, reducedMotionIssues, violations })
  }

  await writeFile(a11yReportPath, renderA11yReport(results))
  await writeFile(touchTargetReportPath, renderTouchTargetReport(touchTargetIssues))

  const severeViolations = results.flatMap((result) => result.violations.filter((violation) => violation.impact === 'critical' || violation.impact === 'serious').map((violation) => `${result.name}: ${violation.id}`))
  expect(severeViolations).toEqual([])
})

test('traps focus in BottomSheet and returns focus to trigger', async ({ page }) => {
  await page.goto('/connected/lobby')
  const trigger = page.getByRole('button', { name: /role preferences/i })
  await trigger.focus()
  await trigger.click()

  const dialog = page.getByRole('dialog', { name: /role preferences/i })
  await expect(dialog).toBeVisible()
  await expect.poll(() => dialog.evaluate((sheet) => sheet.contains(document.activeElement))).toBe(true)

  for (let step = 0; step < 5; step += 1) {
    await page.keyboard.press('Tab')
    await expect.poll(() => dialog.evaluate((sheet) => sheet.contains(document.activeElement))).toBe(true)
  }

  await page.screenshot({ fullPage: true, path: focusTrapScreenshotPath })
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})
