import { resolveChampionIcon, resolveChampionSplash, resolveSpellIcon } from '@/lib/asset-resolver'

import { rosterRowStyles } from './roster-row-styles'

import type { ChampSelectMember } from '../champ-select-actions'
import type { ChampionSummary } from '@/core/http/ddragon'
import type { SummonerSpell } from '@/core/lcu/queries/summoner'

export interface RosterRowProps {
  champions: ChampionSummary[]
  hiddenNameLabel: string
  isActiveTurn: boolean
  isEnemy: boolean
  member: ChampSelectMember
  roleLabel: string | null
  summonerSpells: SummonerSpell[]
}

export function RosterRow({
  champions,
  hiddenNameLabel,
  isActiveTurn,
  isEnemy,
  member,
  roleLabel,
  summonerSpells,
}: RosterRowProps) {
  const isLocked = member.championId > 0
  const displayedChampionId = isLocked ? member.championId : (member.championPickIntent ?? 0)
  const hasChampion = displayedChampionId > 0
  const styles = rosterRowStyles({ activeTurn: isActiveTurn, intent: !isLocked && hasChampion, locked: isLocked })
  const splashUrl = hasChampion ? resolveChampionSplash(displayedChampionId, champions) : undefined
  const displayName = member.displayName || member.gameName || hiddenNameLabel

  return (
    <div className={styles.root()}>
      {splashUrl ? <img alt="" aria-hidden="true" className={styles.splash()} loading="lazy" src={splashUrl} /> : null}

      <div className={styles.scrim()} />

      <div className={styles.content()}>
        <div className={styles.portrait()}>
          {hasChampion ? (
            <img
              alt=""
              className={styles.portraitImage()}
              loading="lazy"
              src={resolveChampionIcon(displayedChampionId, champions)}
            />
          ) : null}
        </div>

        <div className={styles.info()}>
          <div className={styles.name()}>{isEnemy ? hiddenNameLabel : displayName}</div>

          {roleLabel ? <div className={styles.role()}>{roleLabel}</div> : null}
        </div>

        {!isEnemy ? (
          <div className={styles.spells()}>
            {[member.spell1Id, member.spell2Id].map((spellId) => {
              return spellId && spellId > 0 ? (
                <img
                  alt=""
                  className={styles.spellIcon()}
                  key={spellId}
                  loading="lazy"
                  src={resolveSpellIcon(spellId, summonerSpells)}
                />
              ) : null
            })}
          </div>
        ) : null}
      </div>
    </div>
  )
}
