import { LcuHttpMethod } from '@mimic/protocol-contract'
import { AlertTriangle, LockKeyhole, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useLCURequest } from '@core/rift/hooks'
import { useChampSelectStore } from '../champ-select-store'
import { summonerRequestPaths, type ChampSelectRole, type SummonerSpell, useSummonersStore } from '../summoners-store'

type GameflowSession = {
  gameData?: {
    queue?: {
      gameMode?: string
    }
  }
}

function spellLabel(spellId: number | null, spells: SummonerSpell[]): string {
  if (!spellId) {
    return 'Empty'
  }

  return spells.find((spell) => spell.id === spellId)?.name ?? `Spell ${spellId}`
}

function roleLabel(role: ChampSelectRole): string {
  if (!role) {
    return 'No role assigned'
  }

  return role === 'utility' ? 'Support' : role[0]?.toUpperCase() + role.slice(1)
}

export function SummonersPanel() {
  const spellsRequest = useLCURequest<SummonerSpell[]>(summonerRequestPaths.spells, LcuHttpMethod.GET)
  const gameflowRequest = useLCURequest<GameflowSession>(summonerRequestPaths.gameflowSession, LcuHttpMethod.GET)
  const { currentAction, localPlayerCellId, myTeam } = useChampSelectStore()
  const {
    availableSpells,
    error,
    gameMode,
    role,
    selectSpell1,
    selectSpell2,
    selectedSpell1,
    selectedSpell2,
    setRole,
    setSummonerData,
    setSummonerError,
  } = useSummonersStore()
  const localPlayer = useMemo(() => myTeam.find((member) => member.cellId === localPlayerCellId) ?? null, [localPlayerCellId, myTeam])
  const assignedRole = (localPlayer?.assignedPosition ?? '') as ChampSelectRole
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setRole(assignedRole)
  }, [assignedRole, setRole])

  useEffect(() => {
    setSummonerData({
      gameMode: gameflowRequest.data?.gameData?.queue?.gameMode,
      selectedSpell1: localPlayer?.spell1Id ?? null,
      selectedSpell2: localPlayer?.spell2Id ?? null,
      spells: spellsRequest.data,
    })
  }, [gameflowRequest.data, localPlayer?.spell1Id, localPlayer?.spell2Id, setSummonerData, spellsRequest.data])

  useEffect(() => {
    const requestError = spellsRequest.error ?? gameflowRequest.error
    if (requestError) {
      setSummonerError(requestError)
    }
  }, [gameflowRequest.error, setSummonerError, spellsRequest.error])

  const isLoading = spellsRequest.isLoading || gameflowRequest.isLoading
  const activeSlotLabel = currentAction?.type === 'pick' || currentAction?.type === 'ban' ? 'Champ select active' : 'Waiting'

  return (
    <>
      <Button
        variant='outline'
        className='w-full h-16 flex justify-between items-center px-6 border-gold-dim/30 bg-card/80 hover:bg-background/60 hover:border-primary/50 transition-all rounded-xl backdrop-blur-md'
        onClick={() => setIsOpen(true)}
      >
        <span className='font-display text-sm uppercase tracking-[0.1em] text-primary'>
          Spells
        </span>
        <div className='flex items-center gap-3'>
          <span className='text-sm font-semibold text-foreground'>
            {spellLabel(selectedSpell1, availableSpells)} / {spellLabel(selectedSpell2, availableSpells)}
          </span>
          <span className='text-muted-foreground'>›</span>
        </div>
      </Button>

      {isOpen && (
        <div className='fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200'>
          <div className='absolute inset-0' onClick={() => setIsOpen(false)} />
          <div className='relative bg-card border-t border-gold-dim/30 rounded-t-3xl p-6 pb-safe animate-in slide-in-from-bottom-full duration-300 max-h-[85vh] overflow-y-auto'>
            <div className='sticky top-0 bg-card z-10 pb-4 mb-4 border-b border-gold-dim/20 flex justify-between items-center'>
              <h2 className='font-display text-xl text-primary uppercase tracking-widest'>
                Summoner Spells
              </h2>
              <Button variant='ghost' size='icon' onClick={() => setIsOpen(false)} className='rounded-full'>
                <X className='h-6 w-6' />
              </Button>
            </div>

            <div className='space-y-6'>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='rounded-2xl border border-primary/50 bg-primary/10 p-5 shadow-inner'>
                  <p className='text-xs tracking-[0.2em] text-muted-foreground uppercase font-semibold'>Slot 1</p>
                  <p className='mt-2 font-display text-2xl text-primary drop-shadow-[0_0_10px_rgba(10,200,185,0.3)]'>{spellLabel(selectedSpell1, availableSpells)}</p>
                </div>
                <div className='rounded-2xl border border-primary/50 bg-primary/10 p-5 shadow-inner'>
                  <p className='text-xs tracking-[0.2em] text-muted-foreground uppercase font-semibold'>Slot 2</p>
                  <p className='mt-2 font-display text-2xl text-primary drop-shadow-[0_0_10px_rgba(10,200,185,0.3)]'>{spellLabel(selectedSpell2, availableSpells)}</p>
                </div>
              </div>

              <div className='flex flex-wrap items-center gap-3 text-xs text-muted-foreground'>
                <span className='rounded-full border border-gold-dim/30 bg-background/50 px-4 py-2 font-semibold'>Mode: {gameMode}</span>
                <span className='rounded-full border border-gold-dim/30 bg-background/50 px-4 py-2 font-semibold'>Role: {roleLabel(role)}</span>
                <span className='rounded-full border border-gold-dim/30 bg-background/50 px-4 py-2 font-semibold'>{activeSlotLabel}</span>
                {role !== 'jungle' ? (
                  <span className='inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 text-destructive px-4 py-2 font-semibold'>
                    <LockKeyhole className='h-3.5 w-3.5' /> Smite locked
                  </span>
                ) : null}
              </div>

              {isLoading ? <p className='text-sm text-muted-foreground'>Loading summoner spells from the League client...</p> : null}

              {error ? (
                <div className='flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive'>
                  <AlertTriangle className='h-5 w-5 shrink-0' />
                  <span>{error.message}</span>
                </div>
              ) : null}

              <section aria-label='Available summoner spells' className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4'>
                {availableSpells.map((spell) => {
                  const selectedFirst = selectedSpell1 === spell.id
                  const selectedSecond = selectedSpell2 === spell.id
                  const isSelected = selectedFirst || selectedSecond

                  return (
                    <div className={`rounded-2xl border-2 p-4 transition-all ${isSelected ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(10,200,185,0.15)]' : 'border-gold-dim/30 bg-background/60 hover:border-primary/50'}`} key={spell.id}>
                      <p className={`font-display text-sm tracking-[0.18em] uppercase ${isSelected ? 'text-primary font-bold' : 'text-foreground'}`}>{spell.name}</p>
                      <p className='mt-2 min-h-8 text-xs text-muted-foreground font-medium'>{selectedFirst ? 'Selected in slot 1' : selectedSecond ? 'Selected in slot 2' : 'Available'}</p>
                      <div className='mt-4 grid grid-cols-2 gap-3'>
                        <button
                          aria-pressed={selectedFirst}
                          className={`rounded-xl border-2 px-2 py-3 text-xs font-bold transition-all disabled:opacity-40 ${selectedFirst ? 'border-primary bg-primary/20 text-primary' : 'border-border bg-background/50 hover:border-primary/50'}`}
                          disabled={selectedFirst}
                          onClick={() => {
                            void selectSpell1(spell.id)
                          }}
                          type='button'
                        >
                          Slot 1
                        </button>
                        <button
                          aria-pressed={selectedSecond}
                          className={`rounded-xl border-2 px-2 py-3 text-xs font-bold transition-all disabled:opacity-40 ${selectedSecond ? 'border-primary bg-primary/20 text-primary' : 'border-border bg-background/50 hover:border-primary/50'}`}
                          disabled={selectedSecond}
                          onClick={() => {
                            void selectSpell2(spell.id)
                          }}
                          type='button'
                        >
                          Slot 2
                        </button>
                      </div>
                    </div>
                  )
                })}
              </section>

              {availableSpells.length === 0 && !isLoading ? <p className='text-sm text-muted-foreground'>No summoner spells are available for this queue and role.</p> : null}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
