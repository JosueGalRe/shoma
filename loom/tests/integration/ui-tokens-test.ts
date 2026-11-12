import { create, props } from '@stylexjs/stylex'
import { describe, expect, it } from 'vitest'

import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'

const styles = create({
  label: { color: color.text },
})

describe('@shoma/ui through the StyleX compiler', () => {
  it('resolves the design tokens from the other package', () => {
    expect(color.text).toMatch(/^var\(--[\w-]+\)$/)
  })

  it('merges a shared text style with an app style', () => {
    const { className } = props(text.body2, styles.label)

    // fontFamily, fontSize, fontWeight, letterSpacing and lineHeight from body2, color from the app
    expect(className?.split(' ')).toHaveLength(6)
  })
})
