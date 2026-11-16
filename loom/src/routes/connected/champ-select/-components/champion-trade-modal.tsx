import { useState } from 'react'

import { Button } from '@shoma/ui/button'
import { Modal } from '@shoma/ui/modal'
import { useToast } from '@shoma/ui/use-toast'
import { useTranslation } from 'react-i18next'

import type { ChampionTradeModalProps } from './champ-select-screen-types'
import type { ChampionSwapCall } from '@/features/champ-select'

// Figma "Swap for Camille?" (413:9473), both ways: an ally asking for the player's champion (accept or decline), which
// Shows over any tab, and the player's own ask from the teams' trade button, sent once confirmed
export function ChampionTradeModal({ askedTradeId, champSelect, onAskedChange }: ChampionTradeModalProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const [isSending, setIsSending] = useState(false)
  const received = champSelect.trades.find(({ state }) => {
    return state === 'RECEIVED'
  })
  const asked = champSelect.trades.find(({ id, state }) => {
    return id === askedTradeId && state === 'AVAILABLE'
  })
  const trade = received ?? asked
  // The last one asked stays named while the modal fades out
  const [shownCellId, setShownCellId] = useState<number | null>(null)

  if (trade && trade.cellId !== shownCellId) {
    setShownCellId(trade.cellId)
  }

  const ally = champSelect.team.find(({ cellId }) => {
    return cellId === shownCellId
  })
  const allyChampionId = ally ? ally.championId || ally.championPickIntent || 0 : 0
  const champion =
    champSelect.champions.find(({ id }) => {
      return id === allyChampionId
    })?.name ?? ''

  async function send(call: ChampionSwapCall) {
    if (!trade) {
      return
    }

    setIsSending(true)

    const ok = await champSelect.swapChampion(trade.id, call)

    setIsSending(false)

    if (!ok) {
      toast.add({ title: t('errors.generic'), type: 'error' })
    }
  }

  function dismiss() {
    if (received) {
      void send('decline')

      return
    }

    onAskedChange(null)
  }

  return (
    <Modal
      open={trade !== undefined}
      title={t('champSelect.trade.title', { champion })}
      onOpenChange={(open) => {
        if (!open) {
          dismiss()
        }
      }}
    >
      <Button
        disabled={isSending}
        onClick={() => {
          void send(received ? 'accept' : 'request')
          onAskedChange(null)
        }}
      >
        {t('champSelect.trade.accept')}
      </Button>

      <Button disabled={isSending} variant="secondary" onClick={dismiss}>
        {t('common.cancel')}
      </Button>
    </Modal>
  )
}
