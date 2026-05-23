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
          'flex h-7 w-[120px] items-center justify-center rounded-full border border-[rgba(200,170,110,0.4)] px-2 backdrop-blur-sm',
          isOpen ? 'bg-[rgba(15,46,27,0.4)]' : 'bg-[rgba(10,30,60,0.4)]',
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
        'relative flex h-7 w-[120px] items-center rounded-full border border-[rgba(200,170,110,0.4)] p-0.5 transition-colors duration-300 backdrop-blur-sm',
        isOpen ? 'bg-[rgba(15,46,27,0.4)]' : 'bg-[rgba(10,30,60,0.4)]',
        (isLoading || disabled) && 'cursor-not-allowed opacity-70',
      )}
    >
      <div className='absolute inset-0 flex items-center justify-between px-2'>
        <span
          className={cn(
            'text-[10px] font-bold tracking-wider text-[rgb(200,170,110)] uppercase transition-opacity duration-300',
            isOpen ? 'opacity-100' : 'opacity-0',
          )}
        >
          {t('lobby.open')}
        </span>
        <span
          className={cn(
            'text-[10px] font-bold tracking-wider text-[rgb(200,170,110)] uppercase transition-opacity duration-300',
            isOpen ? 'opacity-0' : 'opacity-100',
          )}
        >
          {t('lobby.closed')}
        </span>
      </div>

      <div
        className={cn(
          'absolute left-0.5 flex size-6 items-center justify-center rounded-full bg-[rgb(200,170,110)] text-[#0a1e3c] transition-transform duration-300',
          isOpen ? 'translate-x-[90px]' : 'translate-x-0',
        )}
      >
        <ToggleIcon className={cn('size-3.5', isLoading && 'animate-spin')} />
      </div>
    </button>
  )
}
