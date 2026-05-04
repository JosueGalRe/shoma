import { useEffect } from 'react'
import { Layers } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useChampSelectStore, type ChampSelectSession } from '../champ-select-store'
import { useAramStore } from '../aram-store'

type AramSessionFields = {
  rerollRemaining?: number
}

function formatChampionName(championId: number): string {
  return championId > 0 ? `Champion ${championId}` : 'Unpicked'
}

export function AramPanel() {
  const { champSelectState, benchChampionIds: sessionBenchIds } = useChampSelectStore()
  const {
    cards,
    benchChampionIds,
    error,
    isLoading,
    selectFromBench,
    selectedCard,
    setBenchChampionIds,
    setCards,
    setSelectedCard,
  } = useAramStore()

  const aramSession = champSelectState as (ChampSelectSession & AramSessionFields) | null

  useEffect(() => {
    setBenchChampionIds(sessionBenchIds)
  }, [sessionBenchIds, setBenchChampionIds])

  useEffect(() => {
    const remaining = aramSession?.rerollRemaining ?? 0
    setCards(remaining)
  }, [aramSession?.rerollRemaining, setCards])

  useEffect(() => {
    const localPlayerChampionId =
      champSelectState?.myTeam?.find((member) => member.cellId === champSelectState?.localPlayerCellId)
        ?.championId ?? null

    if (localPlayerChampionId && localPlayerChampionId > 0) {
      setSelectedCard(localPlayerChampionId)
    }
  }, [champSelectState, setSelectedCard])

  const canReroll = cards > 0 && !isLoading

  return (
    <Card className='border-gold-dim/30 bg-card/80 backdrop-blur-md shadow-xl overflow-hidden'>
      <CardHeader className='border-b border-gold-dim/20 bg-background/50'>
        <CardTitle className='font-display text-sm tracking-[0.25em] text-primary uppercase flex items-center gap-2'>
          <Layers className='h-4 w-4' />
          ARAM
        </CardTitle>
      </CardHeader>
      <CardContent className='p-6 space-y-6'>
        <div className='flex flex-col sm:flex-row gap-4'>
          <div className='flex-1 rounded-2xl border border-primary/50 bg-primary/10 p-6 shadow-inner flex flex-col items-center justify-center'>
            <p className='text-xs tracking-[0.2em] text-muted-foreground uppercase font-semibold'>Champion Cards</p>
            <p className='mt-2 font-display text-5xl text-primary drop-shadow-[0_0_15px_rgba(10,200,185,0.4)]'>{cards}</p>
          </div>

          <Button
            className='flex-1 h-auto min-h-[100px] whitespace-nowrap px-4 font-display text-xl sm:text-2xl tracking-widest uppercase rounded-2xl bg-gradient-to-r from-primary to-teal-dim hover:from-teal hover:to-primary shadow-[0_0_20px_rgba(10,200,185,0.2)] transition-all hover:scale-[1.02]'
            disabled={!canReroll}
            onClick={() => {
              void useAramStore.getState().useRerollCard()
            }}
            type='button'
          >
            {isLoading ? 'Drawing...' : 'New Cards'}
          </Button>
        </div>

        {error ? (
          <div className='rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive animate-shake'>
            {error.message}
          </div>
        ) : null}

        <section aria-label='Bench champions' className='rounded-2xl border border-gold-dim/30 bg-background/60 p-6'>
          <p className='mb-4 text-xs tracking-[0.2em] text-muted-foreground uppercase font-semibold'>Bench</p>
          {benchChampionIds.length > 0 ? (
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'>
              {benchChampionIds.map((championId) => {
                const isSelected = selectedCard === championId

                return (
                  <button
                    disabled={isLoading}
                    key={championId}
                    onClick={() => {
                      void selectFromBench(championId)
                    }}
                    type='button'
                    className={`relative flex flex-col items-center justify-center min-h-[80px] rounded-xl border-2 p-3 text-center transition-all duration-200 disabled:opacity-50 ${
                      isSelected
                        ? 'border-primary bg-primary/20 shadow-[0_0_15px_rgba(10,200,185,0.3)] scale-105 z-10'
                        : 'border-gold-dim/20 bg-card/60 hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    <span className={`block font-display text-xs tracking-wider uppercase truncate w-full ${isSelected ? 'text-primary font-bold' : 'text-foreground'}`}>
                      {formatChampionName(championId)}
                    </span>
                    <span className='mt-1 block text-[10px] text-muted-foreground uppercase tracking-widest'>
                      {isSelected ? 'Selected' : 'Available'}
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center py-8 text-center'>
              <Layers className='h-8 w-8 text-muted-foreground/30 mb-3' />
              <p className='text-sm text-muted-foreground italic'>No champion cards on the bench.</p>
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  )
}
