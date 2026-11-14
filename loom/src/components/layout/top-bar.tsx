import { Icon } from '@shoma/ui/icon'
import { IconButton } from '@shoma/ui/icon-button'
import { create, props } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import { Logo } from '@/components/logo'
import { uiStoreSelectors, useUiStore } from '@/core/state/ui-store'

import type { TopBarProps } from './top-bar-types'

// Figma "Title" and "Top Nav": back arrow or logo on the left, the chat button that opens Social on the right
export function TopBar({ onBack }: TopBarProps) {
  const { t } = useTranslation()
  const isSocialDrawerOpen = useUiStore(uiStoreSelectors.isSocialDrawerOpen)
  const toggleSocialDrawer = useUiStore(uiStoreSelectors.toggleSocialDrawer)

  return (
    <header {...props(styles.bar)}>
      {onBack ? (
        <IconButton aria-label={t('common.back')} onClick={onBack}>
          <Icon name="arrow-left" />
        </IconButton>
      ) : (
        <Logo size="small" />
      )}

      <IconButton
        aria-expanded={isSocialDrawerOpen}
        aria-haspopup="dialog"
        aria-label={t('social.open')}
        size={onBack ? 'medium' : 'small'}
        onClick={toggleSocialDrawer}
      >
        <Icon name="chat" />
      </IconButton>
    </header>
  )
}

const styles = create({
  bar: {
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    flexShrink: 0,
    justifyContent: 'space-between',
    paddingBlock: 16,
    paddingInline: 24,
  },
})
