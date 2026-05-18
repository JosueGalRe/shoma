import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'

export type Variant = 'A' | 'B' | 'C'

interface PrototypeSwitcherProps {
  currentVariant: Variant
}

export function PrototypeSwitcher({ currentVariant }: PrototypeSwitcherProps) {
  const navigate = useNavigate()
  const variants: Variant[] = ['A', 'B', 'C']
  const currentIndex = variants.indexOf(currentVariant)

  const handlePrevious = () => {
    const prevIndex = (currentIndex - 1 + variants.length) % variants.length
    navigate({ to: '.', search: { variant: variants[prevIndex] } })
  }

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % variants.length
    navigate({ to: '.', search: { variant: variants[nextIndex] } })
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      if (e.key === 'ArrowLeft') {
        handlePrevious()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, handleNext, handlePrevious])

  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-4 rounded-full bg-surface border border-border-gold/50 p-2 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        <button 
          onClick={handlePrevious}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-primary/20 text-primary transition-colors"
          aria-label="Previous variant"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        
        <div className="flex flex-col items-center justify-center min-w-[120px]">
          <span className="text-xs text-text-muted font-medium uppercase tracking-wider">Variant</span>
          <span className="text-lg font-bold text-text">{currentVariant}</span>
        </div>
        
        <button 
          onClick={handleNext}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-primary/20 text-primary transition-colors"
          aria-label="Next variant"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  )
}
