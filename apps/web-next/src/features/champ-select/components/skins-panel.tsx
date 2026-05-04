import { LcuHttpMethod } from '@mimic/protocol-contract'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLCURequest } from '@core/rift/hooks'
import { useChampSelectStore } from '../champ-select-store'
import { skinRequestPaths, type ChampionSkin, useSkinsStore } from '../skins-store'

function skinLabel(skinId: number | null, skins: ChampionSkin[]): string {
  if (!skinId) {
    return 'Default'
  }

  return skins.find((skin) => skin.id === skinId)?.name ?? `Skin ${skinId}`
}

export function SkinsPanel() {
  const { currentAction, localPlayerCellId, myTeam } = useChampSelectStore()
  const localPlayer = useMemo(() => myTeam.find((member) => member.cellId === localPlayerCellId) ?? null, [localPlayerCellId, myTeam])
  const summonerId = localPlayer?.summonerId ?? 0
  const inventoryRequest = useLCURequest<ChampionSkin[]>(skinRequestPaths.inventorySkinsMinimal(summonerId), LcuHttpMethod.GET)
  const { currentChampion, error, ownedSkins, selectSkin, selectedSkin, setChampion, setSkinData, setSkinError } = useSkinsStore()
  const championId = currentAction?.championId || localPlayer?.championId || localPlayer?.championPickIntent || 0

  useEffect(() => {
    setChampion(championId)
  }, [championId, setChampion])

  useEffect(() => {
    setSkinData({ selectedSkin: localPlayer?.selectedSkinId ?? null, skins: inventoryRequest.data })
  }, [inventoryRequest.data, localPlayer?.selectedSkinId, setSkinData])

  useEffect(() => {
    if (inventoryRequest.error) {
      setSkinError(inventoryRequest.error)
    }
  }, [inventoryRequest.error, setSkinError])

  if (!currentChampion) return null

  return (
    <Card className='border-gold-dim/30 bg-card/80 backdrop-blur-md shadow-xl overflow-hidden'>
      <CardHeader className='border-b border-gold-dim/20 bg-background/50'>
        <CardTitle className='font-display text-sm tracking-[0.25em] text-primary uppercase'>Skins</CardTitle>
      </CardHeader>
      <CardContent className='p-0'>
        <div className='p-6 border-b border-gold-dim/20 bg-background/30'>
          <p className='text-xs tracking-[0.2em] text-muted-foreground uppercase font-semibold'>Selected skin</p>
          <p className='mt-2 font-display text-2xl text-primary drop-shadow-[0_0_10px_rgba(10,200,185,0.3)]'>{skinLabel(selectedSkin, ownedSkins)}</p>
        </div>

        {inventoryRequest.isLoading ? (
          <div className='p-6'>
            <p className='text-sm text-muted-foreground'>Loading owned skins from the League client...</p>
          </div>
        ) : null}

        {error ? (
          <div className='p-6'>
            <div className='flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive'>
              <AlertTriangle className='h-5 w-5 shrink-0' />
              <span>{error.message}</span>
            </div>
          </div>
        ) : null}

        <section aria-label='Owned skins' className='flex overflow-x-auto snap-x snap-mandatory hide-scrollbar p-6 gap-4 pb-8'>
          {ownedSkins.map((skin) => {
            const selected = selectedSkin === skin.id

            return (
              <button
                aria-pressed={selected}
                className={`relative flex-none w-48 h-64 rounded-2xl border-2 p-4 text-left transition-all duration-300 snap-center disabled:cursor-not-allowed disabled:opacity-60 overflow-hidden group ${
                  selected ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(10,200,185,0.3)] scale-105 z-10' : 'border-gold-dim/30 bg-background/60 hover:border-primary/50 hover:bg-primary/5'
                }`}
                disabled={selected}
                key={skin.id}
                onClick={() => {
                  void selectSkin(skin.id)
                }}
                type='button'
              >
                <div className='absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10' />
                
                <div className='absolute bottom-0 left-0 right-0 p-4 z-20'>
                  <span className={`block font-display text-sm tracking-widest uppercase ${selected ? 'text-primary font-bold' : 'text-foreground'}`}>{skin.name}</span>
                  <span className='mt-2 flex items-center gap-2 text-xs text-emerald-400 font-semibold'>
                    <CheckCircle2 className='h-3.5 w-3.5' /> Owned{skin.isBase ? ' default' : ''}
                  </span>
                </div>
              </button>
            )
          })}
        </section>

        {ownedSkins.length === 0 && !inventoryRequest.isLoading ? (
          <div className='p-6'>
            <p className='text-sm text-muted-foreground'>No owned skins are available for this champion yet.</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
