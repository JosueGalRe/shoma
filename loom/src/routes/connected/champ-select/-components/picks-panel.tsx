import { EmptySlot } from '@shoma/ui/empty-slot'
import { FadeImage } from '@shoma/ui/fade-image'
import { Icon } from '@shoma/ui/icon'
import { ScrollArea } from '@shoma/ui/scroll-area'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { communityDragonGameDataUrl } from '@/core/http/ddragon'
import { findSkinOf } from '@/core/lcu/parsers/skins'
import {
  championSkinsDescriptor,
  createLcuQueryOptions,
  perksCurrentPageDescriptor,
  perksDescriptor,
  perksPagesDescriptor,
} from '@/core/lcu/queries'
import { useSharedLCUTransport } from '@/core/relay/use-relay-state'
import { resolveSpellIcon } from '@/lib/asset-resolver'

import { ChampSelectAction } from './champ-select-action'
import { PicksDecoration } from './picks-decoration'

import type { ChampSelectTab, PicksPanelProps } from './champ-select-screen-types'
import type { IconName } from '@shoma/ui/icon'
import type { StyleXStyles } from '@stylexjs/stylex'

interface Pick {
  icon: IconName
  image: string | undefined
  label: string
  style: StyleXStyles
  tab: ChampSelectTab
}

function tile(path: string | undefined) {
  return path ? communityDragonGameDataUrl(path) : undefined
}

// Figma "Picks": what the player takes into the game, in the frame the Figma draws: the champion, its skin, the two
// Spells, the rune page's keystone and the ward. Each one opens its tab
export function PicksPanel({ actionSlot, champSelect, onOpenTab }: PicksPanelProps) {
  const { t } = useTranslation()
  const transport = useSharedLCUTransport()
  const pages = useQuery(createLcuQueryOptions(perksPagesDescriptor, transport)).data ?? []
  const currentPage = useQuery(createLcuQueryOptions(perksCurrentPageDescriptor, transport)).data
  const perks = useQuery(createLcuQueryOptions(perksDescriptor, transport)).data
  const { selection } = champSelect
  const local = champSelect.team.find((member) => {
    return member.cellId === champSelect.localPlayerCellId
  })
  const summonerId = local?.summonerId ?? 0
  const championId = local?.championId || local?.championPickIntent || 0
  const skins = useQuery({
    ...createLcuQueryOptions(championSkinsDescriptor(summonerId, championId), transport),
    enabled: Boolean(transport && summonerId && championId > 0),
  }).data
  const baseSkin = skins?.find(({ isBase }) => {
    return isBase
  })
  const skin = findSkinOf(skins ?? [], selection.skinId || championId * 1000)
  const page = pages.find((each) => {
    return each.id === currentPage?.id
  })
  const keystone = page ? perks?.get(page.selectedPerkIds[0] ?? 0) : undefined
  const ward = champSelect.wardSkins.find((each) => {
    return each.id === selection.wardSkinId
  })

  // NEXT opens the first section still missing its pick, in the tabs' order
  const missing = [
    { isMissing: championId <= 0, tab: 'champion' },
    { isMissing: !selection.spell1Id || !selection.spell2Id, tab: 'spell' },
    { isMissing: !keystone, tab: 'rune' },
    { isMissing: !ward, tab: 'ward' },
  ] satisfies { isMissing: boolean; tab: ChampSelectTab }[]
  const next = missing.find(({ isMissing }) => {
    return isMissing
  })?.tab

  function spell(id: number | null) {
    return id ? resolveSpellIcon(id, champSelect.summonerSpells) : undefined
  }

  function renderPick({ icon, image, label, style, tab }: Pick) {
    const open = () => {
      onOpenTab(tab)
    }

    if (!image) {
      return <EmptySlot aria-label={label} icon={<Icon name={icon} />} style={style} onClick={open} />
    }

    return (
      <button aria-label={label} type="button" {...props(styles.filled, style)} onClick={open}>
        <FadeImage src={image} style={styles.image} />
      </button>
    )
  }

  return (
    <ScrollArea contentStyle={styles.content} style={styles.scroll}>
      <div {...props(styles.stage)}>
        <PicksDecoration />

        {baseSkin?.tilePath ? (
          <button
            aria-label={t('champSelect.champion')}
            type="button"
            {...props(styles.filled, styles.champion)}
            onClick={() => {
              onOpenTab('champion')
            }}
          >
            <FadeImage src={communityDragonGameDataUrl(baseSkin.tilePath)} style={styles.image} />
          </button>
        ) : (
          <EmptySlot
            aria-label={t('champSelect.champion')}
            icon={<Icon name="champion" />}
            style={styles.champion}
            variant="friend"
            onClick={() => {
              onOpenTab('champion')
            }}
          />
        )}

        {renderPick({
          icon: 'champion',
          image: tile(skin?.tilePath),
          label: t('champSelect.cosmetics'),
          style: styles.square,
          tab: 'champion',
        })}

        <div {...props(styles.row, styles.spells)}>
          {renderPick({
            icon: 'spell',
            image: spell(selection.spell1Id),
            label: t('champSelect.spell1'),
            style: styles.spell,
            tab: 'spell',
          })}

          {renderPick({
            icon: 'spell',
            image: spell(selection.spell2Id),
            label: t('champSelect.spell2'),
            style: styles.spell,
            tab: 'spell',
          })}
        </div>

        <div {...props(styles.row)}>
          {renderPick({
            icon: 'rune',
            image: keystone ? communityDragonGameDataUrl(keystone.iconPath) : undefined,
            label: t('champSelect.rune'),
            style: styles.square,
            tab: 'rune',
          })}

          {renderPick({
            icon: 'sentinel',
            image: ward?.wardImagePath ? communityDragonGameDataUrl(ward.wardImagePath) : undefined,
            label: t('champSelect.wardSkin'),
            style: styles.square,
            tab: 'ward',
          })}
        </div>
      </div>

      <ChampSelectAction
        disabled={!next}
        label={t('createLobby.next')}
        slot={actionSlot}
        onClick={() => {
          if (next) {
            onOpenTab(next)
          }
        }}
      />
    </ScrollArea>
  )
}

const styles = create({
  // Figma: the 173px circle with a 2px shimmer-500 edge over a soft glow
  champion: {
    backgroundImage: `radial-gradient(rgb(255 255 255 / 10%), ${color.background} 71%)`,
    borderRadius: '50%',
    borderWidth: 2,
    height: 173,
    overflow: 'hidden',
    position: 'relative',
    width: 173,
  },
  content: {
    display: 'flex',
    justifyContent: 'center',
    paddingBlock: 16,
  },
  filled: {
    WebkitTapHighlightColor: 'transparent',
    backgroundColor: color.background,
    borderColor: color.accent,
    borderStyle: 'solid',
    borderWidth: 2,
    boxSizing: 'border-box',
    cursor: 'pointer',
    outlineColor: color.focusRing,
    outlineOffset: 2,
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: 2,
    padding: 0,
    position: 'relative',
    touchAction: 'manipulation',
  },
  image: {
    display: 'block',
    height: '100%',
    objectFit: 'cover',
    width: '100%',
  },
  row: {
    display: 'flex',
    gap: 8,
    position: 'relative',
  },
  scroll: {
    flexGrow: 1,
  },
  spell: {
    height: 40,
    width: 40,
  },
  spells: {
    gap: 4,
  },
  square: {
    height: 80,
    width: 80,
  },
  // Figma "Hub": a column 30 apart over the decoration, as wide as it
  stage: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: 30,
    position: 'relative',
    width: 345,
  },
})
