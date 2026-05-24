import { useTranslation } from 'react-i18next'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { useChampionSkins } from '@/core/http/ddragon-client'
import { ChampionId, RuneId, SpellId } from '@/core/types/branded'
import type { ChampionSkin } from '@/core/http/ddragon-client';
import type { RuneTree } from '@/core/http/ddragon-client';
import { runeIconUrl, summonerSpellUrl } from '@/features/champ-select';
import type { SummonerSpell } from '@/features/champ-select';
import { useSwiftplayStore } from '@/features/swiftplay/swiftplay-store'

import type { OptionCardProps } from './option-card-types'
import { championSkinUrl, positions } from './option-card-utils'

export function OptionCard({
  champions,
  ddragonVersion,
  isLoading,
  option,
  optionIndex,
  runeTrees,
  summonerSpells,
}: OptionCardProps) {
  const { t } = useTranslation()
  const setOption = useSwiftplayStore((state) => state.setOption)
  const championSkinsQuery = useChampionSkins(option.championId ?? undefined)
  const selectedChampion = champions?.find((champion) => champion.id === option.championId) ?? null
  const selectedRuneTree = runeTrees.find((tree) => tree.id === option.runeId) ?? null
  const selectedSpell1 = summonerSpells.find((spell) => spell.id === option.spell1Id) ?? null
  const selectedSpell2 = summonerSpells.find((spell) => spell.id === option.spell2Id) ?? null
  const selectedSkins = championSkinsQuery.data ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle className='font-display text-primary'>
          {t(optionIndex === 1 ? 'swiftplay.option1' : 'swiftplay.option2')}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        <label className='text-muted block space-y-1 text-sm'>
          <span>{t('swiftplay.champion')}</span>
          <select
            className='border-border bg-background text-foreground focus:border-primary focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus:shadow-[0_0_20px_var(--shoma-primary)] focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50'
            disabled={!champions}
            onChange={(event) => {
              setOption(optionIndex, 'championId', event.target.value ? ChampionId(Number(event.target.value)) : null)
              setOption(optionIndex, 'skinId', null)
            }}
            value={option.championId ?? ''}
          >
            <option value=''>{isLoading ? t('common.loading') : t('swiftplay.champion')}</option>
            {champions?.map((champion) => (
              <option key={champion.id} value={champion.id}>
                {champion.name}
              </option>
            ))}
          </select>
        </label>

        <label className='text-muted block space-y-1 text-sm'>
          <span>{t('swiftplay.position')}</span>
          <select
            className='border-border bg-background text-foreground focus:border-primary focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus:shadow-[0_0_20px_var(--shoma-primary)] focus-visible:ring-2 focus-visible:outline-none'
            onChange={(event) => {
              setOption(optionIndex, 'position', event.target.value || null)
            }}
            value={option.position ?? ''}
          >
            <option value=''>{t('swiftplay.position')}</option>
            {positions.map((position) => (
              <option key={position.value} value={position.value}>
                {t(position.labelKey)}
              </option>
            ))}
          </select>
        </label>

        <label className='text-muted block space-y-1 text-sm'>
          <span>{t('swiftplay.rune')}</span>
          <div className='flex items-center gap-2'>
            <img
              alt=''
              className='border-border bg-background size-8 rounded-md border object-cover'
              src={runeIconUrl(selectedRuneTree?.icon) ?? undefined}
            />
            <select
              className='border-border bg-background text-foreground focus:border-primary focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus:shadow-[0_0_20px_var(--shoma-primary)] focus-visible:ring-2 focus-visible:outline-none'
              onChange={(event) => {
                setOption(optionIndex, 'runeId', event.target.value ? RuneId(Number(event.target.value)) : null)
              }}
              value={option.runeId ?? ''}
            >
              <option value=''>{t('swiftplay.chooseRune')}</option>
              {runeTrees.map((tree) => (
                <option key={tree.id} value={tree.id}>
                  {tree.name}
                </option>
              ))}
            </select>
          </div>
        </label>

        <div className='grid gap-3 sm:grid-cols-2'>
          <label className='text-muted block space-y-1 text-sm'>
            <span>{t('swiftplay.spell1')}</span>
            <div className='flex items-center gap-2'>
              <img
                alt=''
                className='border-border bg-background size-8 rounded-md border object-cover'
                src={summonerSpellUrl(ddragonVersion, selectedSpell1) ?? undefined}
              />
              <select
                className='border-border bg-background text-foreground focus:border-primary focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus:shadow-[0_0_20px_var(--shoma-primary)] focus-visible:ring-2 focus-visible:outline-none'
                onChange={(event) => {
                  setOption(optionIndex, 'spell1Id', event.target.value ? SpellId(Number(event.target.value)) : null)
                }}
                value={option.spell1Id ?? ''}
              >
                <option value=''>{t('swiftplay.chooseSpell')}</option>
                {summonerSpells.map((spell) => (
                  <option key={spell.id} value={spell.id}>
                    {spell.name}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className='text-muted block space-y-1 text-sm'>
            <span>{t('swiftplay.spell2')}</span>
            <div className='flex items-center gap-2'>
              <img
                alt=''
                className='border-border bg-background size-8 rounded-md border object-cover'
                src={summonerSpellUrl(ddragonVersion, selectedSpell2) ?? undefined}
              />
              <select
                className='border-border bg-background text-foreground focus:border-primary focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus:shadow-[0_0_20px_var(--shoma-primary)] focus-visible:ring-2 focus-visible:outline-none'
                onChange={(event) => {
                  setOption(optionIndex, 'spell2Id', event.target.value ? SpellId(Number(event.target.value)) : null)
                }}
                value={option.spell2Id ?? ''}
              >
                <option value=''>{t('swiftplay.chooseSpell')}</option>
                {summonerSpells.map((spell) => (
                  <option key={spell.id} value={spell.id}>
                    {spell.name}
                  </option>
                ))}
              </select>
            </div>
          </label>
        </div>

        <label className='text-muted block space-y-1 text-sm'>
          <span>{t('swiftplay.skin')}</span>
          <select
            className='border-border bg-background text-foreground focus:border-primary focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus:shadow-[0_0_20px_var(--shoma-primary)] focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50'
            disabled={!option.championId || championSkinsQuery.isLoading}
            onChange={(event) => {
              setOption(optionIndex, 'skinId', event.target.value ? Number(event.target.value) : null)
            }}
            value={option.skinId ?? ''}
          >
            <option value=''>{t('swiftplay.chooseSkin')}</option>
            {selectedSkins.map((skin: ChampionSkin) => (
              <option key={skin.id} value={skin.num}>
                {skin.name}
              </option>
            ))}
          </select>
        </label>

        {selectedSkins.length > 0 ? (
          <div className='grid grid-cols-2 gap-2'>
            {selectedSkins.map((skin) => {
              const isSelectedSkin = option.skinId === skin.num

              return (
                <button
                  className={`focus-visible:ring-ring overflow-hidden rounded-md border text-left focus-visible:ring-2 focus-visible:outline-none ${isSelectedSkin ? 'border-primary bg-secondary/60 shadow-[0_0_20px_var(--shoma-primary)]' : 'border-border bg-background'}`}
                  key={skin.id}
                  onClick={() => setOption(optionIndex, 'skinId', skin.num)}
                  type='button'
                >
                  <img
                    alt={skin.name}
                    className='h-20 w-full object-cover'
                    src={championSkinUrl(selectedChampion?.key ?? null, skin.num) ?? undefined}
                  />
                  <div className='text-muted p-2 text-xs'>{skin.name}</div>
                </button>
              )
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
