import { useState } from 'react'

import { Radio, RadioGroup } from '@shoma/ui/radio-group'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { useChampions, useRunes } from '@/core/http/ddragon'
import { readQuickPlayKeystone } from '@/core/lcu/parsers/lobby'
import { createLcuQueryOptions, perksPagesDescriptor } from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'
import { useQuickPlaySlots } from '@/features/lobby/hooks/use-quick-play-slots'
import { findSlotPerkPage } from '@/features/lobby/utils/quick-play-slots'
import { getChampionName, getPerkName } from '@/lib/asset-resolver'

import { QuickPlayScreen } from './quick-play-screen'

import type { QuickPlayPickerProps } from './quick-play-screen-types'

const CURRENT = 'current'

// Figma "Select Runes": the option takes one of the player's rune pages. Runes that match none of them (the client's
// Pick for the champion and position) stay first, named as the client names them
export function QuickPlayRuneScreen({ option }: QuickPlayPickerProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const transport = useSharedLCUTransport()
  const quickPlay = useQuickPlaySlots()
  const pagesQuery = useQuery(createLcuQueryOptions(perksPagesDescriptor, transport))
  const champions = useChampions().data ?? []
  const runes = useRunes().data ?? []
  const slot = quickPlay.slots[option]
  const pages = pagesQuery.data ?? []
  const currentPage = findSlotPerkPage(slot?.perks ?? '', pages)
  const keystoneId = readQuickPlayKeystone(slot?.perks ?? '')
  const [picked, setPicked] = useState<string>()
  const value = picked ?? (currentPage ? String(currentPage.id) : CURRENT)
  const pickedPage = pages.find((page) => {
    return String(page.id) === value
  })

  function goToLobby() {
    void navigate({ to: '/connected/lobby' })
  }

  return (
    <QuickPlayScreen
      confirmDisabled={quickPlay.isPending}
      hasError={quickPlay.error !== null}
      title={t('lobby.quickPlay.selectRunes')}
      onConfirm={() => {
        if (!pickedPage || pickedPage === currentPage) {
          goToLobby()

          return
        }

        quickPlay.setPerks(option, pickedPage, goToLobby)
      }}
    >
      {pagesQuery.isSuccess && pages.length === 0 && keystoneId === null ? (
        <p {...props(text.body3, styles.empty)}>{t('lobby.quickPlay.noRunePages')}</p>
      ) : null}

      <RadioGroup aria-label={t('lobby.quickPlay.rune')} style={styles.list} value={value} onValueChange={setPicked}>
        {!currentPage && keystoneId !== null ? (
          <Radio
            label={`${getChampionName(slot?.championId ?? 0, champions) ?? ''} - ${getPerkName(keystoneId, runes) ?? ''}`}
            value={CURRENT}
          />
        ) : null}

        {pages.map((page) => {
          return <Radio key={page.id} label={page.name} value={String(page.id)} />
        })}
      </RadioGroup>
    </QuickPlayScreen>
  )
}

const styles = create({
  empty: {
    color: color.textSecondary,
    margin: 0,
  },
  // Figma: 32 between the pages
  list: {
    gap: 32,
  },
})
