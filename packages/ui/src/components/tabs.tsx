import { Tabs as BaseTabs } from '@base-ui/react/tabs'
import { create, props } from '@stylexjs/stylex'

import { color } from '../tokens/color.stylex'
import { font } from '../tokens/font.stylex'

import type { StyleXStyles } from '@stylexjs/stylex'

type WithStyle<Props> = Omit<Props, 'className' | 'style'> & { style?: StyleXStyles }

export function Tabs({ style, ...rest }: WithStyle<BaseTabs.Root.Props>) {
  return <BaseTabs.Root {...rest} {...props(styles.root, style)} />
}

// The underline slides between tabs on Base UI's --active-tab-* variables instead of jumping
export function TabsList({ children, style, ...rest }: WithStyle<BaseTabs.List.Props>) {
  return (
    <BaseTabs.List {...rest} {...props(styles.list, style)}>
      {children}

      <BaseTabs.Indicator {...props(styles.indicator)} />
    </BaseTabs.List>
  )
}

// Figma "Tab": Marcellus 14 uppercase, mana-400; selected turns white with a leading dot over the gradient underline
export function Tab({ style, ...rest }: WithStyle<BaseTabs.Tab.Props>) {
  return (
    <BaseTabs.Tab
      {...rest}
      className={(state) => {
        return props(styles.tab, state.active && styles.tabActive, style).className
      }}
    />
  )
}

export function TabsPanel({ style, ...rest }: WithStyle<BaseTabs.Panel.Props>) {
  return <BaseTabs.Panel {...rest} {...props(styles.panel, style)} />
}

const styles = create({
  indicator: {
    backgroundImage: color.primaryGradient,
    bottom: 0,
    height: 2,
    left: 'var(--active-tab-left)',
    position: 'absolute',
    transitionDuration: { '@media (prefers-reduced-motion: reduce)': '0s', default: '200ms' },
    transitionProperty: 'left, width',
    transitionTimingFunction: 'ease-out',
    width: 'var(--active-tab-width)',
  },
  list: {
    display: 'flex',
    position: 'relative',
  },
  panel: {
    outlineStyle: 'none',
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
  },
  tab: {
    // Every tab keeps the dot's room, so selecting one never shifts the labels
    '::before': {
      backgroundColor: 'currentColor',
      borderRadius: '50%',
      content: '""',
      flexShrink: 0,
      height: 4,
      opacity: 0,
      transitionDuration: '150ms',
      transitionProperty: 'opacity',
      width: 4,
    },
    WebkitTapHighlightColor: 'transparent',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: color.textLabel,
    cursor: 'pointer',
    display: 'flex',
    fontFamily: font.display,
    fontSize: '0.875rem',
    gap: 8,
    letterSpacing: '0.08rem',
    lineHeight: 1,
    margin: 0,
    outlineColor: color.focusRing,
    outlineOffset: -2,
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: 2,
    paddingBlock: 12,
    paddingInline: 18,
    textTransform: 'uppercase',
    transitionDuration: '150ms',
    transitionProperty: 'color',
    transitionTimingFunction: 'ease-out',
    userSelect: 'none',
  },
  tabActive: {
    '::before': { opacity: 1 },
    color: color.text,
  },
})
