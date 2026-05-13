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
  const isDragging = useRef(false)

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
      const timer = setTimeout(() => setIsRendered(false), 200)
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
  const handleDragStart = useCallback((clientY: number) => {
    isDragging.current = true
    startY.current = clientY
    currentY.current = clientY
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'none'
    }
  }, [])

  const handleDragMove = useCallback((clientY: number) => {
    if (!isDragging.current) return
    currentY.current = clientY
    const deltaY = currentY.current - startY.current
    
    // Only allow swiping down
    if (deltaY > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${deltaY}px)`
    }
  }, [])

  const handleDragEnd = useCallback(() => {
    if (!isDragging.current) return
    isDragging.current = false
    const deltaY = currentY.current - startY.current
    
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 200ms ease-out'
      
      // If swiped down more than 100px, close it
      if (deltaY > 100) {
        onClose()
      } else {
        // Otherwise snap back
        sheetRef.current.style.transform = 'translateY(0)'
      }
    }
  }, [onClose])

  // Touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => handleDragStart(e.touches[0].clientY), [handleDragStart])
  const handleTouchMove = useCallback((e: React.TouchEvent) => handleDragMove(e.touches[0].clientY), [handleDragMove])
  const handleTouchEnd = useCallback(() => handleDragEnd(), [handleDragEnd])

  // Mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => handleDragStart(e.clientY), [handleDragStart])
  
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientY)
    const onMouseUp = () => handleDragEnd()

    if (isRendered) {
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [isRendered, handleDragMove, handleDragEnd])

  if (!isRendered) return null

  const content = (
    <>
      {/* Scrim */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-200 ease-out ${
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
          tall ? 'h-[90vh]' : ''
        } max-h-[90vh] flex flex-col pb-[env(safe-area-inset-bottom)] transition-transform duration-200 ease-out ${
          isAnimating ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Drag Handle */}
        <div 
          className="shrink-0 touch-pan-y cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          <div className="w-12 h-1.5 bg-lol-text-muted/50 rounded-full mx-auto mt-3 mb-4" />
        </div>

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
          <div className="flex flex-1 min-h-0 flex-col touch-pan-y">
            {children}
          </div>
        ) : (
          <div className="px-6 pb-6 overflow-y-auto overscroll-contain touch-pan-y">
            {children}
          </div>
        )}
      </div>
    </>
  )

  // Use portal to render at the end of document body to avoid z-index issues
  return typeof document !== 'undefined' ? createPortal(content, document.body) : null
}
