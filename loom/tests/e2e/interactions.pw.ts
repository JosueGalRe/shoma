import { expect, type Page, test } from 'playwright/test'

declare global {
  interface Window {
    __shomaMockLcu?: (alias: 'gameflowPhase' | 'readyCheck' | 'champSelectSession' | 'queueSearch', data: unknown) => void
    __shomaHarnessRoot?: { unmount: () => void }
  }
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
  { id: 'Aatrox', key: '266', name: 'Aatrox', tags: ['Fighter', 'Tank'], title: 'the Darkin Blade' },
  { id: 'Ahri', key: '103', name: 'Ahri', tags: ['Mage', 'Assassin'], title: 'the Nine-Tailed Fox' },
  { id: 'Akali', key: '84', name: 'Akali', tags: ['Assassin'], title: 'the Rogue Assassin' },
  { id: 'Ashe', key: '22', name: 'Ashe', tags: ['Marksman', 'Support'], title: 'the Frost Archer' },
  { id: 'Garen', key: '86', name: 'Garen', tags: ['Fighter', 'Tank'], title: 'The Might of Demacia' },
  { id: 'Lux', key: '99', name: 'Lux', tags: ['Mage', 'Support'], title: 'the Lady of Luminosity' },
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
      {
        runes: [
          {
            id: 9101,
            key: 'Overheal',
            icon: 'perk-images/Styles/Precision/Overheal.png',
            name: 'Overheal',
            shortDesc: 'Shield.',
            longDesc: 'Shield.',
          },
        ],
      },
      {
        runes: [
          {
            id: 9104,
            key: 'LegendAlacrity',
            icon: 'perk-images/Styles/Precision/LegendAlacrity/LegendAlacrity.png',
            name: 'Legend: Alacrity',
            shortDesc: 'Speed.',
            longDesc: 'Speed.',
          },
        ],
      },
      {
        runes: [
          {
            id: 8014,
            key: 'CoupDeGrace',
            icon: 'perk-images/Styles/Precision/CoupDeGrace/CoupDeGrace.png',
            name: 'Coup de Grace',
            shortDesc: 'Finish.',
            longDesc: 'Finish.',
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
      {
        runes: [
          {
            id: 8126,
            key: 'CheapShot',
            icon: 'perk-images/Styles/Domination/CheapShot/CheapShot.png',
            name: 'Cheap Shot',
            shortDesc: 'True damage.',
            longDesc: 'True damage.',
          },
        ],
      },
      {
        runes: [
          {
            id: 8138,
            key: 'EyeballCollection',
            icon: 'perk-images/Styles/Domination/EyeballCollection/EyeballCollection.png',
            name: 'Eyeball Collection',
            shortDesc: 'Power.',
            longDesc: 'Power.',
          },
        ],
      },
      {
        runes: [
          {
            id: 8135,
            key: 'TreasureHunter',
            icon: 'perk-images/Styles/Domination/TreasureHunter/TreasureHunter.png',
            name: 'Treasure Hunter',
            shortDesc: 'Gold.',
            longDesc: 'Gold.',
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

async function mountHarness(
  page: Page,
  kind: 'bottom-sheet' | 'icon-grid' | 'champion-picker' | 'summoner-picker' | 'rune-editor',
): Promise<void> {
  await page.goto('/tests/e2e/interactions-harness.html', { waitUntil: 'domcontentloaded' })
  const mount = async () =>
    {return page.evaluate(
      async ({ harnessKind, mockedRuneTrees, mockedChampions }) => {
        const { mountInteractionHarness } = await import('./interactions-harness.tsx')
        mountInteractionHarness(harnessKind, { mockedChampions, mockedRuneTrees })
      },
      { harnessKind: kind, mockedChampions: champions, mockedRuneTrees: runeTrees },
    )}

  try {
    await mount()
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('Execution context was destroyed')) {
      throw error
    }
    await page.waitForLoadState('domcontentloaded')
    await mount()
  }
}

function expectSelected(locator: ReturnType<Page['getByRole']>) {
  return expect(locator).toHaveClass(/(?:border-lol-border-gold|ring-lol-border-gold|shadow-lol-glow-gold)/)
}

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'Mobile-360', 'Interaction coverage runs only against the Mobile-360 touch viewport.')
  await mockDdragon(page)
  await seedLobby(page)
})

test.describe('BottomSheet', () => {
  test('opens and closes with backdrop, Escape, and swipe-down gesture', async ({ page }) => {
    await mountHarness(page, 'bottom-sheet')

    await page.getByRole('button', { name: 'Open sheet' }).click()
    await expect(page.getByRole('dialog', { name: 'Test Sheet' })).toBeVisible()

    await page.mouse.click(20, 20)
    await expect(page.getByRole('dialog', { name: 'Test Sheet' })).toBeHidden()

    await page.getByRole('button', { name: 'Open sheet' }).click()
    await expect(page.getByRole('dialog', { name: 'Test Sheet' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'Test Sheet' })).toBeHidden()

    await page.getByRole('button', { name: 'Open sheet' }).click()
    const dialog = page.getByRole('dialog', { name: 'Test Sheet' })
    await expect(dialog).toBeVisible()
    await dialog.evaluate((element) => {
      const handle = element.firstElementChild
      if (!handle) {
        throw new Error('Missing drag handle')
      }
      const createTouch = (clientY: number) => {return new Touch({ clientX: 180, clientY, identifier: 1, target: handle })}
      handle.dispatchEvent(
        new TouchEvent('touchstart', { bubbles: true, touches: [createTouch(620)], changedTouches: [createTouch(620)] }),
      )
      handle.dispatchEvent(
        new TouchEvent('touchmove', { bubbles: true, touches: [createTouch(760)], changedTouches: [createTouch(760)] }),
      )
      handle.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: [createTouch(760)] }))
    })
    await expect(dialog).toBeHidden()
  })
})

test.describe('IconGridSelector', () => {
  test('selects by tap and keyboard Space/Enter', async ({ page }) => {
    await mountHarness(page, 'icon-grid')

    const flash = page.getByRole('button', { name: /flash/i })
    const ignite = page.getByRole('button', { name: /ignite/i })
    const heal = page.getByRole('button', { name: /heal/i })

    await expectSelected(flash)
    await heal.tap()
    await expectSelected(heal)

    await ignite.focus()
    await page.keyboard.press('Space')
    await expectSelected(ignite)

    await flash.focus()
    await page.keyboard.press('Enter')
    await expectSelected(flash)
  })
})

test.describe('ChampionPicker', () => {
  test('sorts, filters, and keeps keyboard navigation inside champion cards', async ({ page }) => {
    await mockChampSelect(page, createChampSelectSession())
    await openChampionPicker(page)
    await expect(page.getByRole('heading', { name: 'Champions' })).toBeVisible()

    const championCards = page.getByRole('button').filter({ hasText: /Available|Selected|Banned|Picked/ })
    await expect(championCards.first()).toContainText('Aatrox')

    await page.getByRole('button', { name: 'Name (Z-A)' }).click()
    await expect(championCards.first()).toContainText('Lux')

    await page.getByRole('button', { name: 'Tank' }).click()
    await expect(page.getByRole('button', { name: /garen/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /ahri/i })).toBeHidden()

    const navigableChampion = page.getByRole('button', { name: /aatrox/i })
    await navigableChampion.focus()
    await page.keyboard.press('ArrowDown')
    await expect(navigableChampion).toBeFocused()
    await page.keyboard.press('ArrowUp')
    await expect(navigableChampion).toBeFocused()
  })

  test('keeps champ-select primary action buttons in the bottom thumb zone', async ({ page }) => {
    await mockChampSelect(page, createChampSelectSession())
    await openChampionPicker(page)

    for (const name of [/lock in/i, /^ban$/i]) {
      const button = page.getByRole('button', { name }).first()
      await button.evaluate((element) => {return element.scrollIntoView({ block: 'end', inline: 'nearest' })})
      const box = await button.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.y + box!.height / 2).toBeGreaterThanOrEqual(600)
      expect(box!.y + box!.height / 2).toBeLessThanOrEqual(800)
    }
  })
})

test.describe('SummonerPicker', () => {
  test('opens the spell BottomSheet, selects from the grid, and updates the slot', async ({ page }) => {
    await mountHarness(page, 'summoner-picker')

    await page.locator('label').filter({ hasText: 'Spell 1' }).getByRole('button').click()
    const dialog = page.getByRole('dialog', { name: 'Choose spell' })
    await expect(dialog).toBeVisible()

    await dialog.getByRole('button', { name: /heal/i }).tap()
    await expect(dialog).toBeHidden()
    await expect(page.locator('label').filter({ hasText: 'Spell 1' })).toContainText('Heal')
  })
})

test.describe('RuneEditor', () => {
  test('switches tabs and selects primary, secondary, and stat runes', async ({ page }) => {
    await mountHarness(page, 'rune-editor')
    await expect(page.getByRole('dialog', { name: 'Runes' })).toBeVisible()

    await page.getByRole('button', { name: 'Primary' }).click()
    const overheal = page.getByRole('button', { name: /overheal/i })
    await overheal.click()
    await expectSelected(overheal)

    const attackSpeed = page.getByRole('button', { name: /attack speed/i })
    await attackSpeed.click()
    await expectSelected(attackSpeed)

    await page.getByRole('button', { name: 'Secondary' }).click()
    const cheapShot = page.getByRole('button', { name: /cheap shot/i })
    await cheapShot.click()
    await expectSelected(cheapShot)

    await page.getByRole('button', { name: 'Recommended' }).click()
    await expect(page.getByText('Coming soon').first()).toBeVisible()
  })
})
