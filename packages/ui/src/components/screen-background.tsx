import { create, props } from '@stylexjs/stylex'

import { color } from '../tokens/color.stylex'

export interface ScreenBackgroundProps {
  // Map art behind the screen (dashboard, lobby, champ select); without it, the plain navy with a faint top glow
  image?: string
}

// Figma "Backgroun Gradient": fixed behind the whole screen. The Figma's blurred ellipses are kept as blurred
// Ellipses: a mana glow at the top of the plain one, dark vignettes at the top of the art and the bottom of both.
export function ScreenBackground({ image }: ScreenBackgroundProps) {
  return (
    <div aria-hidden {...props(styles.root)}>
      {image ? <div {...props(styles.art, styles.artImage(`url("${image}")`))} /> : null}

      <div {...props(styles.ellipse, image ? styles.topVignette : styles.glow)} />

      <div {...props(styles.ellipse, styles.bottomVignette)} />
    </div>
  )
}

const styles = create({
  art: {
    backgroundPosition: 'center',
    backgroundSize: 'cover',
    inset: 0,
    position: 'absolute',
  },
  artImage: (backgroundImage: string) => ({ backgroundImage }),
  bottomVignette: {
    backgroundColor: color.overlay,
    bottom: -128,
    filter: 'blur(37px)',
    width: '158%',
  },
  // Sizes and offsets from the 412x917 frame, widths relative to the screen so wider phones keep the shape
  ellipse: {
    borderRadius: '50%',
    height: 339,
    left: '50%',
    position: 'absolute',
    transform: 'translateX(-50%)',
  },
  glow: {
    backgroundColor: color.glow,
    filter: 'blur(44px)',
    top: -138,
    width: '124%',
  },
  root: {
    backgroundColor: color.background,
    inset: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
    position: 'fixed',
    zIndex: -1,
  },
  topVignette: {
    backgroundColor: color.overlay,
    filter: 'blur(37px)',
    top: -110,
    width: '158%',
  },
})
