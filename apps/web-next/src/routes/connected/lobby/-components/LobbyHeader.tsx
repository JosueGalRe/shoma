import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@features/i18n/language-switcher'

interface LobbyHeaderProps {
  peerName: string | null
  peerVersion: string | null
}

export function LobbyHeader({ peerName, peerVersion }: LobbyHeaderProps) {
  const { t } = useTranslation()

  return (
    <div className='flex flex-wrap items-center justify-between gap-3 border-b border-[#785a28]/30 pb-6'>
      <div>
        <h1 className='font-display text-2xl sm:text-4xl leading-tight text-[#c8a96e] drop-shadow-md'>
          {t(($) => $.connected.title)}
        </h1>
        <div className='mt-1 flex items-center gap-2 text-sm'>
          <span className='text-[#a09b8c]'>{t(($) => $.connected.desktop)}:</span>
          <span className='font-semibold text-[#f0e6d2]'>{peerName ?? t(($) => $.connected.unknownMachine)}</span>
          <span className='text-[#785a28]'>•</span>
          <span className='text-[#a09b8c]'>v{peerVersion ?? t(($) => $.connected.pending)}</span>
        </div>
      </div>
      <div className='flex items-center gap-3'>
        <LanguageSwitcher />
        <Button asChild variant='outline' className='font-display h-10 px-6 tracking-wider uppercase'>
          <Link to='/'>{t(($) => $.connected.back)}</Link>
        </Button>
      </div>
    </div>
  )
}
