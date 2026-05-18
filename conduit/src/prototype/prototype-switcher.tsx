import { useEffect, useCallback } from 'react'

type VariantKey = 'real' | 'A' | 'B' | 'C'

type SwitcherProps = {
  variant: VariantKey
  setVariant: (v: VariantKey) => void
}

const labels: Record<VariantKey, string> = {
  real: 'Real App',
  A: 'Refined Vertical',
  B: 'Dashboard Bar',
  C: 'Minimal Overlay',
}

const order: VariantKey[] = ['real', 'A', 'B', 'C']

export function PrototypeSwitcher({ variant, setVariant }: SwitcherProps) {
  const cycle = useCallback((dir: 'prev' | 'next') => {
    const idx = order.indexOf(variant)
    const nextIdx = dir === 'next'
      ? (idx + 1) % order.length
      : (idx - 1 + order.length) % order.length
    setVariant(order[nextIdx])
  }, [variant, setVariant])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        cycle('prev')
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        cycle('next')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cycle])

  if (!import.meta.env.DEV) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '4px',
          background: '#1a1a1a',
          border: '1px solid #333',
          padding: '4px',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          pointerEvents: 'auto',
        }}
      >
        {order.map((v) => (
          <button
            key={v}
            onClick={() => setVariant(v)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: variant === v ? 'var(--shoma-primary)' : 'transparent',
              color: variant === v ? '#000' : '#888',
              fontSize: '12px',
              fontWeight: variant === v ? 600 : 400,
              cursor: 'pointer',
              fontFamily: 'monospace',
              transition: 'all 0.15s',
            }}
          >
            {v === 'real' ? 'R' : v}
          </button>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: '#1a1a1a',
          border: '1px solid #333',
          padding: '6px 12px',
          borderRadius: '999px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          pointerEvents: 'auto',
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#fff',
        }}
      >
        <button
          onClick={() => cycle('prev')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            padding: '4px 8px',
            fontSize: '14px',
          }}
        >
          ←
        </button>
        <span style={{ minWidth: '130px', textAlign: 'center' }}>
          {labels[variant]}
        </span>
        <button
          onClick={() => cycle('next')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            padding: '4px 8px',
            fontSize: '14px',
          }}
        >
          →
        </button>
      </div>
    </div>
  )
}
