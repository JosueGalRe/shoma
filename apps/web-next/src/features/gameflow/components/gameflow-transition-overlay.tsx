import { Spinner } from '@/components/ui'

type Props = {
  isOpen: boolean
  targetRoute: string | null
}

export function GameflowTransitionOverlay({ isOpen, targetRoute }: Props) {
  if (!isOpen) return null

  const label = targetRoute === '/connected/lobby' 
    ? 'Sincronizando lobby...' 
    : targetRoute === '/connected/queue'
      ? 'Entrando a cola...'
      : targetRoute === '/connected/champ-select'
        ? 'Entrando a selección...'
        : 'Actualizando...'

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-lol-navy-950/85 p-4 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="rounded-lg border border-lol-border-gold/40 bg-lol-navy-900/90 px-6 py-5 text-center shadow-lol-glow-gold">
        <Spinner className="mx-auto mb-3 size-8 text-lol-gold" />
        <p className="text-sm font-medium text-lol-text-primary">{label}</p>
      </div>
    </div>
  )
}