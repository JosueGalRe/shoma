import { Loader2, Lock, UserCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

export type LobbyVisibilityToggleProps = {
  partyType: string | null
  isOwner: boolean
  isLoading: boolean
  disabled?: boolean
  onToggle: (partyType: string) => void
}

export function LobbyVisibilityToggle({ partyType, isOwner, isLoading, disabled, onToggle }: LobbyVisibilityToggleProps) {
  const { t } = useTranslation()
  const isOpen = partyType === 'open'
  const ToggleIcon = isLoading ? Loader2 : isOpen ? UserCheck : Lock

  if (!isOwner) {
    return (
      <div
        className={cn(
          'flex h-5 items-center justify-center rounded-full border border-[color-mix(in_srgb,rgb(200,170,110)_40%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_40%,transparent)] px-3 backdrop-blur-md transition-all',
          isOpen &&
            'border-[color-mix(in_srgb,rgb(15,196,0)_40%,transparent)] shadow-[0_0_6px_color-mix(in_srgb,rgb(15,196,0)_15%,transparent)]',
        )}
      >
        <span className='text-[10px] font-bold tracking-wider text-[rgb(200,170,110)] uppercase'>
          {isOpen ? t('lobby.open') : t('lobby.closed')}
        </span>
      </div>
    )
  }

  return (
    <button
      type='button'
      disabled={isLoading || disabled}
      onClick={() => onToggle(isOpen ? 'closed' : 'open')}
      className={cn(
        'relative flex h-5 w-[90px] items-center rounded-full border border-[color-mix(in_srgb,rgb(200,170,110)_40%,transparent)] bg-[color-mix(in_srgb,rgb(10,20,40)_40%,transparent)] p-[2px] backdrop-blur-md transition-all hover:bg-[color-mix(in_srgb,rgb(10,20,40)_50%,transparent)] hover:backdrop-blur-lg',
        isOpen &&
          'border-[color-mix(in_srgb,rgb(15,196,0)_40%,transparent)] shadow-[0_0_6px_color-mix(in_srgb,rgb(15,196,0)_15%,transparent)]',
        (isLoading || disabled) && 'cursor-not-allowed opacity-70',
      )}
    >
      <div className='absolute inset-0 flex items-center justify-between px-2'>
        <span
          className={cn(
            'text-[9px] font-bold tracking-wider text-[rgb(200,170,110)] uppercase transition-opacity duration-300',
            isOpen ? 'opacity-100' : 'opacity-0',
          )}
        >
          {t('lobby.open')}
        </span>
        <span
          className={cn(
            'text-[9px] font-bold tracking-wider text-[rgb(200,170,110)] uppercase transition-opacity duration-300',
            isOpen ? 'opacity-0' : 'opacity-100',
          )}
        >
          {t('lobby.closed')}
        </span>
      </div>

      <div
        className={cn(
          'absolute left-[2px] flex size-4 items-center justify-center rounded-full bg-[rgb(200,170,110)] text-[#0a1e3c] transition-transform duration-300',
          isOpen ? 'translate-x-[66px]' : 'translate-x-0',
        )}
      >
        <ToggleIcon className={cn('size-3', isLoading && 'animate-spin')} />
      </div>
    </button>
  )
}
