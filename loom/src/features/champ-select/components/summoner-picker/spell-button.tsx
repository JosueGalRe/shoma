import { summonerSpellUrl } from '../../utils'
import type { SpellButtonProps } from './types'

export function SpellButton({ spell, ddragonVersion, label, onClick }: SpellButtonProps) {
  return (
    <button
      type='button'
      className='border-border bg-background hover:border-primary/50 focus-visible:border-primary focus-visible:ring-ring flex min-h-[44px] w-full items-center gap-3 rounded-md border p-2 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none'
      onClick={onClick}
    >
      <img
        alt=''
        className='border-primary/40 bg-background size-12 rounded-md border object-cover shadow-md'
        loading='lazy'
        src={summonerSpellUrl(ddragonVersion, spell) ?? undefined}
      />
      <span className='text-foreground text-sm'>{spell ? spell.name : label}</span>
    </button>
  )
}
