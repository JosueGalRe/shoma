import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'

import { LandscapeWarning } from './landscape-warning'

import type { AppShellProps } from './app-shell-types'

// The Figma only draws 412px phones, so tablets and desktops get the same column, centered
export function AppShell({ children }: AppShellProps) {
  return (
    <div {...props(styles.root)}>
      <LandscapeWarning />

      {children}
    </div>
  )
}

const styles = create({
  root: {
    boxSizing: 'border-box',
    color: color.text,
    display: 'flex',
    flexDirection: 'column',
    height: '100dvh',
    // ScreenBackground sits at z-index -1; without its own stacking context the body's background covers it
    isolation: 'isolate',
    marginInline: 'auto',
    maxWidth: 480,
    overflow: 'hidden',
    paddingBottom: 'env(safe-area-inset-bottom)',
    paddingLeft: 'env(safe-area-inset-left)',
    paddingRight: 'env(safe-area-inset-right)',
    paddingTop: 'env(safe-area-inset-top)',
    position: 'relative',
  },
})
