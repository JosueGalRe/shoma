import { Radio, RadioGroup } from '@shoma/ui/radio-group'
import { create } from '@stylexjs/stylex'
import { useTranslation } from 'react-i18next'

import type { OptionStepProps } from './create-lobby-steps-types'

// Figma "Select SubMode": the queues of the picked mode, named as the client names them
export function OptionStep({ onOptionChange, option, queues, withPracticeTool }: OptionStepProps) {
  const { t } = useTranslation()

  return (
    <RadioGroup aria-label={t('createLobby.steps.option')} style={styles.list} value={option} onValueChange={onOptionChange}>
      {withPracticeTool ? <Radio label={t('createLobby.practiceTool')} style={styles.option} value="practice-tool" /> : null}

      {queues.map((queue) => {
        return <Radio key={queue.id} label={queue.description} style={styles.option} value={queue.id} />
      })}
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
