import { useNavigate, useSearch } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui'

const VARIANTS = ['A', 'B', 'C'] as const

type Variant = (typeof VARIANTS)[number]

function isVariant(value: string | undefined): value is Variant {
  return typeof value === 'string' && VARIANTS.some((v) => {
    return v === value
  })
}

export function PrototypeSwitcher() {
  const navigate = useNavigate({ from: '/' })
  const search = useSearch({ from: '/' })
  
  // Default to A if not specified or invalid
  const currentVariant: Variant = isVariant(search.variant) ? search.variant : 'A'
  const currentIndex = VARIANTS.indexOf(currentVariant)

  const handlePrev = () => {
    const prevIndex = (currentIndex - 1 + VARIANTS.length) % VARIANTS.length

    void navigate({
      search: (prev) => {
        return { ...prev, variant: VARIANTS[prevIndex] }
      },
    })
  }

  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % VARIANTS.length

    void navigate({
      search: (prev) => {
        return { ...prev, variant: VARIANTS[nextIndex] }
      },
    })
  }

  return (
    <div className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/10 bg-black/80 px-4 py-2 shadow-2xl backdrop-blur-md">
      <span className="text-xs font-mono tracking-widest text-white/50 uppercase">Variant</span>

      <div className="flex items-center gap-2">
        <Button 
          className="size-6 rounded-full text-white hover:bg-white/10" 
          onClick={handlePrev}
          size="icon" 
          variant="ghost" 
        >
          <ChevronLeft className="size-4" />
        </Button>

        <span className="w-4 text-center text-sm font-bold text-white">{currentVariant}</span>

        <Button 
          className="size-6 rounded-full text-white hover:bg-white/10" 
          onClick={handleNext}
          size="icon" 
          variant="ghost" 
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
