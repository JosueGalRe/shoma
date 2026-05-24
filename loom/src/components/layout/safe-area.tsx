import type { SafeAreaProps } from './safe-area-types'

export function SafeArea({ children, className = '' }: SafeAreaProps) {
  return (
    <div
      className={className}
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingRight: 'env(safe-area-inset-right)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
      }}
    >
      {children}
    </div>
  )
}
