import { useState } from 'react'

import { Collapsible } from '@base-ui/react/collapsible'
import { BottomSheet } from '@shoma/ui/bottom-sheet'
import { Checkbox } from '@shoma/ui/checkbox'
import { Icon } from '@shoma/ui/icon'
import { text } from '@shoma/ui/text'
import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import { useSettingsStore } from '@/core/state/settings-store'

import type { SettingsSheetProps } from './lobby-screen-types'
import type { LanguageCode } from '@/i18n/i18n-types'

// The Figma lists Spanish first
const languages: LanguageCode[] = ['es', 'en']

// Figma "Settings" (458:39801): a full-height sheet from the dashboard's gear, with the app's language under a section
// That folds as the lobby's invite folders do. Picking one keeps it over the browser's from then on
export function SettingsSheet({ onOpenChange, open }: SettingsSheetProps) {
  const { i18n, t } = useTranslation()
  const setLanguage = useSettingsStore((state) => {
    return state.setLanguage
  })
  const [isLanguageOpen, setIsLanguageOpen] = useState(true)

  return (
    <BottomSheet
      fullHeight
      closeIcon="close"
      closeLabel={t('common.close')}
      open={open}
      title={t('settings.title')}
      onOpenChange={onOpenChange}
    >
      <Collapsible.Root open={isLanguageOpen} onOpenChange={setIsLanguageOpen} {...props(styles.section)}>
        <Collapsible.Trigger {...props(text.heading3Medium, styles.trigger)}>
          {t('settings.language')}

          <Icon name="arrow-down" size={20} style={[styles.chevron, !isLanguageOpen && styles.chevronClosed]} />
        </Collapsible.Trigger>

        <Collapsible.Panel
          className={(state) => {
            return props(
              styles.panel,
              (state.transitionStatus === 'starting' || state.transitionStatus === 'ending') && styles.folded,
            ).className
          }}
        >
          <div {...props(styles.options)}>
            {languages.map((language) => {
              return (
                <Checkbox
                  key={language}
                  checked={i18n.resolvedLanguage === language}
                  label={t(`settings.languages.${language}`)}
                  style={[text.heading3Medium, styles.option]}
                  onCheckedChange={(checked) => {
                    // The current one stays checked: there's always a language
                    if (checked) {
                      setLanguage(language)
                      void i18n.changeLanguage(language)
                    }
                  }}
                />
              )
            })}
          </div>
        </Collapsible.Panel>
      </Collapsible.Root>
    </BottomSheet>
  )
}

const styles = create({
  chevron: {
    transitionDuration: { '@media (prefers-reduced-motion: reduce)': '0s', default: '200ms' },
    transitionProperty: 'transform',
  },
  chevronClosed: {
    transform: 'rotate(-90deg)',
  },
  folded: {
    height: 0,
  },
  // Figma: Heading 3 labels 16px from the box
  option: {
    gap: 16,
  },
  // Figma: 16 under the name and between the rows
  options: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    paddingBlockStart: 16,
  },
  panel: {
    height: 'var(--collapsible-panel-height)',
    overflow: 'hidden',
    transitionDuration: { '@media (prefers-reduced-motion: reduce)': '0s', default: '200ms' },
    transitionProperty: 'height',
    transitionTimingFunction: 'ease-out',
  },
  // The sheet's body pads 10, the Figma 16
  section: {
    display: 'flex',
    flexDirection: 'column',
    paddingBlockStart: 6,
  },
  trigger: {
    WebkitTapHighlightColor: 'transparent',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: color.text,
    cursor: 'pointer',
    display: 'flex',
    gap: 10,
    outlineColor: color.focusRing,
    outlineOffset: 2,
    outlineStyle: { ':focus-visible': 'solid', default: 'none' },
    outlineWidth: 2,
    padding: 0,
  },
})
