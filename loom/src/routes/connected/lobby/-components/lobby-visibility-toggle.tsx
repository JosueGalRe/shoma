import { Loader2, Lock, UserCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

export type LobbyVisibilityToggleProps = {
  partyType: string | null
  isOwner: boolean
  isLoading: boolean
  onToggle: (partyType: string) => void
}

export function LobbyVisibilityToggle({ partyType, isOwner, isLoading, onToggle }: LobbyVisibilityToggleProps) {
  const { t } = useTranslation()
  const isOpen = partyType === 'open'

  if (!isOwner) {
    return (
      <div
        className={cn(
          'flex h-7 w-[120px] items-center justify-center rounded-full border border-[rgba(200,170,110,0.4)] px-2',
          isOpen ? 'bg-[#0f2e1b]' : 'bg-[#0a1e3c]',
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
      disabled={isLoading}
      onClick={() => onToggle(isOpen ? 'closed' : 'open')}
      className={cn(
        'relative flex h-7 w-[120px] items-center rounded-full border border-[rgba(200,170,110,0.4)] p-0.5 transition-colors duration-300',
        isOpen ? 'bg-[#0f2e1b]' : 'bg-[#0a1e3c]',
        isLoading && 'cursor-not-allowed opacity-70',
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
        {isLoading ? (
          <Loader2 className='size-3.5 animate-spin' />
        ) : isOpen ? (
          <UserCheck className='size-3.5' />
        ) : (
          <Lock className='size-3.5' />
        )}
      </div>
    </button>
  )
}
