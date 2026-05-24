import { useTranslation } from 'react-i18next'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { useChampionSkins } from '@/core/http/ddragon-client'
import { ChampionId, RuneId, SpellId } from '@/core/types/branded'
import type { ChampionSkin } from '@/core/http/ddragon-client';
import { runeIconUrl, summonerSpellUrl } from '@/features/champ-select';
import { useSwiftplayStore } from '@/features/swiftplay/swiftplay-store'

import type { OptionCardProps } from './option-card-types'
import { optionCardStyles } from './option-card-styles'
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
  const setOption = useSwiftplayStore((state) => {return state.setOption})
  const championSkinsQuery = useChampionSkins(option.championId ?? undefined)
  const styles = optionCardStyles({
    disabled: !champions || championSkinsQuery.isLoading,
  })
  const selectedChampion = champions?.find((champion) => {return champion.id === option.championId}) ?? null
  const selectedRuneTree = runeTrees.find((tree) => {return tree.id === option.runeId}) ?? null
  const selectedSpell1 = summonerSpells.find((spell) => {return spell.id === option.spell1Id}) ?? null
  const selectedSpell2 = summonerSpells.find((spell) => {return spell.id === option.spell2Id}) ?? null
  const selectedSkins = championSkinsQuery.data ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle className={styles.title()}>
          {t(optionIndex === 1 ? 'swiftplay.option1' : 'swiftplay.option2')}
        </CardTitle>
      </CardHeader>
      <CardContent className={styles.content()}>
        <label className={styles.field()}>
          <span>{t('swiftplay.champion')}</span>
          <select
            className={styles.select()}
            disabled={!champions}
            onChange={(event) => {
              setOption(optionIndex, 'championId', event.target.value ? ChampionId(Number(event.target.value)) : null)
              setOption(optionIndex, 'skinId', null)
            }}
            value={option.championId ?? ''}
          >
            <option value=''>{isLoading ? t('common.loading') : t('swiftplay.champion')}</option>
            {champions?.map((champion) => {return (
              <option key={champion.id} value={champion.id}>
                {champion.name}
              </option>
            )})}
          </select>
        </label>

        <label className={styles.field()}>
          <span>{t('swiftplay.position')}</span>
          <select
            className={styles.select()}
            onChange={(event) => {
              setOption(optionIndex, 'position', event.target.value || null)
            }}
            value={option.position ?? ''}
          >
            <option value=''>{t('swiftplay.position')}</option>
            {positions.map((position) => {return (
              <option key={position.value} value={position.value}>
                {t(position.labelKey)}
              </option>
            )})}
          </select>
        </label>

        <label className={styles.field()}>
          <span>{t('swiftplay.rune')}</span>
          <div className={styles.inline()}>
            <img
              alt=''
              className={styles.icon()}
              src={runeIconUrl(selectedRuneTree?.icon) ?? undefined}
            />
            <select
              className={styles.select()}
              onChange={(event) => {
                setOption(optionIndex, 'runeId', event.target.value ? RuneId(Number(event.target.value)) : null)
              }}
              value={option.runeId ?? ''}
            >
              <option value=''>{t('swiftplay.chooseRune')}</option>
              {runeTrees.map((tree) => {return (
                <option key={tree.id} value={tree.id}>
                  {tree.name}
                </option>
              )})}
            </select>
          </div>
        </label>

        <div className='grid gap-3 sm:grid-cols-2'>
          <label className={styles.field()}>
            <span>{t('swiftplay.spell1')}</span>
            <div className={styles.inline()}>
              <img
                alt=''
                className={styles.icon()}
                src={summonerSpellUrl(ddragonVersion, selectedSpell1) ?? undefined}
              />
              <select
                className={styles.select()}
                onChange={(event) => {
                  setOption(optionIndex, 'spell1Id', event.target.value ? SpellId(Number(event.target.value)) : null)
                }}
                value={option.spell1Id ?? ''}
              >
                <option value=''>{t('swiftplay.chooseSpell')}</option>
                {summonerSpells.map((spell) => {return (
                  <option key={spell.id} value={spell.id}>
                    {spell.name}
                  </option>
                )})}
              </select>
            </div>
          </label>

          <label className={styles.field()}>
            <span>{t('swiftplay.spell2')}</span>
            <div className={styles.inline()}>
              <img
                alt=''
                className={styles.icon()}
                src={summonerSpellUrl(ddragonVersion, selectedSpell2) ?? undefined}
              />
              <select
                className={styles.select()}
                onChange={(event) => {
                  setOption(optionIndex, 'spell2Id', event.target.value ? SpellId(Number(event.target.value)) : null)
                }}
                value={option.spell2Id ?? ''}
              >
                <option value=''>{t('swiftplay.chooseSpell')}</option>
                {summonerSpells.map((spell) => {return (
                  <option key={spell.id} value={spell.id}>
                    {spell.name}
                  </option>
                )})}
              </select>
            </div>
          </label>
        </div>

        <label className={styles.field()}>
          <span>{t('swiftplay.skin')}</span>
          <select
            className={styles.select()}
            disabled={!option.championId || championSkinsQuery.isLoading}
            onChange={(event) => {
              setOption(optionIndex, 'skinId', event.target.value ? Number(event.target.value) : null)
            }}
            value={option.skinId ?? ''}
          >
            <option value=''>{t('swiftplay.chooseSkin')}</option>
            {selectedSkins.map((skin: ChampionSkin) => {return (
              <option key={skin.id} value={skin.num}>
                {skin.name}
              </option>
            )})}
          </select>
        </label>

        {selectedSkins.length > 0 ? (
          <div className={styles.skinGrid()}>
            {selectedSkins.map((skin) => {
              const isSelectedSkin = option.skinId === skin.num
              const skinButtonStyles = optionCardStyles({ selected: isSelectedSkin })

              return (
                <button
                  className={skinButtonStyles.skinButton()}
                  key={skin.id}
                  onClick={() => {return setOption(optionIndex, 'skinId', skin.num)}}
                  type='button'
                >
                  <img
                    alt={skin.name}
                    className={styles.skinImage()}
                    src={championSkinUrl(selectedChampion?.key ?? null, skin.num) ?? undefined}
                  />
                  <div className={styles.skinLabel()}>{skin.name}</div>
                </button>
              )
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
