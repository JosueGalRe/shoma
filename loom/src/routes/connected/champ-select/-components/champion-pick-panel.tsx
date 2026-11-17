import { useState } from 'react'

import { useToast } from '@shoma/ui/use-toast'
import { create, props } from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { createLcuQueryOptions, queueChampionsDescriptor } from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'
import { ChampionId } from '@/core/types/branded'
import { ChampionGrid } from '@/features/champ-select/components/champion-grid'

import { BanIntentModal } from './ban-intent-modal'
import { BanRow } from './ban-row'
import { ChampSelectAction } from './champ-select-action'
import { readBanIntent } from './champ-select-screen-utils'

import type { ChampionPickPanelProps } from './champ-select-screen-types'

// Figma "Champion Selection": the grid in each turn. A tap hovers the champion, as the client does: in the player's
// Ban or pick it's the turn's choice, before it the declared intent the team sees. CONFIRM bans and LOCK IN picks,
// Only in the player's turn, and a ban of a champion someone on the team declared asks first, as the client does
export function ChampionPickPanel({ actionSlot, champSelect, stage }: ChampionPickPanelProps) {
  const { t } = useTranslation()
  const transport = useSharedLCUTransport()
  const toast = useToast()
  const [isSending, setIsSending] = useState(false)
  const [isBanIntentOpen, setIsBanIntentOpen] = useState(false)
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

  const banIntent = isBan ? readBanIntent(session, value) : null
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

  function ban() {
    void send(() => {
      return champSelect.banChampion(ChampionId(value))
    })
  }

  function handleAction() {
    if (isBan) {
      if (banIntent) {
        setIsBanIntentOpen(true)

        return
      }

      ban()

      return
    }

    void send(champSelect.lockInChampion, () => {
      toast.add({ title: t('champSelect.championLocked'), type: 'success' })
    })
  }

  return (
    <div {...props(styles.root)}>
      <BanRow champSelect={champSelect} />

      <ChampionGrid
        disabledIds={disabledIds}
        isLoaded={isBan ? champSelect.champions.length > 0 : queueChampions.isSuccess}
        options={options}
        value={value}
        onPick={(championId) => {
          void champSelect.selectChampionForTurn(ChampionId(championId))

          // The client's tooltip on its disabled ban button
          if (isBan && readBanIntent(session, championId)?.isForbidden) {
            toast.add({ id: 'ban-intent-blocked', title: t('champSelect.banIntent.blocked'), type: 'info' })
          }
        }}
      />

      <ChampSelectAction
        // A hover the turn can't take (banned or picked meanwhile) waits for another tap
        disabled={isSending || value <= 0 || !isTurn || disabledIds.has(value) || banIntent?.isForbidden === true}
        label={t(isBan ? 'createLobby.confirm' : 'champSelect.lockIn')}
        slot={actionSlot}
        onClick={handleAction}
      />

      <BanIntentModal
        allyName={banIntent?.isAlly ? banIntent.declarer.gameName || t('champSelect.hiddenSummoner') : null}
        open={isBanIntentOpen}
        onBan={ban}
        onOpenChange={setIsBanIntentOpen}
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
