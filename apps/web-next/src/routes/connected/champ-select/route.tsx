import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLatestDdragonVersion } from '@/core/http/ddragon-client'
import { useChampSelect, type ChampSelectMember, type SummonerSpell } from '@/features/champ-select'

function formatTimer(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

function championSplashUrl(version: string | undefined, championKey: string): string | null {
  if (!version) {
    return null
  }

  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/splash/${championKey}_0.jpg`
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
  if (!spell) {
    return null
  }

  if (!version) {
    return null
  }

  const imageName = summonerSpellImageNames[spell.name]
  if (!imageName) {
    return null
  }

  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${imageName}`
}

function runeUrl(version: string | undefined, runeId: number | null): string | null {
  if (!version || runeId === null) {
    return null
  }

  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/perk/${runeId}.png`
}

function championSkinUrl(version: string | undefined, championKey: string | null, skinNum: number | null): string | null {
  if (!version || !championKey || skinNum === null) {
    return null
  }

  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/loading/${championKey}_${skinNum}.jpg`
}

function translatedErrorMessage(t: (key: string) => string, error: string | null): string | null {
  return error ? t(error) : null
}

function memberLabel(member: ChampSelectMember): string {
  return member.displayName ?? `#${member.cellId}`
}

function TeamPanel({
  championLabel,
  emptyLabel,
  members,
  title,
}: {
  championLabel: string
  emptyLabel: string
  members: ChampSelectMember[]
  title: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {members.length === 0 ? <p className="text-sm text-gray-500">{emptyLabel}</p> : null}
        {members.map((member) => (
          <div className="rounded-md border border-gray-800 p-2" key={member.cellId}>
            <div className="text-sm font-medium">{memberLabel(member)}</div>
            <div className="text-xs text-gray-500">
              {championLabel}: {member.championId || member.championPickIntent || '—'}
              {member.assignedPosition ? ` · ${member.assignedPosition}` : ''}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function ChampSelectRouteComponent() {
  const { t } = useTranslation()
  const ddragonVersion = useLatestDdragonVersion()
  const champSelect = useChampSelect()
  const selectedChampion = champSelect.champions.find((champion) => champion.id === champSelect.selectedChampion) ?? null
  const selectedSpell1 = champSelect.summonerSpells.find((spell) => spell.id === champSelect.selection.spell1Id) ?? null
  const selectedSpell2 = champSelect.summonerSpells.find((spell) => spell.id === champSelect.selection.spell2Id) ?? null
  const pickedChampionIds = new Set([
    ...champSelect.team.map((member) => member.championId).filter((championId) => championId > 0),
    ...champSelect.enemyTeam.map((member) => member.championId).filter((championId) => championId > 0),
  ])
  const selectedRuneTree = champSelect.runeTrees.find((tree) => tree.id === champSelect.selection.runeId) ?? null
  const selectedSkins = champSelect.championSkins

  return (
    <main className="space-y-4 pb-8">
      <Card>
        <CardHeader>
          <CardTitle>{t('champSelect.title')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div>
            <div className="text-xs uppercase text-gray-500">{t('champSelect.phase')}</div>
            <div className="text-lg font-semibold capitalize">
              {champSelect.phase === 'ban' ? t('champSelect.ban') : champSelect.phase === 'pick' ? t('champSelect.pick') : t('champSelect.waiting')}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase text-gray-500">{t('champSelect.timeLeft')}</div>
            <div className="font-mono text-3xl font-bold">{formatTimer(champSelect.timer)}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-gray-500">{t('champSelect.pick')}</div>
            <div className={champSelect.isMyTurn ? 'text-lg font-semibold text-green-500' : 'text-lg font-semibold text-gray-500'}>
              {champSelect.isMyTurn ? t('champSelect.yourTurn') : t('champSelect.waiting')}
            </div>
          </div>
        </CardContent>
      </Card>

      {(champSelect.error || champSelect.aram.error || champSelect.dataError) ? (
        <div className="rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">
          {translatedErrorMessage(t, champSelect.error ?? champSelect.aram.error ?? champSelect.dataError)}
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Card>
          <CardHeader>
            <CardTitle>{t('champSelect.champions')}</CardTitle>
          </CardHeader>
          <CardContent>
            {champSelect.isLoading ? <p className="text-sm text-gray-500">{t('champSelect.loadingChampions')}</p> : null}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {champSelect.champions.map((champion) => {
                const isSelected = champSelect.selectedChampion === champion.id
                const isBanned = champSelect.bannedChampions.includes(champion.id)
                const isPicked = pickedChampionIds.has(champion.id)
                const isDisabled = !champSelect.isMyTurn || isBanned || isPicked

                return (
                  <button
                    className={`overflow-hidden rounded-md border text-left disabled:opacity-50 ${isSelected ? 'border-blue-500 bg-blue-950/40' : 'border-gray-800 bg-gray-950'}`}
                    disabled={isDisabled}
                    key={champion.id}
                    onClick={() => {
                      void champSelect.selectChampionForTurn(champion.id)
                    }}
                    type="button"
                    >
                      <img alt="" className="h-20 w-full object-cover" src={championSplashUrl(ddragonVersion.data, champion.key) ?? undefined} />
                      <div className="p-2">
                        <div className="truncate text-sm font-medium">{champion.name}</div>
                        <div className="text-xs text-gray-500">
                          {isBanned ? t('champSelect.banned') : isPicked ? t('champSelect.picked') : isSelected ? t('champSelect.selected') : t('champSelect.available')}
                        </div>
                      </div>
                    </button>
                  )
              })}
            </div>
          </CardContent>
        </Card>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('champSelect.actions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md border border-gray-800 p-3">
                <div className="text-sm font-medium">{selectedChampion?.name ?? t('champSelect.noChampionSelected')}</div>
                <div className="text-xs text-gray-500">{selectedChampion?.title ?? t('champSelect.selectChampionHint')}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button disabled={!champSelect.isMyTurn || champSelect.phase !== 'pick' || !champSelect.selectedChampion} onClick={() => void champSelect.lockInChampion()}>
                  {t('champSelect.lockIn')}
                </Button>
                <Button
                  disabled={!champSelect.isMyTurn || champSelect.phase !== 'ban' || !champSelect.selectedChampion}
                  onClick={() => {
                    if (champSelect.selectedChampion) {
                      void champSelect.banChampion(champSelect.selectedChampion)
                    }
                  }}
                  variant="destructive"
                >
                  {t('champSelect.ban')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {champSelect.isAram ? (
            <Card>
              <CardHeader>
                <CardTitle>{t('champSelect.bench')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button disabled={!champSelect.aram.canReroll || champSelect.aram.isLoading} onClick={() => void champSelect.aram.reroll()}>
                  {t('champSelect.reroll')} ({champSelect.aram.rerollCount})
                </Button>
                  <div className="grid grid-cols-2 gap-2">
                  {champSelect.aram.bench.map((championId) => (
                    <Button key={championId} onClick={() => void champSelect.aram.swapBench(championId)} size="sm" variant="secondary">
                      {t('champSelect.championLabel', { value: championId })}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>{t('champSelect.loadout')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-200">{t('champSelect.spells')}</div>
                <label className="block text-sm">
                  {t('champSelect.spell1')}
                  <div className="mt-1 flex items-center gap-2">
                    <img
                      alt=""
                      className="h-8 w-8 rounded-md border border-gray-800 bg-gray-950 object-cover"
                      src={summonerSpellUrl(ddragonVersion.data, selectedSpell1) ?? undefined}
                    />
                    <select
                      className="w-full rounded-md border border-gray-800 bg-gray-950 p-2"
                      onChange={(event) => champSelect.changeSpell(1, Number(event.target.value))}
                      value={champSelect.selection.spell1Id ?? ''}
                    >
                      <option value="">{t('champSelect.chooseSpell')}</option>
                      {champSelect.summonerSpells.map((spell) => (
                        <option key={spell.id} value={spell.id}>{spell.name}</option>
                      ))}
                    </select>
                  </div>
                </label>
                <label className="block text-sm">
                  {t('champSelect.spell2')}
                  <div className="mt-1 flex items-center gap-2">
                    <img
                      alt=""
                      className="h-8 w-8 rounded-md border border-gray-800 bg-gray-950 object-cover"
                      src={summonerSpellUrl(ddragonVersion.data, selectedSpell2) ?? undefined}
                    />
                    <select
                      className="w-full rounded-md border border-gray-800 bg-gray-950 p-2"
                      onChange={(event) => champSelect.changeSpell(2, Number(event.target.value))}
                      value={champSelect.selection.spell2Id ?? ''}
                    >
                      <option value="">{t('champSelect.chooseSpell')}</option>
                      {champSelect.summonerSpells.map((spell) => (
                        <option key={spell.id} value={spell.id}>{spell.name}</option>
                      ))}
                    </select>
                  </div>
                </label>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-200">{t('champSelect.runes')}</div>
                <label className="block text-sm">
                  {t('champSelect.chooseRune')}
                  <select
                    className="mt-1 w-full rounded-md border border-gray-800 bg-gray-950 p-2"
                    onChange={(event) => champSelect.changeRune(Number(event.target.value))}
                    value={champSelect.selection.runeId ?? ''}
                  >
                    <option value="">{t('champSelect.chooseRune')}</option>
                    {champSelect.runeTrees.map((tree) => (
                      <option key={tree.id} value={tree.id}>{tree.name}</option>
                    ))}
                  </select>
                </label>

                <div className="flex flex-wrap gap-2">
                  {(selectedRuneTree?.slots.flatMap((slot) => slot.runes) ?? champSelect.runeTrees.flatMap((tree) => tree.slots.flatMap((slot) => slot.runes))).slice(0, 12).map((rune) => (
                    <img
                      alt={rune.name}
                      className="h-8 w-8 rounded-md border border-gray-800 bg-gray-950 object-cover"
                      key={rune.id}
                      src={runeUrl(ddragonVersion.data, rune.id) ?? undefined}
                      title={rune.name}
                    />
                  ))}
                </div>

                {selectedRuneTree ? <p className="text-xs text-gray-500">{selectedRuneTree.name}</p> : null}
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-200">{t('champSelect.skins')}</div>
                <select
                  className="w-full rounded-md border border-gray-800 bg-gray-950 p-2"
                  onChange={(event) => champSelect.changeSkin(Number(event.target.value))}
                  value={champSelect.selection.skinId ?? ''}
                >
                  <option value="">{t('champSelect.chooseSkin')}</option>
                  {selectedSkins.map((skin) => (
                    <option key={skin.id} value={skin.num}>{skin.name}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  {selectedSkins.map((skin) => {
                    const skinNumber = Number(skin.num)
                    const isSelectedSkin = champSelect.selection.skinId === skinNumber

                    return (
                      <button
                        className={`overflow-hidden rounded-md border text-left ${isSelectedSkin ? 'border-blue-500 bg-blue-950/40' : 'border-gray-800 bg-gray-950'}`}
                        key={skin.id}
                        onClick={() => champSelect.changeSkin(skinNumber)}
                        type="button"
                      >
                        <img
                          alt={skin.name}
                          className="h-20 w-full object-cover"
                          src={championSkinUrl(ddragonVersion.data, selectedChampion?.key ?? null, skinNumber) ?? undefined}
                        />
                        <div className="p-2 text-xs text-gray-300">{skin.name}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <TeamPanel championLabel={t('champSelect.champion')} emptyLabel={t('champSelect.noPlayersYet')} members={champSelect.team} title={t('champSelect.allyTeam')} />
        <TeamPanel championLabel={t('champSelect.champion')} emptyLabel={t('champSelect.noPlayersYet')} members={champSelect.enemyTeam} title={t('champSelect.enemyTeam')} />
      </section>
    </main>
  )
}

export const Route = createFileRoute('/connected/champ-select')({
  component: ChampSelectRouteComponent,
})
