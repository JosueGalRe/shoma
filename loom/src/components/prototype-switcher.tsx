import { useEffect, useCallback } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const VARIANTS = ['A', 'B', 'C'] as const
const VARIANT_LABELS: Record<string, string> = {
  A: 'Golden Grid',
  B: 'Horizontal Cards',
  C: 'Minimal Dark',
}

export function PrototypeSwitcher() {
  const search = useSearch({ from: '/connected/lobby' })
  const navigate = useNavigate({ from: '/connected/lobby' })

  const currentVariant = (search as Record<string, unknown>).variant as string | undefined ?? 'A'
  const currentIndex = VARIANTS.indexOf(currentVariant as typeof VARIANTS[number])

  const cycle = useCallback(
    (direction: number) => {
      const nextIndex = (currentIndex + direction + VARIANTS.length) % VARIANTS.length
      const nextVariant = VARIANTS[nextIndex]
      void navigate({ search: { ...(search as Record<string, unknown>), variant: nextVariant } })
    },
    [currentIndex, navigate, search],
  )

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLElement && (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.isContentEditable)) {
        return
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        cycle(-1)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        cycle(1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cycle])

  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div className="fixed bottom-20 left-1/2 z-[200] -translate-x-1/2 flex items-center gap-2 rounded-full border border-primary/40 bg-background/90 px-4 py-2 shadow-lg backdrop-blur-md">
      <button
        type="button"
        onClick={() => cycle(-1)}
        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-primary/10 transition-colors"
        aria-label="Previous variant"
      >
        <ChevronLeft className="size-4 text-primary" />
      </button>

      <div className="flex flex-col items-center px-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
          {currentVariant} — {VARIANT_LABELS[currentVariant]}
        </span>
        <span className="text-[8px] text-muted">Use ← → to switch</span>
      </div>

      <button
        type="button"
        onClick={() => cycle(1)}
        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-primary/10 transition-colors"
        aria-label="Next variant"
      >
        <ChevronRight className="size-4 text-primary" />
      </button>
    </div>
  )
}
