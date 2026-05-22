import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PageHeader } from '@/components/page-header'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import {
  useChampionSkins,
  useChampions,
  useLatestDdragonVersion,
  useRunes,
  type ChampionSkin,
  type RuneTree,
} from '@/core/http/ddragon-client'
import { useSetQuickplayPlayerSlots } from '@/core/lcu/lcu-mutations'
import { createLcuQueryOptions, perksPagesDescriptor, summonerSpellsDescriptor } from '@/core/lcu/lcu-queries'
import { type PerkPage } from '@/core/lcu/parsers/perks'
import { useSharedLCUTransport } from '@/core/relay/relay-client-provider'
import { ensureLcuRouteData } from '@/core/relay/route-loader'
import { ChampionId, RuneId, SpellId, type RuneId as RuneIdType } from '@/core/types/branded'
import { type SummonerSpell } from '@/features/champ-select'
import {
  selectSwiftplayErrors,
  selectSwiftplayIsValid,
  useSwiftplayStore,
  type SwiftplayOption,
} from '@/features/swiftplay/swiftplay-store'
import { type LcuQuickplayPlayerSlotsBody } from '@shoma/protocol-contract'

const positions = [
  { labelKey: 'swiftplay.positions.top', value: 'top' },
  { labelKey: 'swiftplay.positions.jungle', value: 'jungle' },
  { labelKey: 'swiftplay.positions.middle', value: 'middle' },
  { labelKey: 'swiftplay.positions.bottom', value: 'bottom' },
  { labelKey: 'swiftplay.positions.utility', value: 'utility' },
  { labelKey: 'swiftplay.positions.fill', value: 'fill' },
] as const

const positionPreferenceByValue: Record<string, string> = {
  bottom: 'BOTTOM',
  fill: 'FILL',
  jungle: 'JUNGLE',
  middle: 'MIDDLE',
  top: 'TOP',
  utility: 'UTILITY',
}

const summonerSpellImageNames: Record<string, string> = {
  Barrier: 'SummonerBarrier.png',
  Cleanse: 'SummonerBoost.png',
  Exhaust: 'SummonerExhaust.png',
  Flash: 'SummonerFlash.png',
  Flee: 'SummonerCherryHold.png',
  Ghost: 'SummonerHaste.png',
  Heal: 'SummonerHeal.png',
  Ignite: 'SummonerDot.png',
  Mark: 'SummonerSnowball.png',
  'Placeholder and Attack-Smite': 'Summoner_UltBookSmitePlaceholder.png',
  Placeholder: 'Summoner_UltBookPlaceholder.png',
  'Poro Toss': 'SummonerPoroThrow.png',
  'To the King!': 'SummonerPoroRecall.png',
  Smite: 'SummonerSmite.png',
  Teleport: 'SummonerTeleport.png',
  Clarity: 'SummonerMana.png',
}

function summonerSpellUrl(version: string | undefined, spell: SummonerSpell | null | undefined): string | null {
  if (!version || !spell) {
    return null
  }

  const imageName = summonerSpellImageNames[spell.name]
  if (!imageName) {
    return null
  }

  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${imageName}`
}

function runeTreeUrl(version: string | undefined, runeTree: RuneTree | null | undefined): string | null {
  if (!version || !runeTree) {
    return null
  }

  return `https://ddragon.leagueoflegends.com/cdn/img/${runeTree.icon}`
}

function championSkinUrl(championKey: string | null, skinNum: number | null): string | null {
  if (!championKey || skinNum === null) {
    return null
  }

  return `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${championKey}_${skinNum}.jpg`
}

function findSelectedSkinId(skins: ChampionSkin[], skinNum: number | null): number | null {
  if (skinNum === null) {
    return null
  }

  const skinId = skins.find((skin) => skin.num === skinNum)?.id
  return skinId ? Number(skinId) : null
}

function findPerkPageForRune(perkPages: PerkPage[], runeId: RuneIdType | null): PerkPage | null {
  if (runeId === null) {
    return null
  }

  return perkPages.find((page) => page.primaryStyleId === runeId) ?? null
}

function buildPerksString(perkPage: PerkPage): string {
  return JSON.stringify({
    perkIds: perkPage.selectedPerkIds,
    perkStyle: perkPage.primaryStyleId,
    perkSubStyle: perkPage.subStyleId,
  })
}

function buildPlayerSlotsBody(
  options: [SwiftplayOption, SwiftplayOption],
  skinsByOption: [ChampionSkin[], ChampionSkin[]],
  perkPages: PerkPage[],
): LcuQuickplayPlayerSlotsBody | null {
  const slots: LcuQuickplayPlayerSlotsBody = []

  for (let index = 0; index < options.length; index += 1) {
    const option = options[index]
    const positionPreference = option.position ? positionPreferenceByValue[option.position] : null
    const skinId = findSelectedSkinId(skinsByOption[index], option.skinId)
    const perkPage = findPerkPageForRune(perkPages, option.runeId)

    if (
      option.championId === null ||
      positionPreference === null ||
      skinId === null ||
      option.spell1Id === null ||
      option.spell2Id === null ||
      perkPage === null
    ) {
      return null
    }

    slots.push({
      championId: option.championId,
      perks: buildPerksString(perkPage),
      positionPreference,
      skinId,
      spell1: option.spell1Id,
      spell2: option.spell2Id,
    })
  }

  return slots
}

function OptionCard({
  champions,
  ddragonVersion,
  isLoading,
  option,
  optionIndex,
  runeTrees,
  summonerSpells,
}: {
  champions: Awaited<ReturnType<typeof useChampions>>['data']
  ddragonVersion: string | undefined
  isLoading: boolean
  option: SwiftplayOption
  optionIndex: 1 | 2
  runeTrees: RuneTree[]
  summonerSpells: SummonerSpell[]
}) {
  const { t } = useTranslation()
  const setOption = useSwiftplayStore((state) => state.setOption)
  const championSkinsQuery = useChampionSkins(option.championId ?? undefined)
  const selectedChampion = champions?.find((champion) => champion.id === option.championId) ?? null
  const selectedRuneTree = runeTrees.find((tree) => tree.id === option.runeId) ?? null
  const selectedSpell1 = summonerSpells.find((spell) => spell.id === option.spell1Id) ?? null
  const selectedSpell2 = summonerSpells.find((spell) => spell.id === option.spell2Id) ?? null
  const selectedSkins = championSkinsQuery.data ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle className='font-display text-primary'>
          {t(optionIndex === 1 ? 'swiftplay.option1' : 'swiftplay.option2')}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        <label className='text-muted block space-y-1 text-sm'>
          <span>{t('swiftplay.champion')}</span>
          <select
            className='border-border bg-background text-foreground focus:border-primary focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus:shadow-[0_0_20px_var(--shoma-primary)] focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50'
            disabled={!champions}
            onChange={(event) => {
              setOption(optionIndex, 'championId', event.target.value ? ChampionId(Number(event.target.value)) : null)
              setOption(optionIndex, 'skinId', null)
            }}
            value={option.championId ?? ''}
          >
            <option value=''>{isLoading ? t('common.loading') : t('swiftplay.champion')}</option>
            {champions?.map((champion) => (
              <option key={champion.id} value={champion.id}>
                {champion.name}
              </option>
            ))}
          </select>
        </label>

        <label className='text-muted block space-y-1 text-sm'>
          <span>{t('swiftplay.position')}</span>
          <select
            className='border-border bg-background text-foreground focus:border-primary focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus:shadow-[0_0_20px_var(--shoma-primary)] focus-visible:ring-2 focus-visible:outline-none'
            onChange={(event) => {
              setOption(optionIndex, 'position', event.target.value || null)
            }}
            value={option.position ?? ''}
          >
            <option value=''>{t('swiftplay.position')}</option>
            {positions.map((position) => (
              <option key={position.value} value={position.value}>
                {t(position.labelKey)}
              </option>
            ))}
          </select>
        </label>

        <label className='text-muted block space-y-1 text-sm'>
          <span>{t('swiftplay.rune')}</span>
          <div className='flex items-center gap-2'>
            <img
              alt=''
              className='border-border bg-background size-8 rounded-md border object-cover'
              src={runeTreeUrl(ddragonVersion, selectedRuneTree) ?? undefined}
            />
            <select
              className='border-border bg-background text-foreground focus:border-primary focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus:shadow-[0_0_20px_var(--shoma-primary)] focus-visible:ring-2 focus-visible:outline-none'
              onChange={(event) => {
                setOption(optionIndex, 'runeId', event.target.value ? RuneId(Number(event.target.value)) : null)
              }}
              value={option.runeId ?? ''}
            >
              <option value=''>{t('swiftplay.chooseRune')}</option>
              {runeTrees.map((tree) => (
                <option key={tree.id} value={tree.id}>
                  {tree.name}
                </option>
              ))}
            </select>
          </div>
        </label>

        <div className='grid gap-3 sm:grid-cols-2'>
          <label className='text-muted block space-y-1 text-sm'>
            <span>{t('swiftplay.spell1')}</span>
            <div className='flex items-center gap-2'>
              <img
                alt=''
                className='border-border bg-background size-8 rounded-md border object-cover'
                src={summonerSpellUrl(ddragonVersion, selectedSpell1) ?? undefined}
              />
              <select
                className='border-border bg-background text-foreground focus:border-primary focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus:shadow-[0_0_20px_var(--shoma-primary)] focus-visible:ring-2 focus-visible:outline-none'
                onChange={(event) => {
                  setOption(optionIndex, 'spell1Id', event.target.value ? SpellId(Number(event.target.value)) : null)
                }}
                value={option.spell1Id ?? ''}
              >
                <option value=''>{t('swiftplay.chooseSpell')}</option>
                {summonerSpells.map((spell) => (
                  <option key={spell.id} value={spell.id}>
                    {spell.name}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className='text-muted block space-y-1 text-sm'>
            <span>{t('swiftplay.spell2')}</span>
            <div className='flex items-center gap-2'>
              <img
                alt=''
                className='border-border bg-background size-8 rounded-md border object-cover'
                src={summonerSpellUrl(ddragonVersion, selectedSpell2) ?? undefined}
              />
              <select
                className='border-border bg-background text-foreground focus:border-primary focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus:shadow-[0_0_20px_var(--shoma-primary)] focus-visible:ring-2 focus-visible:outline-none'
                onChange={(event) => {
                  setOption(optionIndex, 'spell2Id', event.target.value ? SpellId(Number(event.target.value)) : null)
                }}
                value={option.spell2Id ?? ''}
              >
                <option value=''>{t('swiftplay.chooseSpell')}</option>
                {summonerSpells.map((spell) => (
                  <option key={spell.id} value={spell.id}>
                    {spell.name}
                  </option>
                ))}
              </select>
            </div>
          </label>
        </div>

        <label className='text-muted block space-y-1 text-sm'>
          <span>{t('swiftplay.skin')}</span>
          <select
            className='border-border bg-background text-foreground focus:border-primary focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus:shadow-[0_0_20px_var(--shoma-primary)] focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50'
            disabled={!option.championId || championSkinsQuery.isLoading}
            onChange={(event) => {
              setOption(optionIndex, 'skinId', event.target.value ? Number(event.target.value) : null)
            }}
            value={option.skinId ?? ''}
          >
            <option value=''>{t('swiftplay.chooseSkin')}</option>
            {selectedSkins.map((skin: ChampionSkin) => (
              <option key={skin.id} value={skin.num}>
                {skin.name}
              </option>
            ))}
          </select>
        </label>

        {selectedSkins.length > 0 ? (
          <div className='grid grid-cols-2 gap-2'>
            {selectedSkins.map((skin) => {
              const isSelectedSkin = option.skinId === skin.num

              return (
                <button
                  className={`focus-visible:ring-ring overflow-hidden rounded-md border text-left focus-visible:ring-2 focus-visible:outline-none ${isSelectedSkin ? 'border-primary bg-secondary/60 shadow-[0_0_20px_var(--shoma-primary)]' : 'border-border bg-background'}`}
                  key={skin.id}
                  onClick={() => setOption(optionIndex, 'skinId', skin.num)}
                  type='button'
                >
                  <img
                    alt={skin.name}
                    className='h-20 w-full object-cover'
                    src={championSkinUrl(selectedChampion?.key ?? null, skin.num) ?? undefined}
                  />
                  <div className='text-muted p-2 text-xs'>{skin.name}</div>
                </button>
              )
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function SwiftplayRouteComponent() {
  const { t } = useTranslation()
  const navigate = useNavigate({ from: '/connected/swiftplay' })
  const queryClient = useQueryClient()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const transport = useSharedLCUTransport()
  const ddragonVersion = useLatestDdragonVersion()
  const championsQuery = useChampions()
  const runesQuery = useRunes()
  const spellsQuery = useQuery(createLcuQueryOptions(summonerSpellsDescriptor, transport))
  const perkPagesQuery = useQuery(createLcuQueryOptions(perksPagesDescriptor, transport))
  const option1 = useSwiftplayStore((state) => state.myConfig.option1)
  const option2 = useSwiftplayStore((state) => state.myConfig.option2)
  const isValid = useSwiftplayStore(selectSwiftplayIsValid)
  const errors = useSwiftplayStore(selectSwiftplayErrors)
  const option1SkinsQuery = useChampionSkins(option1.championId ?? undefined)
  const option2SkinsQuery = useChampionSkins(option2.championId ?? undefined)
  const playerSlotsBody = useMemo(
    () =>
      buildPlayerSlotsBody(
        [option1, option2],
        [option1SkinsQuery.data ?? [], option2SkinsQuery.data ?? []],
        perkPagesQuery.data ?? [],
      ),
    [option1, option1SkinsQuery.data, option2, option2SkinsQuery.data, perkPagesQuery.data],
  )
  const setQuickplayPlayerSlotsMutation = useSetQuickplayPlayerSlots(transport, queryClient, playerSlotsBody ?? [])
  const isSubmitDisabled =
    !isValid ||
    championsQuery.isLoading ||
    option1SkinsQuery.isLoading ||
    option2SkinsQuery.isLoading ||
    perkPagesQuery.isLoading ||
    setQuickplayPlayerSlotsMutation.isPending

  async function submitSwiftplayConfig() {
    setSubmitError(null)

    if (!playerSlotsBody) {
      setSubmitError('swiftplay.errors.invalidLcuConfig')
      return
    }

    try {
      await setQuickplayPlayerSlotsMutation.mutateAsync()
      await navigate({ to: '/connected/lobby' })
    } catch {
      setSubmitError('swiftplay.errors.submitFailed')
    }
  }

  return (
    <main className='space-y-4 p-4'>
      <PageHeader title={t('swiftplay.title')} subtitle={isValid ? t('swiftplay.complete') : t('swiftplay.incomplete')} />

      {errors.length > 0 ? (
        <div className='border-destructive bg-destructive/10 text-destructive rounded-md border p-3 text-sm' aria-live='polite'>
          {errors.map((error) => t(error)).join(' ')}
        </div>
      ) : null}

      {submitError ? (
        <div className='border-destructive bg-destructive/10 text-destructive rounded-md border p-3 text-sm' aria-live='polite'>
          {t(submitError)}
        </div>
      ) : null}

      <div className='grid gap-4'>
        <OptionCard
          champions={championsQuery.data}
          ddragonVersion={ddragonVersion.data}
          isLoading={championsQuery.isLoading}
          option={option1}
          optionIndex={1}
          runeTrees={runesQuery.data ?? []}
          summonerSpells={spellsQuery.data ?? []}
        />
        <OptionCard
          champions={championsQuery.data}
          ddragonVersion={ddragonVersion.data}
          isLoading={championsQuery.isLoading}
          option={option2}
          optionIndex={2}
          runeTrees={runesQuery.data ?? []}
          summonerSpells={spellsQuery.data ?? []}
        />
      </div>

      <Button
        className='w-full'
        disabled={isSubmitDisabled}
        onClick={() => {
          void submitSwiftplayConfig()
        }}
        variant='primary'
      >
        {t('swiftplay.enterQueue')}
      </Button>
    </main>
  )
}

export const Route = createFileRoute('/connected/swiftplay')({
  loader: async ({ context }) => {
    await ensureLcuRouteData(context.queryClient, [summonerSpellsDescriptor, perksPagesDescriptor])
  },
  component: SwiftplayRouteComponent,
})
