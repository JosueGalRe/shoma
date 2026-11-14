import { FadeImage } from '@shoma/ui/fade-image'
import { create, props } from '@stylexjs/stylex'

import { RUNE_PATHS } from './rune-paths'

export interface RunePathIconProps {
  iconUrl: string
  styleId: number
}

// A rune path's emblem from its vector in the path's color, sharp at any size.
// A path without one keeps game data's icon
export function RunePathIcon({ iconUrl, styleId }: RunePathIconProps) {
  const path = RUNE_PATHS[styleId]

  if (!path) {
    return <FadeImage src={iconUrl} style={styles.fallback} />
  }

  return (
    <svg aria-hidden fill={path.color} viewBox="0 0 24 30" {...props(styles.icon)}>
      {path.icon.map((d) => {
        return <path key={d} d={d} />
      })}
    </svg>
  )
}

const styles = create({
  fallback: {
    borderRadius: '50%',
    height: '100%',
    objectFit: 'cover',
    width: '100%',
  },
  // The emblem's 24x30 box, about as big in its circle as the client's PNG
  icon: {
    aspectRatio: '24 / 30',
    height: '84%',
  },
})
