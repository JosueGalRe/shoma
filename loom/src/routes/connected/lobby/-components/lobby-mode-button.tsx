import { ArrowLeftRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { LobbyModeButtonProps } from './lobby-mode-button-types'

const pillClasses =
  'flex h-8 items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,rgb(200,170,110)_40%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_40%,transparent)] px-3 text-[10px] font-bold tracking-wider text-[rgb(200,170,110)] uppercase backdrop-blur-md'

export function LobbyModeButton({ disabled, isOwner, modeLabel, onSelect }: LobbyModeButtonProps) {
  const { t } = useTranslation()

  if (!isOwner) {
    return <span className={pillClasses}>{modeLabel}</span>
  }

  return (
    <button
      aria-label={t('lobby.changeMode')}
      className={`${pillClasses} transition-colors hover:border-[color-mix(in_srgb,rgb(200,170,110)_60%,transparent)] hover:bg-[color-mix(in_srgb,rgb(200,170,110)_10%,transparent)]`}
      disabled={disabled}
      onClick={onSelect}
      type="button"
    >
      <ArrowLeftRight className="size-3" />

      <span>{modeLabel}</span>
    </button>
  )
}
