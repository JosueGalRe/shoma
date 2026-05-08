import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  tall?: boolean
  flush?: boolean
}

export function BottomSheet({ isOpen, onClose, children, title, tall = false, flush = false }: BottomSheetProps) {
  const [isRendered, setIsRendered] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const currentY = useRef(0)

  // Handle mount/unmount animations
  useEffect(() => {
    if (isOpen) {
      setIsRendered(true)
      // Small delay to ensure DOM is updated before starting animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true)
        })
      })
    } else {
      setIsAnimating(false)
      const timer = setTimeout(() => setIsRendered(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const previousFocusRef = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus()
      previousFocusRef.current = null
    }
  }, [isOpen])

  // Scroll lock
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  // Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Focus trap
  useEffect(() => {
    if (isOpen && sheetRef.current) {
      const focusableElements = sheetRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement?.focus()
            e.preventDefault()
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement?.focus()
            e.preventDefault()
          }
        }
      }

      window.addEventListener('keydown', handleTabKey)
      
      // Focus first element or sheet itself
      if (firstElement) {
        firstElement.focus()
      } else {
        sheetRef.current.focus()
      }

      return () => window.removeEventListener('keydown', handleTabKey)
    }
  }, [isOpen])

  // Swipe gestures
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY
    currentY.current = e.touches[0].clientY
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'none'
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    currentY.current = e.touches[0].clientY
    const deltaY = currentY.current - startY.current
    
    // Only allow swiping down
    if (deltaY > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${deltaY}px)`
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    const deltaY = currentY.current - startY.current
    
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 300ms cubic-bezier(0.32, 0.72, 0, 1)'
      
      // If swiped down more than 100px, close it
      if (deltaY > 100) {
        onClose()
      } else {
        // Otherwise snap back
        sheetRef.current.style.transform = 'translateY(0)'
      }
    }
  }, [onClose])

  if (!isRendered) return null

  const content = (
    <>
      {/* Scrim */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        aria-labelledby={title ? "bottom-sheet-title" : undefined}
        className={`fixed bottom-0 left-0 right-0 bg-lol-navy-900 rounded-t-2xl z-50 ${
          tall ? 'max-h-[90vh] h-[90vh]' : 'max-h-[70vh]'
        } flex flex-col pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isAnimating ? 'translate-y-0' : 'translate-y-full'
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle */}
        <div className="w-12 h-1.5 bg-lol-text-muted/50 rounded-full mx-auto mt-3 mb-4 shrink-0" />

        {/* Header */}
        {title && (
          <div className="px-6 pb-4 shrink-0">
            <h2 id="bottom-sheet-title" className="text-lg font-semibold text-lol-text-primary">
              {title}
            </h2>
          </div>
        )}

        {/* Content */}
        {flush ? (
          <div className="flex flex-1 min-h-0 flex-col">
            {children}
          </div>
        ) : (
          <div className="px-6 pb-6 overflow-y-auto overscroll-contain">
            {children}
          </div>
        )}
      </div>
    </>
  )

  // Use portal to render at the end of document body to avoid z-index issues
  return typeof document !== 'undefined' ? createPortal(content, document.body) : null
}
