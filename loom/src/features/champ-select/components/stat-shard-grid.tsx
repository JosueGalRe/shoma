import { RuneId, type RuneId as RuneIdType } from '@/core/types/branded'

import { runeIconUrl } from '../utils'

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

interface StatShardGridProps {
  selectedPerkIds: RuneIdType[]
  onSelectStatShard: (slotIndex: number, runeId: RuneIdType) => void
}

export function StatShardGrid({ selectedPerkIds, onSelectStatShard }: StatShardGridProps) {
  return (
    <div className='border-border bg-secondary/60 space-y-2 rounded-lg border p-4'>
      {STAT_SHARDS.map((row, rowIndex) => (
        <div className='flex justify-center gap-x-4' key={rowIndex}>
          {row.map((shard, shardIndex) => {
            const isSelected = selectedPerkIds[6 + rowIndex] === shard.id
            return (
              <button
                className={`focus-visible:ring-ring h-10 w-10 rounded-full transition-all focus-visible:ring-2 focus-visible:outline-none ${
                  isSelected
                    ? 'ring-ring scale-110 shadow-[0_0_20px_var(--shoma-primary)] ring-2'
                    : 'hover:ring-ring/60 opacity-50 hover:opacity-100 hover:ring-1'
                }`}
                key={`${shard.id}-${shardIndex}`}
                onClick={() => onSelectStatShard(rowIndex, shard.id)}
                title={shard.name}
              >
                <img alt={shard.name} className='h-full w-full' loading='lazy' src={runeIconUrl(shard.icon) ?? undefined} />
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
