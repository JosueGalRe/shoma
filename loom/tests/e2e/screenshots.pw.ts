import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

declare global {
  interface Window {
    __shomaMockLcu?: (alias: 'gameflowPhase' | 'readyCheck' | 'champSelectSession' | 'queueSearch', data: unknown) => void
  }
}

type ScreenshotScreen = {
  name: string
  prepare: (page: Page) => Promise<void>
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

const baselineDir = 'tests/e2e/baselines'

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

async function captureBaseline(page: Page, screen: string, viewport: string): Promise<void> {
  await page.screenshot({
    fullPage: true,
    path: `${baselineDir}/${screen}-${viewport}.png`,
  })
}

const screens: ScreenshotScreen[] = [
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
      await expect(page.getByText('SPELLS')).toBeVisible()
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
      await expect(page.getByRole('heading', { name: 'Runes' })).toBeVisible()
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
] as const

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(
    !(testInfo.project.name in mobileProjectViewports),
    'Mobile screenshot baselines are captured only for Mobile-360 and Mobile-390.',
  )

  await mockDdragon(page)
  await seedLobby(page)
})

for (const screen of screens) {
  test(`captures ${screen.name} baseline`, async ({ page }, testInfo) => {
    const viewport = mobileProjectViewports[testInfo.project.name]

    await screen.prepare(page)
    await captureBaseline(page, screen.name, viewport)
  })
}
