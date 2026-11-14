import { color } from '@shoma/ui/tokens/color.stylex'
import { font } from '@shoma/ui/tokens/font.stylex'
import { create, props } from '@stylexjs/stylex'

import type { LogoProps } from './logo-types'

// The Figma's logo is Marcellus outlined in brand gold: 33px tall on the pairing screen, 25px in the top bar
export function Logo({ size = 'large' }: LogoProps) {
  return <span {...props(styles.logo, size === 'small' && styles.small)}>Sho’ma</span>
}

const styles = create({
  logo: {
    color: color.brand,
    display: 'block',
    fontFamily: font.display,
    fontSize: '2.625rem',
    fontWeight: 400,
    lineHeight: '2.0625rem',
  },
  small: {
    fontSize: '2rem',
    lineHeight: '1.5625rem',
  },
})
