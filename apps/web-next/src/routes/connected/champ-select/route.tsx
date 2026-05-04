import { createFileRoute } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useChampSelect, type ChampSelectMember } from '@/features/champ-select'

function formatTimer(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

function championSplashUrl(championKey: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championKey}_0.jpg`
}

function memberLabel(member: ChampSelectMember): string {
  return member.displayName ?? `Cell ${member.cellId}`
}

function TeamPanel({ members, title }: { members: ChampSelectMember[]; title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {members.length === 0 ? <p className="text-sm text-gray-500">No players yet.</p> : null}
        {members.map((member) => (
          <div className="rounded-md border border-gray-800 p-2" key={member.cellId}>
            <div className="text-sm font-medium">{memberLabel(member)}</div>
            <div className="text-xs text-gray-500">
              Champion {member.championId || member.championPickIntent || 'pending'}
              {member.assignedPosition ? ` · ${member.assignedPosition}` : ''}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function ChampSelectRouteComponent() {
  const champSelect = useChampSelect()
  const selectedChampion = champSelect.champions.find((champion) => champion.id === champSelect.selectedChampion) ?? null
  const pickedChampionIds = new Set([
    ...champSelect.team.map((member) => member.championId).filter((championId) => championId > 0),
    ...champSelect.enemyTeam.map((member) => member.championId).filter((championId) => championId > 0),
  ])
  const selectedRuneTree = champSelect.runeTrees.find((tree) => tree.id === champSelect.selection.runeId) ?? null

  return (
    <main className="space-y-4 pb-8">
      <Card>
        <CardHeader>
          <CardTitle>Champ Select</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div>
            <div className="text-xs uppercase text-gray-500">Phase</div>
            <div className="text-lg font-semibold capitalize">{champSelect.phase}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-gray-500">Timer</div>
            <div className="font-mono text-3xl font-bold">{formatTimer(champSelect.timer)}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-gray-500">Turn</div>
            <div className={champSelect.isMyTurn ? 'text-lg font-semibold text-green-500' : 'text-lg font-semibold text-gray-500'}>
              {champSelect.isMyTurn ? 'Your turn' : 'Waiting'}
            </div>
          </div>
        </CardContent>
      </Card>

      {(champSelect.error || champSelect.aram.error || champSelect.dataError) ? (
        <div className="rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">
          {(champSelect.error ?? champSelect.aram.error ?? champSelect.dataError)?.message}
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Card>
          <CardHeader>
            <CardTitle>Champions</CardTitle>
          </CardHeader>
          <CardContent>
            {champSelect.isLoading ? <p className="text-sm text-gray-500">Loading champions...</p> : null}
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
                    <img alt="" className="h-20 w-full object-cover" src={championSplashUrl(champion.key)} />
                    <div className="p-2">
                      <div className="truncate text-sm font-medium">{champion.name}</div>
                      <div className="text-xs text-gray-500">{isBanned ? 'Banned' : isPicked ? 'Picked' : isSelected ? 'Selected' : 'Available'}</div>
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
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md border border-gray-800 p-3">
                <div className="text-sm font-medium">{selectedChampion?.name ?? 'No champion selected'}</div>
                <div className="text-xs text-gray-500">{selectedChampion?.title ?? 'Select a champion when it is your turn.'}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button disabled={!champSelect.isMyTurn || champSelect.phase !== 'pick' || !champSelect.selectedChampion} onClick={() => void champSelect.lockInChampion()}>
                  Lock In
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
                  Ban
                </Button>
              </div>
            </CardContent>
          </Card>

          {champSelect.isAram ? (
            <Card>
              <CardHeader>
                <CardTitle>ARAM Bench</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button disabled={!champSelect.aram.canReroll || champSelect.aram.isLoading} onClick={() => void champSelect.aram.reroll()}>
                  Reroll ({champSelect.aram.rerollCount})
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  {champSelect.aram.bench.map((championId) => (
                    <Button key={championId} onClick={() => void champSelect.aram.swapBench(championId)} size="sm" variant="secondary">
                      Champion {championId}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Loadout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="block text-sm">
                Spell 1
                <select
                  className="mt-1 w-full rounded-md border border-gray-800 bg-gray-950 p-2"
                  onChange={(event) => champSelect.changeSpell(1, Number(event.target.value))}
                  value={champSelect.selection.spell1Id ?? ''}
                >
                  <option value="">Choose spell</option>
                  {champSelect.summonerSpells.map((spell) => (
                    <option key={spell.id} value={spell.id}>{spell.name}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                Spell 2
                <select
                  className="mt-1 w-full rounded-md border border-gray-800 bg-gray-950 p-2"
                  onChange={(event) => champSelect.changeSpell(2, Number(event.target.value))}
                  value={champSelect.selection.spell2Id ?? ''}
                >
                  <option value="">Choose spell</option>
                  {champSelect.summonerSpells.map((spell) => (
                    <option key={spell.id} value={spell.id}>{spell.name}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                Skin
                <select
                  className="mt-1 w-full rounded-md border border-gray-800 bg-gray-950 p-2"
                  onChange={(event) => champSelect.changeSkin(Number(event.target.value))}
                  value={champSelect.selection.skinId ?? ''}
                >
                  <option value="">Default skin</option>
                  {champSelect.championSkins.map((skin) => (
                    <option key={skin.id} value={skin.id}>{skin.name}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                Runes
                <select
                  className="mt-1 w-full rounded-md border border-gray-800 bg-gray-950 p-2"
                  onChange={(event) => champSelect.changeRune(Number(event.target.value))}
                  value={champSelect.selection.runeId ?? ''}
                >
                  <option value="">Choose rune tree</option>
                  {champSelect.runeTrees.map((tree) => (
                    <option key={tree.id} value={tree.id}>{tree.name}</option>
                  ))}
                </select>
              </label>
              {selectedRuneTree ? <p className="text-xs text-gray-500">Selected rune tree: {selectedRuneTree.name}</p> : null}
            </CardContent>
          </Card>
        </aside>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <TeamPanel members={champSelect.team} title="Ally Team" />
        <TeamPanel members={champSelect.enemyTeam} title="Enemy Team" />
      </section>
    </main>
  )
}

export const Route = createFileRoute('/connected/champ-select')({
  component: ChampSelectRouteComponent,
})
