import { useState } from 'react'
import type { ReactNode } from 'react'

import { Icon } from '@shoma/ui/icon'
import { IconButton } from '@shoma/ui/icon-button'
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

import { QuickPlayRecommender } from './quick-play-recommender'
import { QuickPlayRuneEditor } from './quick-play-rune-editor'
import { QuickPlayScreen } from './quick-play-screen'

import type { QuickPlayPickerProps } from './quick-play-screen-types'
import type { PerkPage } from '@/core/lcu/parsers/perks'

const CURRENT = 'current'

type RuneSheet = 'editor' | 'recommender'

// Figma "Select Runes": the option takes one of the player's rune pages. Runes that match none of them (the client's
// Pick for the champion and position) stay first, named as the client names them. Beside the picked page, the
// Client's rune recommender and, for a page the player owns, its editor
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
  // Kept after closing, so the sheet that slides away keeps its content
  const [sheet, setSheet] = useState<RuneSheet>('recommender')
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const value = picked ?? (currentPage ? String(currentPage.id) : CURRENT)
  const pickedPage = pages.find((page) => {
    return String(page.id) === value
  })

  function goToLobby() {
    void navigate({ to: '/connected/lobby' })
  }

  function openSheet(next: RuneSheet) {
    setSheet(next)
    setIsSheetOpen(true)
  }

  // The row's actions show only on the picked one; the others keep their room hidden, so picking moves nothing
  function renderRow(rowValue: string, label: string, page?: PerkPage): ReactNode {
    const isPicked = rowValue === value

    return (
      <div key={rowValue} {...props(styles.row)}>
        <Radio label={label} style={styles.radio} value={rowValue} />

        <div inert={!isPicked} {...props(styles.actions, !isPicked && styles.hidden)}>
          <IconButton
            aria-label={t('lobby.quickPlay.recommender')}
            variant="filled"
            onClick={() => {
              openSheet('recommender')
            }}
          >
            <Icon name="rune" />
          </IconButton>

          {page?.isEditable ? (
            <IconButton
              aria-label={t('lobby.quickPlay.editPage', { name: page.name })}
              variant="filled"
              onClick={() => {
                openSheet('editor')
              }}
            >
              <Icon name="edit" />
            </IconButton>
          ) : null}
        </div>
      </div>
    )
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
        {!currentPage && keystoneId !== null
          ? renderRow(
              CURRENT,
              `${getChampionName(slot?.championId ?? 0, champions) ?? ''} - ${getPerkName(keystoneId, runes) ?? ''}`,
            )
          : null}

        {pages.map((page) => {
          return renderRow(String(page.id), page.name, page)
        })}
      </RadioGroup>

      {pickedPage ? (
        <QuickPlayRuneEditor
          open={isSheetOpen && sheet === 'editor'}
          page={pickedPage}
          onOpenChange={setIsSheetOpen}
          onSaved={(page) => {
            quickPlay.setPerks(option, page, () => {
              setIsSheetOpen(false)
            })
          }}
        />
      ) : null}

      <QuickPlayRecommender
        championId={slot?.championId ?? 0}
        open={isSheetOpen && sheet === 'recommender'}
        position={slot?.positionPreference ?? ''}
        onApply={(page) => {
          quickPlay.setRecommendedPage(option, page, () => {
            setIsSheetOpen(false)
            setPicked(undefined)
          })
        }}
        onOpenChange={setIsSheetOpen}
      />
    </QuickPlayScreen>
  )
}

const styles = create({
  // Figma: the recommender and editor buttons, 8 apart
  actions: {
    display: 'flex',
    flexShrink: 0,
    gap: 8,
    transitionDuration: '150ms',
    transitionProperty: 'opacity',
    transitionTimingFunction: 'ease-out',
  },
  empty: {
    color: color.textSecondary,
    margin: 0,
  },
  hidden: {
    opacity: 0,
  },
  // Figma: 32 between 32px pages; rows here are 40 tall for the buttons, so 24 keeps the same rhythm
  list: {
    gap: 24,
  },
  radio: {
    flexGrow: 1,
    minWidth: 0,
  },
  row: {
    alignItems: 'center',
    display: 'flex',
    gap: 12,
    minHeight: 40,
  },
})
