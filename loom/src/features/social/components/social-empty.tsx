import { FadeImage } from '@shoma/ui/fade-image'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'

import { COMMUNITY_DRAGON_BASE_URL } from '@/core/http/ddragon'

import type { SocialEmptyProps } from '../social-types'

const PORO_URL = `${COMMUNITY_DRAGON_BASE_URL}/latest/plugins/rcp-fe-lol-social/global/default/poro_`

// Figma "Empty State": the client's own poro over a centered line
export function SocialEmpty({ children, poro, style }: SocialEmptyProps) {
  return (
    <div {...props(styles.root, style)}>
      <FadeImage src={`${PORO_URL}${poro}.png`} style={styles.poro} />

      <p {...props(text.heading3Medium, styles.text)}>{children}</p>
    </div>
  )
}

const styles = create({
  // The 102x96 art centered in the Figma's 150x120 box
  poro: {
    height: 96,
    marginBlock: 12,
    width: 102,
  },
  root: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  text: {
    color: color.text,
    margin: 0,
    maxWidth: 300,
    textAlign: 'center',
  },
})
