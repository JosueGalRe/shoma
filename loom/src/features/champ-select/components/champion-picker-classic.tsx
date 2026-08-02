import { useState } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChampionId, type ChampionId as ChampionIdType } from '@/core/types/branded'

import { useChampSelectStore } from '../champ-select-store'
import { useChampionPreview } from '../hooks/use-champion-preview'

import { AbilityPreviewSheet } from './ability-preview-sheet'
import { ChampionGridCard } from './champion-grid-card'
import {
  championPickerAramStyles,
  championPickerCardStyles,
  championPickerFilterStyles,
  championPickerToastStyles,
} from './champion-picker-styles'
import { filterChampions } from './champion-picker-utils'

import type { ChampionPickerBranchProps } from './champion-picker-branch-types'

export function ChampionPickerClassic({ query, sortOrder, activeRoleFilter, filters, t }: ChampionPickerBranchProps) {
  const bannedChampions = useChampSelectStore((state) => {
    return state.bannedChampions
  })
  const champions = useChampSelectStore((state) => {
    return state.champions
  })
  const enemyTeam = useChampSelectStore((state) => {
    return state.enemyTeam
  })
  const isLoading = useChampSelectStore((state) => {
    return state.isLoading
  })
  const isMyTurn = useChampSelectStore((state) => {
    return state.isMyTurn
  })
  const phase = useChampSelectStore((state) => {
    return state.phase
  })
  const selectedChampionId = useChampSelectStore((state) => {
    return state.selectedChampion
  })
  const team = useChampSelectStore((state) => {
    return state.team
  })

  const { closePreview, handleLongPressDown, handleLongPressUp, isLongPressTriggered, isPreviewOpen, previewChampionKey } =
    useChampionPreview()
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const aramStyles = championPickerAramStyles()
  const cardStyles = championPickerCardStyles()

  const bannedChampionIds = new Set(bannedChampions)
  const selectedChampion =
    champions.find((champion) => {
      return champion.id === selectedChampionId
    }) ?? null
  const pickedChampionIds = new Set<ChampionIdType>()
  const allyPickIntents = new Set<ChampionIdType>()

  for (const member of team) {
    if (member.championId > 0) {
      pickedChampionIds.add(ChampionId(member.championId))
    }

    if (member.championPickIntent && member.championPickIntent > 0) {
      allyPickIntents.add(ChampionId(member.championPickIntent))
    }
  }

  for (const member of enemyTeam) {
    if (member.championId > 0) {
      pickedChampionIds.add(ChampionId(member.championId))
    }
  }

  const visibleChampions = filterChampions({ activeRoleFilter, champions, query, sortOrder })

  const showToast = (message: string) => {
    setToastMessage(message)

    setTimeout(() => {
      setToastMessage(null)
    }, 3000)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('champSelect.champions')}</CardTitle>
        </CardHeader>

        <CardContent className={championPickerFilterStyles().root()}>
          {filters}

          {isLoading ? <p className={aramStyles.description()}>{t('champSelect.loadingChampions')}</p> : null}

          <div className={cardStyles.grid()}>
            {visibleChampions.map((champion) => {
              return (
                <ChampionGridCard
                  key={champion.id}
                  champion={champion}
                  isMyTurn={isMyTurn}
                  phase={phase}
                  selectedChampion={selectedChampion}
                  bannedChampionIds={bannedChampionIds}
                  pickedChampionIds={pickedChampionIds}
                  allyPickIntents={allyPickIntents}
                  isLongPressTriggered={isLongPressTriggered}
                  onLongPressDown={handleLongPressDown}
                  onLongPressUp={handleLongPressUp}
                  onShowToast={showToast}
                  t={t}
                />
              )
            })}
          </div>
        </CardContent>
      </Card>

      <AbilityPreviewSheet championKey={previewChampionKey} isOpen={isPreviewOpen} onClose={closePreview} />

      {toastMessage && <div className={championPickerToastStyles()}>{toastMessage}</div>}
    </>
  )
}
