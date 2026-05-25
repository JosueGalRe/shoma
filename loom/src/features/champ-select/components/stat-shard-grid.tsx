import { RuneId } from '@/core/types/branded'

import { runeIconUrl } from '../champ-select-utils'

import { statShardGridStyles } from './stat-shard-grid-styles'

import type { StatShardGridProps } from './stat-shard-grid-types'

const STAT_SHARDS = [
  [
    { icon: 'perk-images/StatMods/StatModsAdaptiveForceIcon.png', id: RuneId(5008), name: 'Adaptive Force' },
    { icon: 'perk-images/StatMods/StatModsAttackSpeedIcon.png', id: RuneId(5005), name: 'Attack Speed' },
    { icon: 'perk-images/StatMods/StatModsCDRScalingIcon.png', id: RuneId(5007), name: 'Ability Haste' },
  ],
  [
    { icon: 'perk-images/StatMods/StatModsAdaptiveForceIcon.png', id: RuneId(5008), name: 'Adaptive Force' },
    { icon: 'perk-images/StatMods/StatModsMovementSpeedIcon.png', id: RuneId(5010), name: 'Movement Speed' },
    { icon: 'perk-images/StatMods/StatModsHealthScalingIcon.png', id: RuneId(5001), name: 'Scaling Health' },
  ],
  [
    { icon: 'perk-images/StatMods/StatModsHealthPlusIcon.png', id: RuneId(5011), name: 'Health' },
    { icon: 'perk-images/StatMods/StatModsTenacityIcon.png', id: RuneId(5013), name: 'Tenacity and Slow Resist' },
    { icon: 'perk-images/StatMods/StatModsHealthScalingIcon.png', id: RuneId(5001), name: 'Scaling Health' },
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
