import { Spinner } from '@shoma/design-system'

import { generatingStateStyles } from './generating-state-styles'

interface GeneratingStateProps {
  label: string
}

export function GeneratingState({ label }: GeneratingStateProps) {
  const { base, label: labelClass } = generatingStateStyles()

  return (
    <div className={base()}>
      <Spinner label={label} />

      <span className={labelClass()}>{label}</span>
    </div>
  )
}
