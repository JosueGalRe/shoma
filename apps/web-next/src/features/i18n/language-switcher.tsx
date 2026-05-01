import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const current = i18n.resolvedLanguage?.startsWith('es') ? 'es' : 'en'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className='h-9 rounded-xl border-[#785a28]/50 bg-[#1e2328]/60 text-[#c8a96e] hover:border-[#c8a96e] hover:bg-[#c8a96e]/10 hover:text-[#f0e6d2]'
          size='sm'
          variant='outline'
        >
          {current.toUpperCase()}
          <ChevronDown className='size-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-44 border-[#785a28]/50 bg-[#0a1428] text-[#f0e6d2]'>
        <DropdownMenuRadioGroup
          onValueChange={(nextValue) => {
            void i18n.changeLanguage(nextValue)
          }}
          value={current}
        >
          <DropdownMenuRadioItem className='text-[#f0e6d2] focus:bg-[#c8a96e]/10 focus:text-[#f0e6d2]' value='en'>
            {t(($) => $.language.english)}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem className='text-[#f0e6d2] focus:bg-[#c8a96e]/10 focus:text-[#f0e6d2]' value='es'>
            {t(($) => $.language.spanish)}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
