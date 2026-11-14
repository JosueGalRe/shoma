import type { ReactNode } from 'react'

import { ScrollArea as BaseScrollArea } from '@base-ui/react/scroll-area'
import { create, props } from '@stylexjs/stylex'

import { color } from '../tokens/color.stylex'

import type { StyleXStyles } from '@stylexjs/stylex'

export interface ScrollAreaProps {
  children: ReactNode
  // The content box inside the scroll, e.g. its padding and layout
  contentStyle?: StyleXStyles
  // The scroll box itself, sized by its parent (e.g. flexGrow: 1)
  style?: StyleXStyles
}

// Not drawn in the Figma: a native scroll with a thin overlay thumb that shows while scrolling or hovering
export function ScrollArea({ children, contentStyle, style }: ScrollAreaProps) {
  return (
    <BaseScrollArea.Root {...props(styles.root, style)}>
      <BaseScrollArea.Viewport {...props(styles.viewport)}>
        <BaseScrollArea.Content {...props(contentStyle)}>{children}</BaseScrollArea.Content>
      </BaseScrollArea.Viewport>

      <BaseScrollArea.Scrollbar
        className={(state) => {
          return props(styles.scrollbar, (state.hovering || state.scrolling) && styles.scrollbarVisible).className
        }}
      >
        <BaseScrollArea.Thumb {...props(styles.thumb)} />
      </BaseScrollArea.Scrollbar>
    </BaseScrollArea.Root>
  )
}

const styles = create({
  root: {
    minHeight: 0,
    position: 'relative',
  },
  scrollbar: {
    display: 'flex',
    margin: 2,
    opacity: 0,
    pointerEvents: 'none',
    transitionDuration: '200ms',
    transitionProperty: 'opacity',
    transitionTimingFunction: 'ease-out',
    width: 4,
  },
  scrollbarVisible: {
    opacity: 1,
    pointerEvents: 'auto',
  },
  thumb: {
    backgroundColor: color.border,
    borderRadius: 2,
    width: '100%',
  },
  viewport: {
    height: '100%',
    outlineColor: color.focusRing,
    outlineOffset: -2,
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: 2,
    overscrollBehavior: 'contain',
  },
})
