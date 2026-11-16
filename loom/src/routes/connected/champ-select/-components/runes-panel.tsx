import { useState } from 'react'

import { Icon } from '@shoma/ui/icon'
import { IconButton } from '@shoma/ui/icon-button'
import { Radio, RadioGroup } from '@shoma/ui/radio-group'
import { ScrollArea } from '@shoma/ui/scroll-area'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { useToast } from '@shoma/ui/use-toast'
import { create, props } from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { useSavePerkPage, useSetCurrentPerkPage } from '@/core/lcu/lcu-mutations'
import { createLcuQueryOptions, perksCurrentPageDescriptor, perksPagesDescriptor } from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'
import { RuneId, SpellId } from '@/core/types/branded'
import { RunePageEditor } from '@/features/champ-select/components/rune-page-editor'
import { RuneRecommender } from '@/features/champ-select/components/rune-recommender'

import { ChampSelectAction } from './champ-select-action'

import type { ChampSelectPanelProps } from './champ-select-screen-types'
import type { RecommendedPage } from '@/core/lcu/parsers/perks'

type RuneSheet = 'editor' | 'recommender'

// Figma "Select Runes": the player's rune pages; CONFIRM makes the picked one the page for the game. An editable page
// Has the client's recommender, which writes its runes over the page, and the editor beside it
export function RunesPanel({ actionSlot, champSelect }: ChampSelectPanelProps) {
  const { t } = useTranslation()
  const transport = useSharedLCUTransport()
  const toast = useToast()
  const pages = useQuery(createLcuQueryOptions(perksPagesDescriptor, transport)).data ?? []
  const currentPage = useQuery(createLcuQueryOptions(perksCurrentPageDescriptor, transport)).data
  const setCurrentPage = useSetCurrentPerkPage()
  const savePage = useSavePerkPage()
  const [picked, setPicked] = useState<string>()
  // Kept after closing, so the sheet that slides away keeps its content
  const [sheet, setSheet] = useState<RuneSheet>('recommender')
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const currentId = typeof currentPage?.id === 'number' ? String(currentPage.id) : ''
  const value = picked ?? currentId
  const pickedPage = pages.find((page) => {
    return String(page.id) === value
  })
  const local = champSelect.team.find((member) => {
    return member.cellId === champSelect.localPlayerCellId
  })
  const championId = local?.championId || local?.championPickIntent || champSelect.selectedChampion || 0

  function showError() {
    toast.add({ title: t('errors.generic'), type: 'error' })
  }

  function makeCurrent(pageId: number, onDone: () => void) {
    setCurrentPage.mutate(pageId, { onError: showError, onSuccess: onDone })
  }

  function openSheet(next: RuneSheet) {
    setSheet(next)
    setIsSheetOpen(true)
  }

  function applyRecommended(recommended: RecommendedPage) {
    if (!pickedPage) {
      return
    }

    const [spell1, spell2] = recommended.spellIds
    const page = {
      ...pickedPage,
      primaryStyleId: RuneId(recommended.primaryStyleId),
      selectedPerkIds: recommended.perkIds.map(RuneId),
      subStyleId: RuneId(recommended.subStyleId),
    }

    savePage.mutate(page, {
      onError: showError,
      onSuccess: () => {
        makeCurrent(page.id, () => {
          setIsSheetOpen(false)
          setPicked(undefined)
        })

        // The client's recommender sets the spells it suggests along with the page
        if (spell1 && spell2) {
          void champSelect.changeSelection({ spell1Id: SpellId(spell1), spell2Id: SpellId(spell2) })
        }
      },
    })
  }

  return (
    <div {...props(styles.root)}>
      <h2 {...props(text.heading2, styles.subtitle)}>{t('champSelect.selectRunes')}</h2>

      <ScrollArea style={styles.scroll}>
        <RadioGroup aria-label={t('champSelect.runes')} style={styles.list} value={value} onValueChange={setPicked}>
          {pages.map((page) => {
            const isPicked = String(page.id) === value

            return (
              <div key={page.id} {...props(styles.row)}>
                <Radio label={page.name} style={styles.radio} value={String(page.id)} />

                {/* The actions show only on the picked page; the others keep their room hidden, so picking moves nothing */}
                <div
                  inert={!isPicked || !page.isEditable}
                  {...props(styles.actions, (!isPicked || !page.isEditable) && styles.hidden)}
                >
                  <IconButton
                    aria-label={t('lobby.quickPlay.recommender')}
                    variant="filled"
                    onClick={() => {
                      openSheet('recommender')
                    }}
                  >
                    <Icon name="rune" />
                  </IconButton>

                  <IconButton
                    aria-label={t('lobby.quickPlay.editPage', { name: page.name })}
                    variant="filled"
                    onClick={() => {
                      openSheet('editor')
                    }}
                  >
                    <Icon name="edit" />
                  </IconButton>
                </div>
              </div>
            )
          })}
        </RadioGroup>
      </ScrollArea>

      {pickedPage ? (
        <RunePageEditor
          open={isSheetOpen && sheet === 'editor'}
          page={pickedPage}
          onOpenChange={setIsSheetOpen}
          onSaved={(page) => {
            makeCurrent(page.id, () => {
              setIsSheetOpen(false)
              setPicked(undefined)
            })
          }}
        />
      ) : null}

      <RuneRecommender
        championId={championId}
        open={isSheetOpen && sheet === 'recommender'}
        position={local?.assignedPosition?.toUpperCase() ?? ''}
        onApply={applyRecommended}
        onOpenChange={setIsSheetOpen}
      />

      <ChampSelectAction
        disabled={!pickedPage || value === currentId || setCurrentPage.isPending}
        label={t('createLobby.confirm')}
        slot={actionSlot}
        onClick={() => {
          if (pickedPage) {
            makeCurrent(pickedPage.id, () => {
              setPicked(undefined)
            })
          }
        }}
      />
    </div>
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
  root: {
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    gap: 32,
    minHeight: 0,
    paddingBlock: 16,
    paddingInline: 24,
  },
  row: {
    alignItems: 'center',
    display: 'flex',
    gap: 12,
    minHeight: 40,
  },
  scroll: {
    flexGrow: 1,
  },
  subtitle: {
    color: color.text,
    flexShrink: 0,
    margin: 0,
  },
})
