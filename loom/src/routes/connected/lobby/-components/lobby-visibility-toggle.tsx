import { Loader2, Lock, UserCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/shared-utils'

import type { LobbyVisibilityToggleProps } from './lobby-visibility-toggle-types'

export function LobbyVisibilityToggle({ disabled, isLoading, isOwner, onToggle, partyType }: LobbyVisibilityToggleProps) {
  const { t } = useTranslation()
  const isOpen = partyType === 'open'
  let ToggleIcon = Lock

  if (isLoading) {
    ToggleIcon = Loader2
  } else if (isOpen) {
    ToggleIcon = UserCheck
  }

  const label = isOpen ? t('lobby.open') : t('lobby.closed')

  if (!isOwner) {
    return (
      <div
        aria-label={label}
        className={cn(
          'flex size-8 items-center justify-center rounded-full border border-[color-mix(in_srgb,rgb(200,170,110)_40%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_40%,transparent)] text-[rgb(200,170,110)] backdrop-blur-md transition-all',
          isOpen &&
            'border-[color-mix(in_srgb,rgb(15,196,0)_40%,transparent)] shadow-[0_0_6px_color-mix(in_srgb,rgb(15,196,0)_15%,transparent)]',
        )}
        title={label}
      >
        <ToggleIcon className={cn('size-3.5', isLoading && 'animate-spin')} />
      </div>
    )
  }

  return (
    <button
      aria-label={label}
      className={cn(
        'flex size-8 items-center justify-center rounded-full border border-[color-mix(in_srgb,rgb(200,170,110)_40%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_40%,transparent)] text-[rgb(200,170,110)] backdrop-blur-md transition-colors hover:border-[color-mix(in_srgb,rgb(200,170,110)_60%,transparent)] hover:bg-[color-mix(in_srgb,rgb(200,170,110)_10%,transparent)]',
        isOpen &&
          'border-[color-mix(in_srgb,rgb(15,196,0)_40%,transparent)] shadow-[0_0_6px_color-mix(in_srgb,rgb(15,196,0)_15%,transparent)]',
        (isLoading || disabled) && 'cursor-not-allowed opacity-70',
      )}
      disabled={isLoading || disabled}
      onClick={() => {
        return onToggle(isOpen ? 'closed' : 'open')
      }}
      title={label}
      type="button"
    >
      <ToggleIcon className={cn('size-3.5', isLoading && 'animate-spin')} />
    </button>
  )
}
