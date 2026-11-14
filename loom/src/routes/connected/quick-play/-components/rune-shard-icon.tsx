import { Fragment, useId } from 'react'

import { FadeImage } from '@shoma/ui/fade-image'
import { create, props } from '@stylexjs/stylex'

import { RUNE_SHARDS } from './rune-shards'

export interface RuneShardIconProps {
  iconUrl: string
  perkId: number
}

// A stat shard from its vector, so it stays sharp at the tile's size.
// One without a vector keeps game data's icon at 32px, the only size it comes in
export function RuneShardIcon({ iconUrl, perkId }: RuneShardIconProps) {
  const id = useId()
  const shard = RUNE_SHARDS[perkId]

  if (!shard) {
    return <FadeImage src={iconUrl} style={styles.fallback} />
  }

  return (
    <svg viewBox="0 0 32 32" {...props(styles.icon)}>
      {shard.parts.map(({ d, evenOdd, fade, stroke }, index) => {
        const gradientId = `${id}${index}`
        const paint = fade ? `url(#${gradientId})` : shard.color

        return (
          <Fragment key={d}>
            {fade ? (
              <linearGradient
                gradientUnits="userSpaceOnUse"
                id={gradientId}
                x1={fade[0]}
                x2={fade[2]}
                y1={fade[1]}
                y2={fade[3]}
              >
                <stop stopColor={shard.color} stopOpacity={fade[4]} />

                <stop offset={1} stopColor={shard.color} stopOpacity={fade[5]} />
              </linearGradient>
            ) : null}

            <path
              d={d}
              fill={stroke ? 'none' : paint}
              fillRule={evenOdd ? 'evenodd' : undefined}
              stroke={stroke ? paint : undefined}
              strokeWidth={stroke}
            />
          </Fragment>
        )
      })}
    </svg>
  )
}

const styles = create({
  fallback: {
    height: 32,
    width: 32,
  },
  icon: {
    display: 'block',
    height: '100%',
    width: '100%',
  },
})
