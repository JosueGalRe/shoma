import { useState } from 'react'

import { BottomSheet } from '@shoma/ui/bottom-sheet'
import { Button } from '@shoma/ui/button'
import { FadeImage } from '@shoma/ui/fade-image'
import { RoundTile } from '@shoma/ui/round-tile'
import { text } from '@shoma/ui/text'
import { TileGroup } from '@shoma/ui/tile'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { flushSync } from 'react-dom'
import { useTranslation } from 'react-i18next'

import { communityDragonGameDataUrl } from '@/core/http/ddragon'
import { useSavePerkPage } from '@/core/lcu/lcu-mutations'
import { createLcuQueryOptions, perksDescriptor, perkStylesDescriptor } from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'
import { RuneId } from '@/core/types/branded'
import {
  getPrimaryRows,
  getSecondaryRows,
  getShardRows,
  isRunePageDraftComplete,
  pickPrimaryPerk,
  pickSecondaryPerk,
  pickShard,
  type RunePageDraft,
  setPrimaryStyle,
  setSubStyle,
  toRunePageDraft,
  toSelectedPerkIds,
} from '@/features/lobby/utils/rune-page-draft'

import { QuickPlayInfoSheet } from './quick-play-info-sheet'
import { toPlainText } from './quick-play-screen-utils'
import { RUNE_PATHS } from './rune-paths'

import type { QuickPlayRuneEditorProps } from './quick-play-screen-types'
import type { Perk, PerkStyle } from '@/core/lcu/parsers/perks'
import type { StyleXStyles } from '@stylexjs/stylex'

// Figma "Editor" (201:11328): the page's two paths and their rows, then the shards. CONFIRM saves the page, as the
// Client's editor does from Swift Play, and the caller puts it on the option
export function QuickPlayRuneEditor({ onOpenChange, onSaved, open, page }: QuickPlayRuneEditorProps) {
  const { t } = useTranslation()
  const transport = useSharedLCUTransport()
  const perkStyles = (useQuery(createLcuQueryOptions(perkStylesDescriptor, transport)).data ?? []).toSorted((a, b) => {
    return a.id - b.id
  })
  const perks = useQuery(createLcuQueryOptions(perksDescriptor, transport)).data ?? new Map<number, Perk>()
  const savePage = useSavePerkPage()
  const [edited, setEdited] = useState<RunePageDraft>()
  const [wasOpen, setWasOpen] = useState(open)
  const [info, setInfo] = useState<Perk>()
  const [isInfoOpen, setIsInfoOpen] = useState(false)

  // Each opening starts from the page; resetting on close would change the picks while the sheet slides away
  if (open !== wasOpen) {
    setWasOpen(open)

    if (open) {
      setEdited(undefined)
    }
  }

  const draft = edited ?? toRunePageDraft(page, perkStyles)
  const primaryStyle = findStyle(perkStyles, draft.primaryStyleId)
  const subStyle = findStyle(perkStyles, draft.subStyleId)
  const secondaryRows = getSecondaryRows(subStyle)
  const subStyles = perkStyles.filter(({ id }) => {
    return id !== draft.primaryStyleId && primaryStyle?.allowedSubStyles.includes(id)
  })

  function renderPerk(perkId: number, isShard: boolean) {
    const perk = perks.get(perkId)
    const iconUrl = perk ? communityDragonGameDataUrl(perk.iconPath) : ''

    return (
      <RoundTile
        key={perkId}
        image={isShard ? <FadeImage src={iconUrl} style={styles.shardIcon} /> : iconUrl}
        infoLabel={t('lobby.quickPlay.aboutRune', { name: perk?.name ?? '' })}
        label={perk?.name ?? String(perkId)}
        size="small"
        value={String(perkId)}
        onInfoClick={() => {
          setInfo(perk)
          setIsInfoOpen(true)
        }}
      />
    )
  }

  // One tile group per row: a row holds one pick, and shard rows share perks
  function renderRow(
    row: number[],
    {
      isShard = false,
      onPick,
      picked,
      style,
    }: { isShard?: boolean; onPick: (perkId: number) => void; picked: number; style: StyleXStyles },
  ) {
    return (
      <TileGroup
        key={row.join(',')}
        aria-label={row
          .map((perkId) => {
            return perks.get(perkId)?.name
          })
          .join(', ')}
        style={style}
        value={picked > 0 ? [String(picked)] : []}
        onValueChange={(values) => {
          const perkId = Number(values[0])

          // Tapping the picked rune again keeps it
          if (perkId > 0) {
            onPick(perkId)
          }
        }}
      >
        {row.map((perkId) => {
          return renderPerk(perkId, isShard)
        })}
      </TileGroup>
    )
  }

  function handleConfirm() {
    const saved = {
      ...page,
      primaryStyleId: RuneId(draft.primaryStyleId),
      selectedPerkIds: toSelectedPerkIds(draft, secondaryRows).map(RuneId),
      subStyleId: RuneId(draft.subStyleId),
    }

    savePage.mutate(saved, {
      onSuccess: () => {
        onSaved(saved)
      },
    })
  }

  return (
    <BottomSheet
      fullHeight
      closeLabel={t('common.back')}
      footer={
        <div {...props(styles.footer)}>
          {savePage.isError ? (
            <p role="alert" {...props(text.body4, styles.error)}>
              {t('lobby.quickPlay.saveFailed')}
            </p>
          ) : null}

          <Button disabled={!isRunePageDraftComplete(draft) || savePage.isPending} onClick={handleConfirm}>
            {t('createLobby.confirm')}
          </Button>
        </div>
      }
      open={open}
      title={t('lobby.quickPlay.editor')}
      onOpenChange={(next) => {
        // A failed save's message stays for this opening only
        if (!next) {
          savePage.reset()
        }

        onOpenChange(next)
      }}
    >
      <div {...props(styles.content)}>
        <h3 {...props(text.heading2, styles.heading)}>{t('lobby.quickPlay.selectPath', { number: 'I' })}</h3>

        <TileGroup
          aria-label={t('lobby.quickPlay.primaryPath')}
          style={styles.paths}
          value={[String(draft.primaryStyleId)]}
          onValueChange={(values) => {
            const styleId = Number(values[0])

            if (styleId > 0) {
              slidePaths(() => {
                setEdited(setPrimaryStyle(draft, styleId, perkStyles))
              })
            }
          }}
        >
          {putPickedFirst(perkStyles, draft.primaryStyleId).map((style) => {
            return renderStyle(style, 'primary')
          })}
        </TileGroup>

        <div {...props(styles.tree, readPathColor(draft.primaryStyleId))}>
          {getPrimaryRows(primaryStyle).map((row, index) => {
            return renderRow(row, {
              onPick: (perkId) => {
                setEdited(pickPrimaryPerk(draft, index, perkId))
              },
              picked: draft.primary[index] ?? 0,
              style: styles.row,
            })
          })}
        </div>

        <h3 {...props(text.heading2, styles.heading)}>{t('lobby.quickPlay.selectPath', { number: 'II' })}</h3>

        <TileGroup
          aria-label={t('lobby.quickPlay.secondaryPath')}
          style={styles.paths}
          value={[String(draft.subStyleId)]}
          onValueChange={(values) => {
            const styleId = Number(values[0])

            if (styleId > 0) {
              slidePaths(() => {
                setEdited(setSubStyle(draft, styleId))
              })
            }
          }}
        >
          {putPickedFirst(subStyles, draft.subStyleId).map((style) => {
            return renderStyle(style, 'secondary')
          })}
        </TileGroup>

        <div {...props(styles.tree, readPathColor(draft.subStyleId))}>
          {secondaryRows.map((row) => {
            const picked =
              draft.secondary.find((perkId) => {
                return row.includes(perkId)
              }) ?? 0

            return renderRow(row, {
              onPick: (perkId) => {
                setEdited(pickSecondaryPerk(draft, secondaryRows, perkId))
              },
              picked,
              style: styles.row,
            })
          })}
        </div>

        <h3 {...props(text.heading2, styles.heading)}>{t('lobby.quickPlay.selectShards')}</h3>

        <div {...props(styles.tree, styles.shardTree)}>
          {getShardRows(primaryStyle).map((row, index) => {
            return renderRow(row, {
              isShard: true,
              onPick: (perkId) => {
                setEdited(pickShard(draft, index, perkId))
              },
              picked: draft.shards[index] ?? 0,
              style: [styles.row, styles.shardRow],
            })
          })}
        </div>
      </div>

      <QuickPlayInfoSheet
        body={toPlainText(info?.longDesc ?? '')}
        open={isInfoOpen}
        title={info?.name ?? ''}
        onOpenChange={setIsInfoOpen}
      />
    </BottomSheet>
  )
}

function renderStyle(style: PerkStyle, row: 'primary' | 'secondary') {
  return (
    <RoundTile
      key={style.id}
      image={renderPathIcon(style)}
      label={style.name}
      size="medium"
      style={[styles.path, styles.pathTransition(`rune-path-${row}-${style.id}`)]}
      value={String(style.id)}
    />
  )
}

// The picked path leads its row with the line down hanging from it, as the Figma draws it and the client hangs its tree
// From the picked path's emblem; the rest keep their order
function putPickedFirst(paths: readonly PerkStyle[], pickedId: number): PerkStyle[] {
  return paths.toSorted((a, b) => {
    return Number(b.id === pickedId) - Number(a.id === pickedId)
  })
}

// Picking a path slides the tiles to their new places (each has its own view-transition-name) while the rows cross-fade;
// Without the API, or with reduced motion, they move at once
function slidePaths(update: () => void) {
  if (typeof document.startViewTransition !== 'function' || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    update()

    return
  }

  document.startViewTransition(() => {
    flushSync(update)
  })
}

function renderPathIcon(style: PerkStyle) {
  const path = RUNE_PATHS[style.id]

  if (!path) {
    return communityDragonGameDataUrl(style.iconPath)
  }

  return (
    <svg fill={path.color} viewBox="0 0 24 30" {...props(styles.pathIcon)}>
      {path.icon.map((d) => {
        return <path key={d} d={d} />
      })}
    </svg>
  )
}

function findStyle(perkStyles: readonly PerkStyle[], styleId: number): PerkStyle | undefined {
  return perkStyles.find(({ id }) => {
    return id === styleId
  })
}

// Figma's sizes at 412px wide, shrunk so five paths and four keystones still fit at 375
const PATH_SIZE = 'clamp(48px, 21.6vw - 25px, 64px)'

// Figma: the path's line runs down the tree, and each row's runs right from it, both fading to the sheet. Figma draws them
// Shimmer; as in the client they take their path's color, and the shards keep shimmer
const pathColorVar = `var(--path-color, ${color.accent})`
const lineColor = `color-mix(in srgb, ${pathColorVar} 40%, transparent)`

function readPathColor(styleId: number) {
  const pathHex = RUNE_PATHS[styleId]?.color

  return pathHex === undefined ? null : styles.pathColor(pathHex)
}

const styles = create({
  // Figma "Body": 32 above and below, 16 between its parts. The sheet's body already pads 10
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    paddingBlock: 22,
  },
  error: {
    color: color.danger,
    margin: 0,
    textAlign: 'center',
  },
  footer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  heading: {
    color: color.text,
    margin: 0,
  },
  path: {
    height: PATH_SIZE,
    width: PATH_SIZE,
  },
  // eslint-disable-next-line arrow-body-style -- StyleX only compiles dynamic styles written as (x) => ({ ... })
  pathColor: (pathHex: string) => ({ '--path-color': pathHex }),
  // The emblem's 24x30 box, about as big in the tile as the client's PNG
  pathIcon: {
    aspectRatio: '24 / 30',
    height: '84%',
  },
  // eslint-disable-next-line arrow-body-style -- StyleX only compiles dynamic styles written as (x) => ({ ... })
  pathTransition: (name: string) => ({ viewTransitionName: name }),
  // Figma: 64px paths, 8 apart, 7 in from the body's edge
  paths: {
    flexWrap: 'nowrap',
    gap: 8,
    paddingInline: 7,
  },
  // Figma: 48px runes, 76 apart, from 75 in; the line along the row starts at 42 and fades by the edge
  row: {
    '::before': {
      backgroundImage: `linear-gradient(90deg, ${lineColor}, color-mix(in srgb, ${pathColorVar} 15%, transparent) 64%, transparent)`,
      content: '""',
      height: 4,
      insetInlineEnd: 6,
      insetInlineStart: 42,
      position: 'absolute',
      top: 22,
    },
    flexWrap: 'nowrap',
    gap: 'clamp(16px, 27vw - 83px, 28px)',
    paddingInlineStart: 75,
    position: 'relative',
  },
  // Game data's shard icons are 32px, the only size there is (the client draws them at 28), so they keep it inside the
  // 48px tile instead of blurring up to it
  shardIcon: {
    height: 32,
    width: 32,
  },
  // Figma: three shards 102 apart, from 87 in
  shardRow: {
    gap: 'clamp(40px, 24vw - 45px, 54px)',
    paddingInlineStart: 87,
  },
  // The shards' line starts at the first row's middle, not under a path
  shardTree: {
    '::before': {
      top: 22,
    },
  },
  // Figma: rows 64 apart; the line down hangs from the picked path, first in its row, 38 in
  tree: {
    '::before': {
      backgroundImage: `linear-gradient(180deg, ${pathColorVar}, ${lineColor} 64%, transparent)`,
      bottom: -16,
      content: '""',
      insetInlineStart: 38,
      position: 'absolute',
      top: -10,
      width: 4,
    },
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    position: 'relative',
  },
})
