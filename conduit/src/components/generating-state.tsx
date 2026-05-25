import { Spinner } from '@shoma/design-system'

interface GeneratingStateProps {
  label: string
}

export function GeneratingState({ label }: GeneratingStateProps) {
  return (
    <div className="generating-state">
      <Spinner label={label} />

      <span className="generating-label">{label}</span>
    </div>
  )
}
