import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { LcuHttpMethod, LcuPaths } from '@mimic/protocol-contract'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { useChampionSkins, useChampions, useLatestDdragonVersion, useRunes, type ChampionSkin, type RuneTree } from '@/core/http/ddragon-client'
import { useLCURequest, useLCUTransport, useRiftClient } from '@/core/rift'
import { useRiftStore } from '@/core/state/rift-store'
import { type SummonerSpell } from '@/features/champ-select'
import { useSwiftplayStore, type SwiftplayOption } from '@/features/swiftplay/swiftplay-store'

const positions = [
  { labelKey: 'swiftplay.positions.top', value: 'top' },
  { labelKey: 'swiftplay.positions.jungle', value: 'jungle' },
  { labelKey: 'swiftplay.positions.middle', value: 'middle' },
  { labelKey: 'swiftplay.positions.bottom', value: 'bottom' },
  { labelKey: 'swiftplay.positions.utility', value: 'utility' },
  { labelKey: 'swiftplay.positions.fill', value: 'fill' },
] as const

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

function championSkinUrl(version: string | undefined, championKey: string | null, skinNum: number | null): string | null {
  if (!version || !championKey || skinNum === null) {
    return null
  }

  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/loading/${championKey}_${skinNum}.jpg`
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
        <CardTitle>{t(optionIndex === 1 ? 'swiftplay.option1' : 'swiftplay.option2')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <label className="block space-y-1 text-sm text-gray-300">
          <span>{t('swiftplay.champion')}</span>
          <select
            className="h-10 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-sm text-white disabled:opacity-50"
            disabled={!champions}
            onChange={(event) => {
              setOption(optionIndex, 'championId', event.target.value ? Number(event.target.value) : null)
              setOption(optionIndex, 'skinId', null)
            }}
            value={option.championId ?? ''}
          >
            <option value="">{isLoading ? t('common.loading') : t('swiftplay.champion')}</option>
            {champions?.map((champion) => (
              <option key={champion.id} value={champion.id}>
                {champion.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1 text-sm text-gray-300">
          <span>{t('swiftplay.position')}</span>
          <select
            className="h-10 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-sm text-white"
            onChange={(event) => {
              setOption(optionIndex, 'position', event.target.value || null)
            }}
            value={option.position ?? ''}
          >
            <option value="">{t('swiftplay.position')}</option>
            {positions.map((position) => (
              <option key={position.value} value={position.value}>
                {t(position.labelKey)}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1 text-sm text-gray-300">
          <span>{t('swiftplay.rune')}</span>
          <div className="flex items-center gap-2">
            <img alt="" className="h-8 w-8 rounded-md border border-gray-800 bg-gray-950 object-cover" src={runeTreeUrl(ddragonVersion, selectedRuneTree) ?? undefined} />
            <select
              className="h-10 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-sm text-white"
              onChange={(event) => {
                setOption(optionIndex, 'runeId', event.target.value ? Number(event.target.value) : null)
              }}
              value={option.runeId ?? ''}
            >
              <option value="">{t('swiftplay.chooseRune')}</option>
              {runeTrees.map((tree) => (
                <option key={tree.id} value={tree.id}>
                  {tree.name}
                </option>
              ))}
            </select>
          </div>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1 text-sm text-gray-300">
            <span>{t('swiftplay.spell1')}</span>
            <div className="flex items-center gap-2">
              <img alt="" className="h-8 w-8 rounded-md border border-gray-800 bg-gray-950 object-cover" src={summonerSpellUrl(ddragonVersion, selectedSpell1) ?? undefined} />
              <select
                className="h-10 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-sm text-white"
                onChange={(event) => {
                  setOption(optionIndex, 'spell1Id', event.target.value ? Number(event.target.value) : null)
                }}
                value={option.spell1Id ?? ''}
              >
                <option value="">{t('swiftplay.chooseSpell')}</option>
                {summonerSpells.map((spell) => (
                  <option key={spell.id} value={spell.id}>
                    {spell.name}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className="block space-y-1 text-sm text-gray-300">
            <span>{t('swiftplay.spell2')}</span>
            <div className="flex items-center gap-2">
              <img alt="" className="h-8 w-8 rounded-md border border-gray-800 bg-gray-950 object-cover" src={summonerSpellUrl(ddragonVersion, selectedSpell2) ?? undefined} />
              <select
                className="h-10 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-sm text-white"
                onChange={(event) => {
                  setOption(optionIndex, 'spell2Id', event.target.value ? Number(event.target.value) : null)
                }}
                value={option.spell2Id ?? ''}
              >
                <option value="">{t('swiftplay.chooseSpell')}</option>
                {summonerSpells.map((spell) => (
                  <option key={spell.id} value={spell.id}>
                    {spell.name}
                  </option>
                ))}
              </select>
            </div>
          </label>
        </div>

        <label className="block space-y-1 text-sm text-gray-300">
          <span>{t('swiftplay.skin')}</span>
          <select
            className="h-10 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-sm text-white disabled:opacity-50"
            disabled={!option.championId || championSkinsQuery.isLoading}
            onChange={(event) => {
              setOption(optionIndex, 'skinId', event.target.value ? Number(event.target.value) : null)
            }}
            value={option.skinId ?? ''}
          >
            <option value="">{t('swiftplay.chooseSkin')}</option>
            {selectedSkins.map((skin: ChampionSkin) => (
              <option key={skin.id} value={skin.num}>
                {skin.name}
              </option>
            ))}
          </select>
        </label>

        {selectedSkins.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {selectedSkins.map((skin) => {
              const isSelectedSkin = option.skinId === skin.num

              return (
                <button
                  className={`overflow-hidden rounded-md border text-left ${isSelectedSkin ? 'border-blue-500 bg-blue-950/40' : 'border-gray-800 bg-gray-950'}`}
                  key={skin.id}
                  onClick={() => setOption(optionIndex, 'skinId', skin.num)}
                  type="button"
                >
                  <img alt={skin.name} className="h-20 w-full object-cover" src={championSkinUrl(ddragonVersion, selectedChampion?.key ?? null, skin.num) ?? undefined} />
                  <div className="p-2 text-xs text-gray-300">{skin.name}</div>
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
  const navigate = useNavigate()
  const code = useRiftStore((state) => state.code)
  const status = useRiftStore((state) => state.status)
  const shouldConnect = status === 'connecting' || status === 'connected'
  const clientOptions = useMemo(() => ({ code, enabled: shouldConnect && code.length > 0 }), [code, shouldConnect])
  const { client } = useRiftClient(clientOptions)
  const transport = useLCUTransport(client)
  const ddragonVersion = useLatestDdragonVersion()
  const championsQuery = useChampions()
  const runesQuery = useRunes()
  const spellsRequest = useLCURequest<SummonerSpell[]>(transport, LcuPaths.assetServing.summonerSpells, LcuHttpMethod.GET)
  const option1 = useSwiftplayStore((state) => state.myConfig.option1)
  const option2 = useSwiftplayStore((state) => state.myConfig.option2)
  const isValid = useSwiftplayStore((state) => state.isValid)
  const errors = useSwiftplayStore((state) => state.errors)

  return (
    <main className="space-y-4">
      <section className="space-y-1">
        <h2 className="text-xl font-bold text-white">{t('swiftplay.title')}</h2>
        <p className="text-sm text-gray-400">{isValid ? t('swiftplay.complete') : t('swiftplay.incomplete')}</p>
      </section>

      {errors.length > 0 ? (
        <div className="rounded-md border border-red-700 bg-red-950/40 p-3 text-sm text-red-200">
          {errors.map((error) => t(error)).join(' ')}
        </div>
      ) : null}

      <div className="grid gap-4">
        <OptionCard champions={championsQuery.data} ddragonVersion={ddragonVersion.data} isLoading={championsQuery.isLoading} option={option1} optionIndex={1} runeTrees={runesQuery.data ?? []} summonerSpells={spellsRequest.data ?? []} />
        <OptionCard champions={championsQuery.data} ddragonVersion={ddragonVersion.data} isLoading={championsQuery.isLoading} option={option2} optionIndex={2} runeTrees={runesQuery.data ?? []} summonerSpells={spellsRequest.data ?? []} />
      </div>

      <Button
        className="w-full"
        disabled={!isValid || championsQuery.isLoading}
        onClick={() => {
          void navigate({ to: '/connected/lobby' })
        }}
        variant="primary"
      >
        {t('swiftplay.enterQueue')}
      </Button>
    </main>
  )
}

export const Route = createFileRoute('/connected/swiftplay')({
  component: SwiftplayRouteComponent,
})
