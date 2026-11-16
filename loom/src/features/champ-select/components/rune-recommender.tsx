import { useState } from 'react'

import { BottomSheet } from '@shoma/ui/bottom-sheet'
import { Button } from '@shoma/ui/button'
import { Radio, RadioGroup } from '@shoma/ui/radio-group'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import {
  createLcuQueryOptions,
  perksDescriptor,
  perkStylesDescriptor,
  recommendedPagesDescriptor,
  summonerSpellsDescriptor,
} from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'

import { RecommendedRunePage } from './recommended-rune-page'

import type { RuneRecommenderProps } from './picker-types'
import type { Perk } from '@/core/lcu/parsers/perks'

// The client asks the recommender for Summoner's Rift whatever the queue
const SUMMONERS_RIFT = 11

// Figma "Recommender" (211:13372): the client's recommended pages for the option's champion and position, each with
// The spells it suggests. CONFIRM puts the page and its spells on the option
export function RuneRecommender({ championId, onApply, onOpenChange, open, position }: RuneRecommenderProps) {
  const { t } = useTranslation()
  const transport = useSharedLCUTransport()
  const pagesQuery = useQuery({
    ...createLcuQueryOptions(recommendedPagesDescriptor(championId, position, SUMMONERS_RIFT), transport),
    enabled: Boolean(transport && open && championId > 0 && position),
  })
  const perkStyles = useQuery(createLcuQueryOptions(perkStylesDescriptor, transport)).data ?? []
  const perks = useQuery(createLcuQueryOptions(perksDescriptor, transport)).data ?? new Map<number, Perk>()
  const spells = useQuery(createLcuQueryOptions(summonerSpellsDescriptor, transport)).data ?? []
  const pages = pagesQuery.data ?? []
  const [picked, setPicked] = useState<string>()
  const [wasOpen, setWasOpen] = useState(open)

  // Each opening starts on the first page; resetting on close would move the mark while the sheet slides away
  if (open !== wasOpen) {
    setWasOpen(open)

    if (open) {
      setPicked(undefined)
    }
  }

  const value = picked ?? pages[0]?.id
  const pickedPage = pages.find(({ id }) => {
    return id === value
  })

  return (
    <BottomSheet
      fullHeight
      closeLabel={t('common.back')}
      footer={
        <Button
          disabled={!pickedPage}
          style={styles.confirm}
          onClick={() => {
            if (pickedPage) {
              onApply(pickedPage)
            }
          }}
        >
          {t('createLobby.confirm')}
        </Button>
      }
      open={open}
      title={t('lobby.quickPlay.recommender')}
      onOpenChange={onOpenChange}
    >
      {pagesQuery.isSuccess && pages.length === 0 ? (
        <p {...props(text.body2, styles.empty)}>{t('lobby.quickPlay.noRecommendations')}</p>
      ) : null}

      <RadioGroup aria-label={t('lobby.quickPlay.recommender')} style={styles.list} value={value} onValueChange={setPicked}>
        {pages.map((page) => {
          return (
            <div key={page.id} {...props(styles.page)}>
              <Radio label={page.descriptor} value={page.id} />

              <RecommendedRunePage page={page} perks={perks} spells={spells} styles={perkStyles} />
            </div>
          )
        })}
      </RadioGroup>
    </BottomSheet>
  )
}

const styles = create({
  confirm: {
    width: '100%',
  },
  empty: {
    color: color.textLabel,
    margin: 0,
    paddingBlock: 22,
  },
  // Figma "Body": 32 above and below; the sheet's body already pads 10
  list: {
    gap: 16,
    paddingBlock: 22,
  },
  // Figma: 16 between a page's name and its runes, and before the next page
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
})
