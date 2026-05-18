import { useState, useEffect, useCallback } from 'react'

import { AppState, TranslationKey } from '../App'
import { PrototypeSwitcher } from './prototype-switcher'
import { VariantA } from './variant-a'
import { VariantB } from './variant-b'
import { VariantC } from './variant-c'
import { VariantD } from './variant-d'

type VariantKey = 'real' | 'A' | 'B' | 'C' | 'D'

type PrototypeProps = {
  state: AppState
  t: (key: TranslationKey) => string
  hasRelayError: boolean
  hasLcuError: boolean
  showQR: boolean
  setShowQR: (show: boolean) => void
  handleCopyCode: () => void
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  url?: string
}

const VARIANTS: VariantKey[] = ['real', 'A', 'B', 'C', 'D']

export function ConduitPrototype(props: PrototypeProps) {
  const [variant, setVariantState] = useState<VariantKey>('real')

  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (hash.startsWith('prototype-')) {
      const v = hash.replace('prototype-', '') as VariantKey
      if (VARIANTS.includes(v)) {
        setVariantState(v)
      }
    }
  }, [])

  const setVariant = useCallback((v: VariantKey) => {
    setVariantState(v)
    window.location.hash = `prototype-${v}`
  }, [])

  return (
    <>
      {variant !== 'real' && (
        <div style={{
          position: 'fixed',
          top: 32,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'var(--shoma-surface)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 12,
          zIndex: 50,
        }}>
          {variant === 'A' && <VariantA {...props} />}
          {variant === 'B' && <VariantB {...props} />}
          {variant === 'C' && <VariantC {...props} />}
          {variant === 'D' && <VariantD {...props} />}
        </div>
      )}
      <PrototypeSwitcher variant={variant} setVariant={setVariant} />
    </>
  )
}
