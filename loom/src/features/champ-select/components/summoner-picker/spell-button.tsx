import { summonerSpellUrl } from '../../champ-select-utils'
import { summonerPickerStyles } from '../summoner-picker-styles'
import type { SpellButtonProps } from './summoner-picker-types'

export function SpellButton({ spell, ddragonVersion, label, onClick }: SpellButtonProps) {
  const styles = summonerPickerStyles({ active: spell !== null })

  return (
    <button
      type='button'
      className={styles.spellButton()}
      onClick={onClick}
    >
      <img
        alt=''
        className={styles.spellButtonImage()}
        loading='lazy'
        src={summonerSpellUrl(ddragonVersion, spell) ?? undefined}
      />
      <span className={styles.spellButtonText()}>{spell ? spell.name : label}</span>
    </button>
  )
}
