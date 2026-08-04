import { championSkinUrl } from '../champ-select-utils'

import { finalizationViewStyles } from './finalization-view-styles'

import type { ChampionSkin, ChampionSummary } from '@/core/http/ddragon'

export interface FinalizationViewProps {
  champion: ChampionSummary | null
  ownedSkinIds: ReadonlySet<number>
  selectedSkinId: number | null
  skins: ChampionSkin[]
  onSelectSkin: (skinId: number) => void
  title: string
}

export function FinalizationView({
  champion,
  ownedSkinIds,
  selectedSkinId,
  skins,
  onSelectSkin,
  title,
}: FinalizationViewProps) {
  const styles = finalizationViewStyles()
  const ownedSkins = skins.filter((skin) => {
    return skin.num === 0 || ownedSkinIds.has(Number(skin.id))
  })
  const activeSkin = ownedSkins.find((skin) => {
    return Number(skin.id) === selectedSkinId
  })
  const heroUrl = champion ? championSkinUrl(champion.key, activeSkin?.num ?? 0) : null

  return (
    <section aria-label={title} className={styles.root()}>
      <h2 className={styles.title()}>{title}</h2>

      <div className={styles.hero()}>
        {heroUrl ? <img alt={champion?.name} className={styles.heroImage()} src={heroUrl} /> : null}

        <div className={styles.heroName()}>{champion?.name ?? title}</div>

        <div className={styles.carousel()}>
          {ownedSkins.map((skin) => {
            const skinId = Number(skin.id)
            const isSelected = selectedSkinId === skinId || (selectedSkinId === null && skin.num === 0)
            const skinUrl = champion ? championSkinUrl(champion.key, skin.num) : null

            return (
              <button
                aria-label={skin.name}
                aria-pressed={isSelected}
                className={styles.skinButton({ selected: isSelected })}
                key={skin.id}
                onClick={() => {
                  onSelectSkin(skinId)
                }}
                type="button"
              >
                {skinUrl ? <img alt="" className={styles.skinImage()} loading="lazy" src={skinUrl} /> : null}

                <span className={styles.skinName()}>{skin.num === 0 ? champion?.name : skin.name}</span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
