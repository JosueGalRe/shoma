import { useState, useEffect, useCallback } from 'react'

import { AppState, TranslationKey } from '../App'
import { PrototypeSwitcher } from './prototype-switcher'
import { VariantA } from './variant-a'
import { VariantB } from './variant-b'
import { VariantC } from './variant-c'

type VariantKey = 'A' | 'B' | 'C'

type PrototypeProps = {
  state: AppState
  t: (key: TranslationKey) => string
  hasRelayError: boolean
  hasLcuError: boolean
  showQR: boolean
  setShowQR: (show: boolean) => void
  handleCopyCode: () => void
  canvasRef: React.RefObject<HTMLCanvasElement | null>
}

const VARIANTS: VariantKey[] = ['A', 'B', 'C']

export function ConduitPrototype(props: PrototypeProps) {
  const [variant, setVariantState] = useState<VariantKey>('A')

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
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {variant === 'A' && <VariantA {...props} />}
      {variant === 'B' && <VariantB {...props} />}
      {variant === 'C' && <VariantC {...props} />}
      <PrototypeSwitcher variant={variant} setVariant={setVariant} />
    </div>
  )
}
