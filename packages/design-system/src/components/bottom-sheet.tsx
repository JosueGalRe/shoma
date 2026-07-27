import {
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from 'react'

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
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const onCloseEvent = useEffectEvent(onClose)

  /* eslint-disable react-doctor/no-adjust-state-on-prop-change, react-doctor/no-cascading-set-state -- Controlled overlay animation state must sync to isOpen. */
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

      const timer = setTimeout(() => {
        setIsRendered(false)
      }, 200)

      return () => {
        clearTimeout(timer)
      }
    }

    return undefined
  }, [isOpen])
  /* eslint-enable react-doctor/no-adjust-state-on-prop-change, react-doctor/no-cascading-set-state */

  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus()
      previousFocusRef.current = null
    }

    return undefined
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

    return undefined
  }, [isOpen])

  // Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCloseEvent()
      }
    }

    globalThis.addEventListener('keydown', handleKeyDown)

    return () => {
      globalThis.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // Focus trap
  useEffect(() => {
    if (isOpen && sheetRef.current) {
      const getFocusableElements = () => {
        return [
          ...(sheetRef.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ) ?? []),
        ].filter((element) => {
          const rect = element.getBoundingClientRect()
          const style = globalThis.getComputedStyle(element)

          return (
            element.getAttribute('aria-disabled') !== 'true' &&
            rect.width > 0 &&
            rect.height > 0 &&
            style.display !== 'none' &&
            style.visibility !== 'hidden'
          )
        })
      }

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') {
          return
        }

        const focusableElements = getFocusableElements()
        const firstElement = focusableElements[0] ?? sheetRef.current
        const lastElement = focusableElements[focusableElements.length - 1] ?? sheetRef.current

        if (!sheetRef.current?.contains(document.activeElement)) {
          firstElement?.focus()
          e.preventDefault()

          return
        }

        if (focusableElements.length === 0) {
          sheetRef.current?.focus()
          e.preventDefault()

          return
        }

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

      globalThis.addEventListener('keydown', handleTabKey)

      // Focus first element or sheet itself
      const focusableElements = getFocusableElements()

      if (focusableElements[0]) {
        focusableElements[0].focus()
      } else {
        sheetRef.current.focus()
      }

      return () => {
        globalThis.removeEventListener('keydown', handleTabKey)
      }
    }

    return undefined
  }, [isOpen, isRendered])

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
    if (!isDragging.current) {
      return
    }

    currentY.current = clientY

    const deltaY = currentY.current - startY.current

    // Only allow swiping down
    if (deltaY > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${deltaY}px)`
    }
  }, [])

  const handleDragEnd = useCallback(() => {
    if (!isDragging.current) {
      return
    }

    isDragging.current = false

    const deltaY = currentY.current - startY.current

    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 200ms ease-out'

      // If swiped down more than 100px, close it
      if (deltaY > 100) {
        onCloseRef.current()
      } else {
        // Otherwise snap back
        sheetRef.current.style.transform = 'translateY(0)'
      }
    }
  }, [])

  const onDocumentDragMove = useEffectEvent((clientY: number) => {
    handleDragMove(clientY)
  })

  const onDocumentDragEnd = useEffectEvent(() => {
    handleDragEnd()
  })

  // Touch events
  const handleTouchStart = useCallback(
    (e: ReactTouchEvent) => {
      return handleDragStart(e.touches[0].clientY)
    },
    [handleDragStart],
  )
  const handleTouchMove = useCallback(
    (e: ReactTouchEvent) => {
      return handleDragMove(e.touches[0].clientY)
    },
    [handleDragMove],
  )
  const handleTouchEnd = useCallback(() => {
    return handleDragEnd()
  }, [handleDragEnd])

  // Mouse events
  const handleMouseDown = useCallback(
    (e: ReactMouseEvent) => {
      return handleDragStart(e.clientY)
    },
    [handleDragStart],
  )

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      return onDocumentDragMove(e.clientY)
    }

    const onMouseUp = () => {
      return onDocumentDragEnd()
    }

    if (isRendered) {
      globalThis.addEventListener('mousemove', onMouseMove)
      globalThis.addEventListener('mouseup', onMouseUp)
    }

    return () => {
      globalThis.removeEventListener('mousemove', onMouseMove)
      globalThis.removeEventListener('mouseup', onMouseUp)
    }
  }, [isRendered])

  if (!isRendered) {
    return null
  }

  const content = (
    <>
      {/* Scrim */}
      <div
        className={`bg-background/60 fixed inset-0 z-40 backdrop-blur-sm transition-opacity duration-200 ease-out ${
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
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
        className={`bg-surface fixed right-0 bottom-0 left-0 z-50 m-0 w-full max-w-none rounded-t-2xl border-0 p-0 ${
          tall ? 'h-[90vh]' : ''
        } flex max-h-[90vh] flex-col pb-[env(safe-area-inset-bottom)] transition-transform duration-200 ease-out ${
          isAnimating ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Drag Handle */}
        <button
          type="button"
          aria-label="Drag bottom sheet"
          className="shrink-0 cursor-grab touch-pan-y appearance-none border-0 bg-transparent p-0 active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          <div className="bg-primary mx-auto mt-3 mb-4 h-1.5 w-12 rounded-full opacity-50" />
        </button>

        {/* Header */}
        {title && (
          <div className="shrink-0 px-6 pb-4">
            <h2 id="bottom-sheet-title" className="text-foreground text-lg font-semibold">
              {title}
            </h2>
          </div>
        )}

        {/* Content */}
        {flush ? (
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        ) : (
          <div className="overflow-y-auto overscroll-contain px-6 pb-6">{children}</div>
        )}
      </div>
    </>
  )

  // Use portal to render at the end of document body to avoid z-index issues
  return typeof document !== 'undefined' ? createPortal(content, document.body) : null
}
