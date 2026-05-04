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
          className='h-9 rounded-xl border-gold-dim/50 bg-secondary/60 text-primary hover:border-primary hover:bg-primary/10 hover:text-foreground'
          size='sm'
          variant='outline'
        >
          {current.toUpperCase()}
          <ChevronDown className='size-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-44 border-gold-dim/50 bg-card text-foreground'>
        <DropdownMenuRadioGroup
          onValueChange={(nextValue) => {
            void i18n.changeLanguage(nextValue)
          }}
          value={current}
        >
          <DropdownMenuRadioItem className='text-foreground focus:bg-primary/10 focus:text-foreground' value='en'>
            {t(($) => $.language.english)}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem className='text-foreground focus:bg-primary/10 focus:text-foreground' value='es'>
            {t(($) => $.language.spanish)}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
