import { RuneId } from '@/core/types/branded'

import { runeIconUrl } from '../champ-select-utils'
import { statShardGridStyles } from './stat-shard-grid-styles'
import type { StatShardGridProps } from './stat-shard-grid-types'

const STAT_SHARDS = [
  [
    { id: RuneId(5008), icon: 'perk-images/StatMods/StatModsAdaptiveForceIcon.png', name: 'Adaptive Force' },
    { id: RuneId(5005), icon: 'perk-images/StatMods/StatModsAttackSpeedIcon.png', name: 'Attack Speed' },
    { id: RuneId(5007), icon: 'perk-images/StatMods/StatModsCDRScalingIcon.png', name: 'Ability Haste' },
  ],
  [
    { id: RuneId(5008), icon: 'perk-images/StatMods/StatModsAdaptiveForceIcon.png', name: 'Adaptive Force' },
    { id: RuneId(5010), icon: 'perk-images/StatMods/StatModsMovementSpeedIcon.png', name: 'Movement Speed' },
    { id: RuneId(5001), icon: 'perk-images/StatMods/StatModsHealthScalingIcon.png', name: 'Scaling Health' },
  ],
  [
    { id: RuneId(5011), icon: 'perk-images/StatMods/StatModsHealthPlusIcon.png', name: 'Health' },
    { id: RuneId(5013), icon: 'perk-images/StatMods/StatModsTenacityIcon.png', name: 'Tenacity and Slow Resist' },
    { id: RuneId(5001), icon: 'perk-images/StatMods/StatModsHealthScalingIcon.png', name: 'Scaling Health' },
  ],
]

export function StatShardGrid({ selectedPerkIds, onSelectStatShard }: StatShardGridProps) {
  const styles = statShardGridStyles()

  return (
    <div className={styles.root()}>
      {STAT_SHARDS.map((row, rowIndex) => {
        const rowKey = row.map((shard) => {
          return shard.id
        }).join('-')

        return (
          <div className={styles.row()} key={rowKey}>
            {row.map((shard) => {
              const isSelected = selectedPerkIds[6 + rowIndex] === shard.id
              const shardStyles = statShardGridStyles({ selected: isSelected })

              return (
                <button
                  className={shardStyles.shardButton()}
                  key={shard.id}
                  onClick={() => {
                    return onSelectStatShard(rowIndex, shard.id)
                  }}
                  title={shard.name}
                  type='button'
                >
                  <img
                    alt={shard.name}
                    className={styles.shardIcon()}
                    loading='lazy'
                    src={runeIconUrl(shard.icon) ?? undefined}
                  />
                </button>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
