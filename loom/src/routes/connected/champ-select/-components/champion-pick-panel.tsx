import { useState } from 'react'

import { useToast } from '@shoma/ui/use-toast'
import { create, props } from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { createLcuQueryOptions, queueChampionsDescriptor } from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'
import { ChampionId } from '@/core/types/branded'
import { ChampionGrid } from '@/features/champ-select/components/champion-grid'

import { ChampSelectAction } from './champ-select-action'

import type { ChampionPickPanelProps } from './champ-select-screen-types'

// Figma "Champion Selection": the grid in each turn. A tap hovers the champion, as the client does: in the player's
// Ban or pick it's the turn's choice, before it the declared intent the team sees. CONFIRM bans and LOCK IN picks,
// Only in the player's turn
export function ChampionPickPanel({ actionSlot, champSelect, stage }: ChampionPickPanelProps) {
  const { t } = useTranslation()
  const transport = useSharedLCUTransport()
  const toast = useToast()
  const [isSending, setIsSending] = useState(false)
  const { session } = champSelect
  const local = champSelect.team.find((member) => {
    return member.cellId === champSelect.localPlayerCellId
  })
  const summonerId = local?.summonerId ?? 0
  const queueId = session?.queueId ?? 0
  const queueChampions = useQuery({
    ...createLcuQueryOptions(queueChampionsDescriptor(summonerId, queueId), transport),
    enabled: Boolean(transport && summonerId && queueId),
  })
  const isBan = stage === 'ban'
  const isTurn = isBan || stage === 'pick'
  const value = champSelect.selectedChampion ?? 0
  const options = isBan ? champSelect.champions : (queueChampions.data ?? [])
  const allowed = new Set<number>(isBan ? champSelect.bannableChampionIds : champSelect.pickableChampionIds)
  const taken = new Set<number>(champSelect.bannedChampions)

  for (const member of [...champSelect.team, ...champSelect.enemyTeam]) {
    if (member.championId > 0) {
      taken.add(member.championId)
    }
  }

  const disabledIds = new Set(
    options.flatMap((option) => {
      return taken.has(option.id) || (allowed.size > 0 && !allowed.has(option.id)) ? [option.id] : []
    }),
  )

  async function send(action: () => Promise<boolean>, onDone?: () => void) {
    setIsSending(true)

    const ok = await action()

    setIsSending(false)

    if (ok) {
      onDone?.()

      return
    }

    toast.add({ title: t('errors.generic'), type: 'error' })
  }

  function handleAction() {
    if (stage === 'ban') {
      void send(() => {
        return champSelect.banChampion(ChampionId(value))
      })

      return
    }

    void send(champSelect.lockInChampion, () => {
      toast.add({ title: t('champSelect.championLocked'), type: 'success' })
    })
  }

  return (
    <div {...props(styles.root)}>
      <ChampionGrid
        disabledIds={disabledIds}
        isLoaded={isBan ? champSelect.champions.length > 0 : queueChampions.isSuccess}
        options={options}
        value={value}
        onPick={(championId) => {
          void champSelect.selectChampionForTurn(ChampionId(championId))
        }}
      />

      <ChampSelectAction
        // A hover the turn can't take (banned or picked meanwhile) waits for another tap
        disabled={isSending || value <= 0 || !isTurn || disabledIds.has(value)}
        label={t(isBan ? 'createLobby.confirm' : 'champSelect.lockIn')}
        slot={actionSlot}
        onClick={handleAction}
      />
    </div>
  )
}

const styles = create({
  // Figma "Body": 16 above and below, 24 at the sides, 32 between the search and the grid
  root: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    gap: 32,
    minHeight: 0,
    paddingBlock: 16,
    paddingInline: 24,
  },
})
