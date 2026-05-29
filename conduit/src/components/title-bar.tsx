import { Icon } from '@shoma/design-system'
import { getCurrentWindow } from '@tauri-apps/api/window'

import type { TranslationKey } from '../app-utils'

interface TitleBarProps {
  onToggleSettings: () => void
  t: (key: TranslationKey) => string
}

export function TitleBar({ onToggleSettings, t }: TitleBarProps) {
  const handleMinimize = () => {
    void getCurrentWindow().minimize()
  }

  const handleClose = () => {
    void getCurrentWindow().close()
  }

  return (
    <div data-tauri-drag-region className="titlebar">
      <div className="titlebar-title">{t('app.name')}</div>

      <div className="titlebar-controls">
        <button className="titlebar-button" onClick={onToggleSettings} title={t('settings.title')} type="button">
          <Icon name="settings" size={12} />
        </button>

        <button className="titlebar-button" onClick={handleMinimize} title="Minimize" type="button">
          <Icon name="minus" size={12} />
        </button>

        <button className="titlebar-button close" onClick={handleClose} title="Close" type="button">
          <Icon name="x" size={12} />
        </button>
      </div>
    </div>
  )
}
