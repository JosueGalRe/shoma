import { Icon } from '@shoma/design-system'
import { getCurrentWindow } from '@tauri-apps/api/window'

import { titleBarStyles } from './title-bar-styles'

import type { TranslationKey } from '../app-utils'

interface TitleBarProps {
  onToggleSettings: () => void
  t: (key: TranslationKey) => string
}

function handleMinimize() {
  void getCurrentWindow().minimize()
}

function handleClose() {
  void getCurrentWindow().close()
}

export function TitleBar({ onToggleSettings, t }: TitleBarProps) {
  const { base, title, controls, button } = titleBarStyles()

  return (
    <div data-tauri-drag-region className={base()}>
      <div className={title()}>{t('app.name')}</div>

      <div className={controls()}>
        <button className={button()} onClick={onToggleSettings} title={t('settings.title')} type="button">
          <Icon name="settings" size={12} />
        </button>

        <button className={button()} onClick={handleMinimize} title="Minimize" type="button">
          <Icon name="minus" size={12} />
        </button>

        <button className={button({ close: true })} onClick={handleClose} title="Close" type="button">
          <Icon name="x" size={12} />
        </button>
      </div>
    </div>
  )
}
