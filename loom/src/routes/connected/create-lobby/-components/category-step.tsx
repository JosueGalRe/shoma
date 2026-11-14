import { Radio, RadioGroup } from '@shoma/ui/radio-group'
import { create } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import type { CategoryStepProps } from './create-lobby-steps-types'

// Figma "Select Categories": the kinds of game, indented under the title
export function CategoryStep({ category, onCategoryChange }: CategoryStepProps) {
  const { t } = useTranslation()

  return (
    <RadioGroup
      aria-label={t('createLobby.steps.category')}
      style={styles.list}
      value={category}
      onValueChange={onCategoryChange}
    >
      <Radio label={t('createLobby.categories.pvp')} style={styles.option} value="pvp" />

      <Radio label={t('createLobby.categories.coop')} style={styles.option} value="coop" />

      <Radio label={t('createLobby.categories.training')} style={styles.option} value="training" />
    </RadioGroup>
  )
}

const styles = create({
  list: {
    paddingInline: 24,
  },
  option: {
    textTransform: 'uppercase',
  },
})
