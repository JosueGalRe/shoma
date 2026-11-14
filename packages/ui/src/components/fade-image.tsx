import { useState } from 'react'

import { create, props } from '@stylexjs/stylex'

import type { StyleXStyles } from '@stylexjs/stylex'

export interface FadeImageProps {
  src: string
  style?: StyleXStyles
}

// Decorative art that fades in once loaded instead of popping in. One already in the cache shows at once.
// The ref finds it complete and marks it before the first paint
export function FadeImage({ src, style }: FadeImageProps) {
  const [loadedSrc, setLoadedSrc] = useState<string>()

  return (
    <img
      ref={(node) => {
        if (node?.complete && node.naturalWidth > 0 && loadedSrc !== src) {
          setLoadedSrc(src)
        }
      }}
      alt=""
      draggable={false}
      src={src}
      onLoad={() => {
        setLoadedSrc(src)
      }}
      {...props(styles.image, loadedSrc !== src && styles.loading, style)}
    />
  )
}

const styles = create({
  image: {
    transitionDuration: '150ms',
    transitionProperty: 'opacity',
    transitionTimingFunction: 'ease-out',
  },
  loading: {
    opacity: 0,
  },
})
