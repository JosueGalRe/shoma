import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'

import { communityDragonGameDataUrl } from '@/core/http/ddragon'
import { resolveSpellIcon } from '@/lib/asset-resolver'

import type { QuickPlayRecommendedPageProps } from './quick-play-screen-types'

// Figma "Recommender" page: the two paths and the spells along a line, each path's runes down from it. Shards aren't
// Drawn, as in the Figma
export function QuickPlayRecommendedPage({ page, perks, spells, styles: perkStyles }: QuickPlayRecommendedPageProps) {
  const columns = [page.perkIds.slice(0, 4), page.perkIds.slice(4, 6)]

  return (
    <div {...props(styles.page)}>
      <div {...props(styles.top)}>
        {[page.primaryStyleId, page.subStyleId].map((styleId) => {
          const style = perkStyles.find(({ id }) => {
            return id === styleId
          })

          return (
            <img
              key={styleId}
              alt={style?.name ?? ''}
              src={style ? communityDragonGameDataUrl(style.iconPath) : undefined}
              {...props(styles.path)}
            />
          )
        })}

        {page.spellIds.map((spellId) => {
          return (
            <img
              key={spellId}
              alt={
                spells.find(({ id }) => {
                  return id === spellId
                })?.name ?? ''
              }
              src={resolveSpellIcon(spellId, spells)}
              {...props(styles.spell)}
            />
          )
        })}
      </div>

      <div {...props(styles.columns)}>
        {columns.map((perkIds) => {
          return (
            <div key={perkIds.join(',')} {...props(styles.column)}>
              {perkIds.map((perkId) => {
                const perk = perks.get(perkId)

                return (
                  <img
                    key={perkId}
                    alt={perk?.name ?? ''}
                    src={perk ? communityDragonGameDataUrl(perk.iconPath) : undefined}
                    {...props(styles.perk)}
                  />
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Figma's 32 between the paths and spells at 412px wide, 24 at 375 so they fit
const GAP = 'clamp(16px, 21.6vw - 57px, 32px)'

const lineColor = `color-mix(in srgb, ${color.accent} 40%, transparent)`

const styles = create({
  // Figma: a rune column under each path's middle, its line down from the path
  column: {
    '::before': {
      backgroundImage: `linear-gradient(180deg, ${color.accent}, ${lineColor} 64%, transparent)`,
      bottom: 0,
      content: '""',
      insetInlineStart: 22,
      position: 'absolute',
      top: -13,
      width: 4,
    },
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    position: 'relative',
  },
  // The paths' spacing less a rune's width keeps each column under its path
  columns: {
    display: 'flex',
    gap: `calc(${GAP} + 16px)`,
    paddingInlineStart: 8,
  },
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    paddingInlineStart: 7,
  },
  path: {
    borderRadius: '50%',
    height: 64,
    position: 'relative',
    width: 64,
  },
  perk: {
    backgroundColor: color.background,
    borderColor: color.accent,
    borderRadius: '50%',
    borderStyle: 'solid',
    borderWidth: 1,
    boxSizing: 'border-box',
    height: 48,
    position: 'relative',
    width: 48,
  },
  spell: {
    borderColor: color.accent,
    borderStyle: 'solid',
    borderWidth: 2,
    boxSizing: 'border-box',
    height: 60,
    objectFit: 'cover',
    position: 'relative',
    width: 60,
  },
  // Figma: the paths and spells on a line that fades out to the right
  top: {
    '::before': {
      backgroundImage: `linear-gradient(90deg, ${lineColor}, color-mix(in srgb, ${color.accent} 15%, transparent) 64%, transparent)`,
      content: '""',
      height: 4,
      insetInlineEnd: 2,
      insetInlineStart: 64,
      position: 'absolute',
      top: 30,
    },
    alignItems: 'center',
    display: 'flex',
    gap: GAP,
    position: 'relative',
  },
})
