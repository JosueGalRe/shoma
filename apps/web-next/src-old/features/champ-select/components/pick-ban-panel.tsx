import { LcuHttpMethod, LcuPaths } from '@mimic/protocol-contract'
import { AlertTriangle, Search, Lock } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createLCUClient } from '@core/rift/lcu-transport'
import { formatSeconds } from '@core/rift/rift-lcu-utils'
import { useLCURequest } from '@core/rift/hooks'
import {
  buildChampionOptions,
  canSwapBenchChampion,
  getBenchChampionOptions,
  getBannedChampionIds,
  getMemberByCellId,
  getPickedChampionIds,
  getTurnState,
  resolveTimeoutAction,
  type ChampionOption,
  type PickBanPhase,
} from '../pick-ban-logic'
import { useChampSelectStore } from '../champ-select-store'
import { useChampSelect } from '../use-champ-select'

const fallbackChampionIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
const timeoutWarningThreshold = 5
const benchClient = createLCUClient({ connectOnCreate: false })

function formatChampionName(championId: number): string {
  return championId > 0 ? `Champion ${championId}` : 'Unpicked'
}

function phaseLabel(phase: PickBanPhase): string {
  return phase === 'ban' ? 'Ban' : phase === 'pick' ? 'Pick' : 'Waiting'
}

function championStatusLabel(option: ChampionOption, phase: PickBanPhase): string {
  if (option.availability === 'picked') {
    return 'Picked'
  }

  if (option.availability === 'banned') {
    return 'Banned'
  }

  if (option.availability === 'bench') {
    return 'On bench'
  }

  if (option.availability === 'disabled') {
    return phase === 'ban' ? 'Not bannable' : phase === 'pick' ? 'Not pickable' : 'Unavailable'
  }

  return `Tap to select`
}

export function PickBanPanel() {
  const { ban, champSelectState, error, hover, isLoading, pick, timer } = useChampSelect()
  const { currentAction, isMyTurn, myTeam, phase: storePhase, theirTeam } = useChampSelectStore()
  const pickableRequest = useLCURequest<number[]>(LcuPaths.champSelect.pickableChampionIds, LcuHttpMethod.GET)
  const bannableRequest = useLCURequest<number[]>(LcuPaths.champSelect.bannableChampionIds, LcuHttpMethod.GET)
  const [benchError, setBenchError] = useState<Error | null>(null)
  const [benchPendingChampionId, setBenchPendingChampionId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLocking, setIsLocking] = useState(false)
  const lockTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const handledTimeoutActionId = useRef<number | null>(null)
  const turnState = useMemo(() => getTurnState(champSelectState), [champSelectState])
  const phase = turnState.phase === 'idle' && (storePhase === 'ban' || storePhase === 'pick') ? storePhase : turnState.phase
  const pickableChampionIds = pickableRequest.data ?? []
  const bannableChampionIds = bannableRequest.data ?? []
  const allChampionIds = useMemo(
    () => [...fallbackChampionIds, ...pickableChampionIds, ...bannableChampionIds, ...(champSelectState?.benchChampionIds ?? [])],
    [bannableChampionIds, champSelectState?.benchChampionIds, pickableChampionIds],
  )
  const championOptions = useMemo(
    () =>
      buildChampionOptions({
        allChampionIds,
        bannableChampionIds,
        phase,
        pickableChampionIds,
        session: champSelectState,
      }),
    [allChampionIds, bannableChampionIds, champSelectState, phase, pickableChampionIds],
  )
  const pickedChampionIds = useMemo(() => getPickedChampionIds(champSelectState), [champSelectState])
  const bannedChampionIds = useMemo(() => getBannedChampionIds(champSelectState), [champSelectState])
  const benchChampionIds = useMemo(() => getBenchChampionOptions(champSelectState), [champSelectState])
  const canAct = isMyTurn && turnState.isLocalTurn && Boolean(currentAction) && !isLoading
  const timeoutWarning = timer > 0 && timer <= timeoutWarningThreshold && canAct
  const activeActor = turnState.activeAction ? getMemberByCellId(champSelectState, turnState.activeAction.actorCellId) : null
  const actionLabel = phaseLabel(phase)

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return championOptions
    const query = searchQuery.toLowerCase()
    return championOptions.filter(opt => formatChampionName(opt.championId).toLowerCase().includes(query))
  }, [championOptions, searchQuery])

  useEffect(() => {
    const timeout = resolveTimeoutAction({
      fallbackChampionIds,
      pickableChampionIds,
      session: champSelectState,
      timer,
    })

    if (!timeout.shouldCommit || !timeout.action || timeout.championId === null) {
      return
    }

    if (handledTimeoutActionId.current === timeout.action.id) {
      return
    }

    handledTimeoutActionId.current = timeout.action.id
    void (timeout.action.type === 'ban' ? ban(timeout.championId) : pick(timeout.championId))
  }, [ban, champSelectState, pick, pickableChampionIds, timer])

  async function swapBenchChampion(championId: number): Promise<void> {
    if (!canSwapBenchChampion(champSelectState, championId)) {
      return
    }

    setBenchError(null)
    setBenchPendingChampionId(championId)
    try {
      const result = await benchClient.request(LcuPaths.champSelect.benchSwap(championId), LcuHttpMethod.POST)
      if (result.status < 200 || result.status >= 300) {
        throw new Error(`Bench swap failed (${result.status}).`)
      }
    } catch (error) {
      setBenchError(error instanceof Error ? error : new Error('Bench swap failed.'))
    } finally {
      setBenchPendingChampionId(null)
    }
  }

  const handleLockStart = () => {
    if (!canAct || !currentAction?.championId) return
    setIsLocking(true)
    if (navigator.vibrate) navigator.vibrate(50)
    
    lockTimeoutRef.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate([100, 50, 100])
      void (phase === 'ban' ? ban(currentAction.championId) : pick(currentAction.championId))
      setIsLocking(false)
    }, 800)
  }

  const handleLockEnd = () => {
    if (lockTimeoutRef.current) {
      clearTimeout(lockTimeoutRef.current)
      lockTimeoutRef.current = null
    }
    setIsLocking(false)
  }

  return (
    <main className='relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] pb-24'>
      <Card className='border-gold-dim/30 bg-card/80 backdrop-blur-md shadow-xl overflow-hidden'>
        <CardHeader className='border-b border-gold-dim/20 bg-background/50 sticky top-0 z-20 backdrop-blur-xl'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
            <CardTitle className='font-display text-sm tracking-[0.25em] text-primary uppercase'>Champ Select</CardTitle>
            <div className='relative w-full sm:w-64'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search champions...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-9 h-10 bg-background/80 border-gold-dim/30 focus:border-primary rounded-xl'
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className='p-4 sm:p-6 space-y-6'>
          <section className='rounded-2xl border border-gold-dim/30 bg-background/60 p-6 text-center shadow-inner'>
            <p className='text-sm tracking-[0.2em] text-muted-foreground uppercase font-semibold'>{actionLabel} phase</p>
            <p className={`mt-4 font-mono text-7xl font-bold drop-shadow-[0_0_20px_rgba(200,169,110,0.4)] ${timer <= 10 ? 'text-destructive animate-pulse' : 'text-primary'}`}>
              {formatSeconds(timer)}
            </p>
            <p className='mt-4 text-sm text-muted-foreground'>
              {canAct
                ? 'Your turn. Select a champion, then long-press Lock In.'
                : activeActor
                  ? `${activeActor.displayName ?? `Cell ${activeActor.cellId}`} is choosing now.`
                  : 'Waiting for the active pick/ban turn.'}
            </p>
          </section>

          {timeoutWarning ? (
            <div className='flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive animate-pulse'>
              <AlertTriangle className='h-5 w-5 shrink-0' />
              <span>Timer is expiring. A random pick or empty ban will be submitted at zero.</span>
            </div>
          ) : null}

          {error ?? benchError ? (
            <div className='rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive'>
              {(error ?? benchError)?.message}
            </div>
          ) : null}

          <section aria-label='Champion grid' className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'>
            {filteredOptions.map((option) => {
              const selected = pickedChampionIds.has(option.championId) || bannedChampionIds.has(option.championId)
              const disabled = !canAct || !option.isActionable
              const isHovered = currentAction?.championId === option.championId

              return (
                <button
                  aria-pressed={selected || isHovered}
                  className={`relative flex flex-col items-center justify-center min-h-[120px] rounded-xl border-2 p-3 text-center transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
                    isHovered
                      ? 'border-primary bg-primary/20 shadow-[0_0_15px_rgba(10,200,185,0.3)] scale-105 z-10'
                      : selected 
                        ? 'border-border bg-background/40 opacity-50' 
                        : 'border-gold-dim/20 bg-card/60 hover:border-primary/50 hover:bg-primary/5'
                  }`}
                  disabled={disabled}
                  key={option.championId}
                  onClick={() => {
                    if (!disabled) {
                      void hover(option.championId)
                      if (navigator.vibrate) navigator.vibrate(20)
                    }
                  }}
                  type='button'
                >
                  <div className={`w-14 h-14 rounded-full mb-3 border-2 ${isHovered ? 'border-primary' : 'border-transparent'} bg-muted/20 flex items-center justify-center overflow-hidden`}>
                    <span className='text-sm font-bold text-muted-foreground'>{option.championId}</span>
                  </div>
                  <span className={`block font-display text-xs sm:text-sm tracking-wider uppercase truncate w-full ${isHovered ? 'text-primary font-bold' : 'text-foreground'}`}>
                    {formatChampionName(option.championId)}
                  </span>
                  <span className='mt-1.5 block text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest'>{championStatusLabel(option, phase)}</span>
                </button>
              )
            })}
          </section>
        </CardContent>
      </Card>

      <aside className='space-y-6'>
        <Card className='border-gold-dim/30 bg-card/80 backdrop-blur-md'>
          <CardHeader>
            <CardTitle className='font-display text-sm tracking-[0.25em] text-primary uppercase'>Teams</CardTitle>
          </CardHeader>
          <CardContent className='space-y-6 text-sm'>
            <div>
              <p className='mb-3 text-xs tracking-[0.2em] text-muted-foreground uppercase font-semibold'>Your team</p>
              <ul className='space-y-2'>
                {myTeam.map((member) => (
                  <li className='flex items-center justify-between rounded-xl border border-gold-dim/20 bg-background/50 p-3' key={member.cellId}>
                    <span className='font-semibold'>{member.displayName ?? `Cell ${member.cellId}`}</span>
                    <span className='text-primary font-display tracking-wider text-xs uppercase'>{formatChampionName(member.championId || member.championPickIntent || 0)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className='mb-3 text-xs tracking-[0.2em] text-muted-foreground uppercase font-semibold'>Enemy team</p>
              <ul className='space-y-2'>
                {theirTeam.map((member, index) => (
                  <li className='flex items-center justify-between rounded-xl border border-destructive/20 bg-background/50 p-3' key={member.cellId}>
                    <span className='font-semibold'>{member.displayName ?? `Summoner ${index + 1}`}</span>
                    <span className='text-destructive font-display tracking-wider text-xs uppercase'>{member.championId ? formatChampionName(member.championId) : 'Hidden'}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className='border-gold-dim/30 bg-card/80 backdrop-blur-md'>
          <CardHeader>
            <CardTitle className='font-display text-sm tracking-[0.25em] text-primary uppercase'>Bench</CardTitle>
          </CardHeader>
          <CardContent>
            {benchChampionIds.length > 0 ? (
              <div className='flex flex-wrap gap-2'>
                {benchChampionIds.map((championId) => (
                  <Button
                    disabled={benchPendingChampionId !== null}
                    key={championId}
                    onClick={() => {
                      void swapBenchChampion(championId)
                    }}
                    size='sm'
                    type='button'
                    variant='outline'
                    className='rounded-xl border-gold-dim/30 hover:border-primary hover:text-primary'
                  >
                    {benchPendingChampionId === championId ? 'Swapping...' : formatChampionName(championId)}
                  </Button>
                ))}
              </div>
            ) : (
              <p className='text-sm text-muted-foreground italic'>Bench champions appear here for ARAM sessions.</p>
            )}
          </CardContent>
        </Card>
      </aside>

      {canAct && (
        <div className='fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-xl border-t border-gold-dim/30 z-50 flex justify-center animate-in slide-in-from-bottom-full'>
          <div className='w-full max-w-md relative'>
            <div 
              className={`absolute inset-0 bg-primary/20 rounded-2xl transition-all duration-800 ease-linear ${isLocking ? 'w-full' : 'w-0'}`}
            />
            <Button 
              className={`w-full h-16 text-xl font-display tracking-widest uppercase rounded-2xl relative overflow-hidden transition-all ${
                currentAction?.championId 
                  ? phase === 'ban' 
                    ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-[0_0_20px_rgba(211,47,47,0.4)]' 
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(10,200,185,0.4)]'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
              disabled={!currentAction?.championId}
              onPointerDown={handleLockStart}
              onPointerUp={handleLockEnd}
              onPointerLeave={handleLockEnd}
              type='button'
            >
              <Lock className='mr-3 h-5 w-5' />
              {currentAction?.championId 
                ? isLocking ? 'Keep holding...' : `Long Press to ${actionLabel}`
                : `Select a champion to ${actionLabel}`
              }
            </Button>
          </div>
        </div>
      )}
    </main>
  )
}
