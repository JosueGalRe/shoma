import { useEffect, useMemo, useRef, useState } from 'react'

import { useTranslation } from 'react-i18next'

import { ScrollArea } from '@/components/ui/scroll-area'
import { useLatestDdragonVersion } from '@/core/http/ddragon'
import { ChampionId, type ChampionId as ChampionIdType } from '@/core/types/branded'
import {
  AramOverlay,
  ChampionGridOverlay,
  DraftActionBar,
  DraftHeader,
  FinalizationView,
  readBanSlots,
  RuneEditor,
  SummonerPicker,
  TeamRoster,
  useChampSelect,
  WardPickerSheet,
} from '@/features/champ-select'

import { champSelectStyles } from './-styles'
import { pickableSet, readDraftActionState, readDraftSubtitle, translatedErrorMessage } from './-utils'

export function ChampSelectRouteComponent() {
  const { t } = useTranslation()
  const ddragonVersion = useLatestDdragonVersion()
  const champSelect = useChampSelect()

  const [isGridOpen, setIsGridOpen] = useState(false)
  const [isAramOpen, setIsAramOpen] = useState(false)
  const [isRunesOpen, setIsRunesOpen] = useState(false)
  const [isWardOpen, setIsWardOpen] = useState(false)
  const hasManuallyClosedGrid = useRef(false)
  const lastActionIdRef = useRef<number | null>(null)

  const sessionPhase = champSelect.session?.timer?.phase ?? ''
  const isFinalization = sessionPhase === 'FINALIZATION' || sessionPhase === 'GAME_STARTING'
  const isBanContext = champSelect.phase === 'ban'

  const selectedChampionSummary =
    champSelect.champions.find((champion) => {
      return champion.id === champSelect.selectedChampion
    }) ?? null

  const hasChosenAramCard = (champSelect.session?.myTeam ?? []).some((member) => {
    return member.cellId === champSelect.localPlayerCellId && (member.championId > 0 || (member.championPickIntent ?? 0) > 0)
  })

  // External system sync: auto-open the grid once per local pick/ban action, preserving manual close.
  useEffect(() => {
    const currentActionId = champSelect.currentAction?.id ?? null

    if (lastActionIdRef.current !== currentActionId) {
      lastActionIdRef.current = currentActionId
      hasManuallyClosedGrid.current = false
    }

    if (
      champSelect.isAram ||
      !champSelect.isMyTurn ||
      !champSelect.currentAction ||
      champSelect.currentAction.completed ||
      (champSelect.currentAction.type !== 'pick' && champSelect.currentAction.type !== 'ban')
    ) {
      setIsGridOpen(false)

      return
    }

    if (!hasManuallyClosedGrid.current) {
      setIsGridOpen(true)
    }
  }, [champSelect.currentAction, champSelect.isAram, champSelect.isMyTurn])

  // External system sync: open the ARAM cards overlay once per draft until a card is chosen.
  useEffect(() => {
    setIsAramOpen(champSelect.isAram && !hasChosenAramCard && !isFinalization && champSelect.aram.cards.length > 0)
  }, [champSelect.aram.cards.length, champSelect.isAram, hasChosenAramCard, isFinalization])

  const disabledChampionIds = useMemo(() => {
    const disabled = new Set<ChampionIdType>()

    for (const id of champSelect.bannedChampions) {
      disabled.add(id)
    }

    for (const member of [...champSelect.team, ...champSelect.enemyTeam]) {
      if (member.championId > 0) {
        disabled.add(ChampionId(member.championId))
      }
    }

    const selectable = isBanContext
      ? pickableSet(champSelect.bannableChampionIds)
      : pickableSet(champSelect.pickableChampionIds)

    if (selectable) {
      for (const champion of champSelect.champions) {
        if (!selectable.has(champion.id)) {
          disabled.add(champion.id)
        }
      }
    }

    return disabled
  }, [
    champSelect.bannableChampionIds,
    champSelect.bannedChampions,
    champSelect.champions,
    champSelect.enemyTeam,
    champSelect.pickableChampionIds,
    champSelect.team,
    isBanContext,
  ])

  const allyBans = readBanSlots(champSelect.actions, true)
  const enemyBans = readBanSlots(champSelect.actions, false)

  const subtitle = readDraftSubtitle({ isMyTurn: champSelect.isMyTurn, phase: champSelect.phase, sessionPhase, t })

  const actionState = readDraftActionState({
    aramCardsCount: champSelect.aram.cards.length,
    hasChosenAramCard,
    isAram: champSelect.isAram,
    isMyTurn: champSelect.isMyTurn,
    onBan: () => {
      if (champSelect.selectedChampion) {
        void champSelect.banChampion(champSelect.selectedChampion)
      }
    },
    onLockIn: () => {
      void champSelect.lockInChampion()
    },
    onOpenAram: () => {
      setIsAramOpen(true)
    },
    onOpenGrid: () => {
      setIsGridOpen(true)
    },
    phase: champSelect.phase,
    selectedChampion: champSelect.selectedChampion,
    sessionPhase,
    t,
  })

  const roleLabel = (position: string | undefined): string | null => {
    if (!position) {
      return null
    }

    return t(`lobby.roles.${position}`, { defaultValue: position })
  }

  const activeTurnCellId = champSelect.currentAction?.actorCellId ?? null

  return (
    <main className="bg-background flex h-[calc(100dvh-4rem)] flex-col overflow-hidden">
      <DraftHeader
        allyBans={allyBans}
        champions={champSelect.champions}
        enemyBans={enemyBans}
        isUrgent={champSelect.timer <= 5 && champSelect.timer > 0}
        subtitle={subtitle}
        timerSeconds={champSelect.timer}
      />

      {champSelect.error || champSelect.aram.error || champSelect.dataError ? (
        <div className={champSelectStyles.errorBanner} aria-live="polite">
          {translatedErrorMessage(t, champSelect.error ?? champSelect.aram.error ?? champSelect.dataError)}
        </div>
      ) : null}

      {isFinalization ? (
        <FinalizationView
          champion={selectedChampionSummary}
          ownedSkinIds={new Set(champSelect.ownedSkinIds)}
          selectedSkinId={champSelect.selection.skinId}
          skins={champSelect.championSkins}
          onSelectSkin={(skinId) => {
            return void champSelect.changeSkin(skinId)
          }}
          title={t('champSelect.chooseLoadout')}
        />
      ) : (
        <ScrollArea className="flex-1 space-y-4 p-3">
          <TeamRoster
            activeCellId={activeTurnCellId}
            champions={champSelect.champions}
            hiddenNameLabel={t('champSelect.hiddenSummoner')}
            isEnemy={false}
            members={champSelect.team}
            roleLabel={roleLabel}
            summonerSpells={champSelect.summonerSpells}
            title={t('champSelect.yourTeam')}
          />

          <TeamRoster
            activeCellId={activeTurnCellId}
            champions={champSelect.champions}
            hiddenNameLabel={t('champSelect.hiddenSummoner')}
            isEnemy
            members={champSelect.enemyTeam}
            roleLabel={roleLabel}
            summonerSpells={champSelect.summonerSpells}
            title={t('champSelect.enemyTeam')}
          />
        </ScrollArea>
      )}

      <DraftActionBar
        actionEnabled={actionState.enabled}
        actionLabel={actionState.label}
        onAction={() => {
          actionState.onAction()
        }}
        onOpenRunes={() => {
          return setIsRunesOpen(true)
        }}
        onOpenWard={() => {
          return setIsWardOpen(true)
        }}
        runesLabel={t('champSelect.runes')}
        spellsContent={
          <SummonerPicker
            compact
            ddragonVersion={ddragonVersion.data}
            onChangeSpell={(slot, spellId) => {
              return void champSelect.changeSpell(slot, spellId)
            }}
            selectedSpell1Id={champSelect.selection.spell1Id}
            selectedSpell2Id={champSelect.selection.spell2Id}
            summonerSpells={champSelect.summonerSpells}
          />
        }
        wardLabel={t('champSelect.wardSkin')}
      />

      <ChampionGridOverlay
        champions={champSelect.champions}
        disabledChampionIds={disabledChampionIds}
        isOpen={isGridOpen}
        onClose={() => {
          hasManuallyClosedGrid.current = true
          setIsGridOpen(false)
        }}
        onSelectChampion={(championId) => {
          void champSelect.selectChampionForTurn(championId)
        }}
        selectedChampionId={champSelect.selectedChampion}
        title={isBanContext ? t('champSelect.banAChampion') : t('champSelect.pickAChampion')}
      />

      <AramOverlay
        bench={champSelect.aram.bench}
        cards={champSelect.aram.cards}
        champions={champSelect.champions}
        hasChosenCard={hasChosenAramCard}
        isOpen={isAramOpen}
        isSwapping={champSelect.aram.isLoading}
        onClose={() => {
          return setIsAramOpen(false)
        }}
        onSelectCard={(championId) => {
          void champSelect.selectChampionForTurn(championId)
        }}
        onSwapBench={(championId) => {
          void champSelect.aram.swapBench(championId)
        }}
        title={t('aram.cards.title')}
      />

      <RuneEditor
        isOpen={isRunesOpen}
        onClose={() => {
          return setIsRunesOpen(false)
        }}
        runeTrees={champSelect.runeTrees}
      />

      <WardPickerSheet
        isOpen={isWardOpen}
        onClose={() => {
          return setIsWardOpen(false)
        }}
        onSelect={(wardSkinId) => {
          void champSelect.changeWardSkin(wardSkinId)
        }}
        selectedWardSkinId={champSelect.selection.wardSkinId}
        wardSkins={champSelect.wardSkins}
      />
    </main>
  )
}
