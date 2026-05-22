import { Spinner } from '@/components/ui'

type Props = {
  isOpen: boolean
  targetRoute: string | null
}

export function GameflowTransitionOverlay({ isOpen, targetRoute }: Props) {
  if (!isOpen) return null

  const label =
    targetRoute === '/connected/lobby'
      ? 'Sincronizando lobby...'
      : targetRoute === '/connected/queue'
        ? 'Entrando a cola...'
        : targetRoute === '/connected/champ-select'
          ? 'Entrando a selección...'
          : 'Actualizando...'

  return (
    <div
      className='bg-background/85 fixed inset-0 z-40 flex items-center justify-center p-4 backdrop-blur-sm'
      role='status'
      aria-live='polite'
      aria-busy='true'
    >
      <div className='border-primary/40 bg-secondary/90 rounded-lg border px-6 py-5 text-center shadow-[0_0_20px_var(--shoma-primary)]'>
        <Spinner className='text-primary mx-auto mb-3 size-8' />
        <p className='text-foreground text-sm font-medium'>{label}</p>
      </div>
    </div>
  )
}
