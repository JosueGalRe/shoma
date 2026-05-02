import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ddragonVersionQueryOptions } from '@core/http/ddragon-client'

import { buildSpellIconUrl } from '../-lobby-utils'

interface SpellsCardProps {
  availableSpellIds: number[]
  selectedSpell1Draft: string
  selectedSpell2Draft: string
  selectSummonerSpell: (slot: 1 | 2, value: string) => Promise<void>
}

const SPELL_ID_TO_KEY: Record<number, string> = {
  21: 'Barrier',
  1: 'Boost',
  2202: 'CherryFlash',
  2201: 'CherryHold',
  14: 'Dot',
  3: 'Exhaust',
  4: 'Flash',
  6: 'Haste',
  7: 'Heal',
  13: 'Mana',
  30: 'PoroRecall',
  31: 'PoroThrow',
  11: 'Smite',
  39: 'SnowURFSnowball_Mark',
  32: 'Snowball',
  12: 'Teleport',
  54: '_UltBookPlaceholder',
  55: '_UltBookSmitePlaceholder',
}

export function SpellsCard({
  availableSpellIds,
  selectedSpell1Draft,
  selectedSpell2Draft,
  selectSummonerSpell,
}: SpellsCardProps) {
  const { t } = useTranslation()
  const { data: ddragonVersion } = useQuery(ddragonVersionQueryOptions())
  const [activeSlot, setActiveSlot] = useState<1 | 2>(1)

  const ddragonVersionValue = ddragonVersion ?? null

  return (
    <div className='rounded-xl border border-gold-dim/30 bg-background/40 p-4 sm:col-span-2'>
      <p className='font-display text-sm uppercase tracking-[0.1em] text-primary'>
        {t(($) => $.connected.champSelectSpellsTitle)}
      </p>
      {availableSpellIds.length > 0 ? (
        <div className='mt-6 flex flex-col gap-6'>
          <div className='flex justify-center gap-8'>
            <button
              type='button'
              onClick={() => setActiveSlot(1)}
              className={`relative rounded-xl border-2 transition-all ${
                activeSlot === 1
                  ? 'scale-105 border-primary shadow-[0_0_15px_rgba(200,169,110,0.4)]'
                  : 'border-gold-dim/50 hover:border-primary/70'
              }`}
            >
              <img
                src={
                  buildSpellIconUrl(
                    ddragonVersionValue,
                    (SPELL_ID_TO_KEY[Number(selectedSpell1Draft)] || selectedSpell1Draft) as unknown as number,
                  ) ?? undefined
                }
                alt='Spell 1'
                className='h-16 w-16 rounded-lg object-cover'
              />
              {activeSlot === 1 && (
                <div className='absolute -bottom-2.5 left-1/2 -translate-x-1/2 rounded bg-background px-2 py-0.5 text-[10px] font-bold text-primary border border-primary'>
                  SELECTING
                </div>
              )}
            </button>

            <button
              type='button'
              onClick={() => setActiveSlot(2)}
              className={`relative rounded-xl border-2 transition-all ${
                activeSlot === 2
                  ? 'scale-105 border-primary shadow-[0_0_15px_rgba(200,169,110,0.4)]'
                  : 'border-gold-dim/50 hover:border-primary/70'
              }`}
            >
              <img
                src={
                  buildSpellIconUrl(
                    ddragonVersionValue,
                    (SPELL_ID_TO_KEY[Number(selectedSpell2Draft)] || selectedSpell2Draft) as unknown as number,
                  ) ?? undefined
                }
                alt='Spell 2'
                className='h-16 w-16 rounded-lg object-cover'
              />
              {activeSlot === 2 && (
                <div className='absolute -bottom-2.5 left-1/2 -translate-x-1/2 rounded bg-background px-2 py-0.5 text-[10px] font-bold text-primary border border-primary'>
                  SELECTING
                </div>
              )}
            </button>
          </div>

          <div className='grid grid-cols-4 gap-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8'>
            {availableSpellIds.map((spellId) => {
              const isSelected = String(spellId) === (activeSlot === 1 ? selectedSpell1Draft : selectedSpell2Draft)

              return (
                <button
                  key={spellId}
                  type='button'
                  onClick={() => {
                    void selectSummonerSpell(activeSlot, String(spellId))
                  }}
                  className='group flex flex-col items-center gap-2'
                >
                  <img
                    src={
                      buildSpellIconUrl(
                        ddragonVersionValue,
                        (SPELL_ID_TO_KEY[spellId] || spellId) as unknown as number,
                      ) ?? undefined
                    }
                    alt={t(($) => $.connected.champSelectSpellValue, { value: String(spellId) })}
                    className={`h-12 w-12 rounded-lg border object-cover transition-all ${
                      isSelected
                        ? 'border-primary shadow-[0_0_10px_rgba(200,169,110,0.3)]'
                        : 'border-gold-dim/50 group-hover:border-primary/50'
                    }`}
                  />
                  <span
                    className={`text-center text-xs ${isSelected ? 'font-medium text-primary' : 'text-muted-foreground'}`}
                  >
                    {t(($) => $.connected.champSelectSpellValue, { value: String(spellId) })}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <p className='mt-3 text-sm italic text-muted-foreground'>{t(($) => $.connected.champSelectNoSpells)}</p>
      )}
    </div>
  )
}
