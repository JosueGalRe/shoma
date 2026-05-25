import type { SafeAreaProps } from './safe-area-types'

export function SafeArea({ children, className = '' }: SafeAreaProps) {
  return (
    <div
      className={className}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      {children}
    </div>
  )
}
