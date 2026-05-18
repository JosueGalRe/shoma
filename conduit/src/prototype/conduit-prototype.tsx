import { useState, useEffect } from 'react'

import { AppState, TranslationKey } from '../App'
import { PrototypeSwitcher } from './prototype-switcher'
import { VariantA } from './variant-a'
import { VariantB } from './variant-b'
import { VariantC } from './variant-c'

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

export function ConduitPrototype(props: PrototypeProps) {
  const [variant, setVariant] = useState<'A' | 'B' | 'C'>('A')

  useEffect(() => {
    const hash = window.location.hash.replace('#prototype-', '')
    if (hash === 'A' || hash === 'B' || hash === 'C') {
      setVariant(hash)
    }
  }, [])

  useEffect(() => {
    window.location.hash = `prototype-${variant}`
  }, [variant])

  return (
    <>
      {variant === 'A' && <VariantA {...props} />}
      {variant === 'B' && <VariantB {...props} />}
      {variant === 'C' && <VariantC {...props} />}
      <PrototypeSwitcher variant={variant} setVariant={setVariant} />
    </>
  )
}
