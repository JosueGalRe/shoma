import type { ReactNode } from 'react'

import { Tabs as BaseTabs } from '@base-ui/react/tabs'
import { create, props } from '@stylexjs/stylex'

import { color } from '../tokens/color.stylex'
import { font } from '../tokens/font.stylex'

import type { StyleXStyles } from '@stylexjs/stylex'

export type BottomNavProps = Omit<BaseTabs.List.Props, 'className' | 'style'> & { style?: StyleXStyles }

// Figma "Bottom Nav Bar": champ select's sections as tabs along the bottom edge. Goes inside `Tabs` from
// @shoma/ui/tabs with the matching `TabsPanel`s; the screen decides where it sits.
export function BottomNav({ style, ...rest }: BottomNavProps) {
  return <BaseTabs.List {...rest} {...props(styles.bar, style)} />
}

export type BottomNavTabProps = Omit<BaseTabs.Tab.Props, 'className' | 'style'> & {
  children: ReactNode
  icon: ReactNode
}

// Figma "Bottom Tab": a 24px icon over a Marcellus 12 uppercase label, both shimmer-500 when selected
export function BottomNavTab({ children, icon, ...rest }: BottomNavTabProps) {
  return (
    <BaseTabs.Tab
      {...rest}
      className={(state) => {
        return props(styles.tab, state.active && styles.tabActive).className
      }}
    >
      {icon}

      {children}
    </BaseTabs.Tab>
  )
}

const styles = create({
  bar: {
    backgroundColor: color.background,
    borderTopColor: color.focusRing,
    borderTopStyle: 'solid',
    borderTopWidth: 1,
    boxSizing: 'border-box',
    display: 'flex',
    gap: 2,
    paddingBottom: 'env(safe-area-inset-bottom)',
    width: '100%',
  },
  tab: {
    WebkitTapHighlightColor: 'transparent',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 4,
    borderWidth: 0,
    color: color.text,
    cursor: 'pointer',
    display: 'flex',
    // Each tab takes its label's width and they share the rest, as the Figma's hug-then-fill tabs do
    flexBasis: 'auto',
    flexDirection: 'column',
    flexGrow: 1,
    fontFamily: font.display,
    fontSize: '0.75rem',
    gap: 4,
    justifyContent: 'center',
    letterSpacing: '0.08rem',
    lineHeight: '14px',
    margin: 0,
    minWidth: 0,
    outlineColor: color.focusRing,
    outlineOffset: -2,
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: 2,
    padding: 8,
    textTransform: 'uppercase',
    touchAction: 'manipulation',
    transitionDuration: '150ms',
    transitionProperty: 'color',
    transitionTimingFunction: 'ease-out',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  },
  tabActive: {
    color: color.accent,
  },
})
