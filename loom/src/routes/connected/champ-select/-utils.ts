import type { ChampionId as ChampionIdType } from '@/core/types/branded'

export function translatedErrorMessage(t: (key: string) => string, error: string | null): string | null {
  return error ? t(error) : null
}

export function pickableSet(ids: ChampionIdType[]): ReadonlySet<ChampionIdType> | null {
  const filtered = ids.filter((id) => {
    return id > 0
  })

  return filtered.length > 0 ? new Set(filtered) : null
}

type Translate = (key: string) => string

export function readDraftSubtitle({
  t,
  sessionPhase,
  phase,
  isMyTurn,
}: {
  t: Translate
  sessionPhase: string
  phase: 'pick' | 'ban' | 'waiting'
  isMyTurn: boolean
}): string {
  if (sessionPhase === 'GAME_STARTING') {
    return t('champSelect.gameStarting')
  }

  if (sessionPhase === 'FINALIZATION') {
    return t('champSelect.chooseLoadout')
  }

  if (phase === 'ban') {
    return isMyTurn ? t('champSelect.yourTurnBan') : t('champSelect.waitingTurn')
  }

  if (phase === 'pick') {
    return isMyTurn ? t('champSelect.yourTurnPick') : t('champSelect.waitingTurn')
  }

  return t('champSelect.declareChampion')
}

export interface DraftActionState {
  enabled: boolean
  label: string
  onAction: () => void
}

export function readDraftActionState({
  t,
  isAram,
  hasChosenAramCard,
  aramCardsCount,
  phase,
  sessionPhase,
  isMyTurn,
  selectedChampion,
  onOpenAram,
  onOpenGrid,
  onBan,
  onLockIn,
}: {
  t: Translate
  isAram: boolean
  hasChosenAramCard: boolean
  aramCardsCount: number
  phase: 'pick' | 'ban' | 'waiting'
  sessionPhase: string
  isMyTurn: boolean
  selectedChampion: ChampionIdType | null
  onOpenAram: () => void
  onOpenGrid: () => void
  onBan: () => void
  onLockIn: () => void
}): DraftActionState {
  if (sessionPhase === 'FINALIZATION' || sessionPhase === 'GAME_STARTING') {
    return {
      enabled: false,
      label: t(sessionPhase === 'GAME_STARTING' ? 'champSelect.gameStarting' : 'champSelect.waitingTurn'),
      onAction: () => {},
    }
  }

  if (isAram && !hasChosenAramCard) {
    return { enabled: aramCardsCount > 0, label: t('champSelect.chooseCard'), onAction: onOpenAram }
  }

  if (phase === 'ban' && isMyTurn) {
    if (selectedChampion === null) {
      return { enabled: true, label: t('champSelect.banAChampion'), onAction: onOpenGrid }
    }

    return { enabled: true, label: t('champSelect.ban'), onAction: onBan }
  }

  if (phase === 'pick' && isMyTurn) {
    if (selectedChampion === null) {
      return { enabled: true, label: t('champSelect.pickAChampion'), onAction: onOpenGrid }
    }

    return { enabled: true, label: t('champSelect.lockIn'), onAction: onLockIn }
  }

  if (phase === 'waiting' || phase === 'pick') {
    return { enabled: true, label: t('champSelect.declareChampion'), onAction: onOpenGrid }
  }

  return {
    enabled: false,
    label: t('champSelect.waitingTurn'),
    onAction: () => {},
  }
}
