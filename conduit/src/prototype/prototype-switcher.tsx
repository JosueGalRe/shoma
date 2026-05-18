import { useEffect } from 'react'

type SwitcherProps = {
  variant: 'A' | 'B' | 'C'
  setVariant: (v: 'A' | 'B' | 'C') => void
}

const labels = {
  A: 'A — Refined Vertical',
  B: 'B — Dashboard Bar',
  C: 'C — Minimal Overlay',
}

export function PrototypeSwitcher({ variant, setVariant }: SwitcherProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setVariant(variant === 'A' ? 'C' : variant === 'B' ? 'A' : 'B')
      } else if (e.key === 'ArrowRight') {
        setVariant(variant === 'A' ? 'B' : variant === 'B' ? 'C' : 'A')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [variant, setVariant])

  if (!import.meta.env.DEV) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        background: '#1a1a1a',
        border: '1px solid #333',
        padding: '8px 16px',
        borderRadius: '999px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        zIndex: 9999,
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#fff',
      }}
    >
      <button
        onClick={() => setVariant(variant === 'A' ? 'C' : variant === 'B' ? 'A' : 'B')}
        style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', padding: '4px' }}
      >
        ←
      </button>
      <div style={{ minWidth: '160px', textAlign: 'center' }}>{labels[variant]}</div>
      <button
        onClick={() => setVariant(variant === 'A' ? 'B' : variant === 'B' ? 'C' : 'A')}
        style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', padding: '4px' }}
      >
        →
      </button>
    </div>
  )
}
