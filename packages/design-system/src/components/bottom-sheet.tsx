import { useEffect, useEffectEvent, useRef, useState } from 'react'

import { createPortal } from 'react-dom'

import { bottomSheetStyles } from './bottom-sheet-styles'
import { useBottomSheetFocus } from './use-bottom-sheet-focus'
import { useBottomSheetGestures } from './use-bottom-sheet-gestures'

import type { BottomSheetProps } from './bottom-sheet-types'

export function BottomSheet({ isOpen, onClose, children, title, tall = false, flush = false }: BottomSheetProps) {
  const [isRendered, setIsRendered] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)

  const onCloseEvent = useEffectEvent(onClose)

  const { handleMouseDown, handleTouchEnd, handleTouchMove, handleTouchStart } = useBottomSheetGestures(
    sheetRef,
    isRendered,
    onClose,
  )

  useBottomSheetFocus(isOpen, isRendered, sheetRef)

  const styles = bottomSheetStyles({ isAnimating, tall })

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

  if (!isRendered) {
    return null
  }

  const content = (
    <>
      {/* Scrim */}
      <div className={styles.scrim()} onClick={onClose} aria-hidden="true" />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        aria-labelledby={title ? 'bottom-sheet-title' : undefined}
        className={styles.sheet()}
      >
        {/* Ambient glows */}
        <div
          className={styles.glow({
            class: 'bg-primary -top-16 -left-16 size-[300px] animate-[pulse_4s_ease-in-out_infinite] opacity-25 blur-[80px]',
          })}
          aria-hidden="true"
        />

        <div
          className={styles.glow({
            class: 'bg-accent -right-16 -bottom-16 size-[300px] animate-[pulse_5s_ease-in-out_infinite] opacity-20 blur-[80px]',
          })}
          aria-hidden="true"
        />

        <div
          className={styles.glow({
            class:
              'bg-border-gold -bottom-24 -left-24 size-[250px] animate-[pulse_6s_ease-in-out_infinite] opacity-15 blur-[60px]',
          })}
          aria-hidden="true"
        />

        <div className={styles.layout()}>
          {/* Drag Handle */}
          <button
            type="button"
            aria-label="Drag bottom sheet"
            className={styles.dragHandle()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
          >
            <div className={styles.dragHandleBar()} />
          </button>

          {/* Header */}
          {title && (
            <div className={styles.header()}>
              <h2 id="bottom-sheet-title" className={styles.headerTitle()}>
                {title}
              </h2>
            </div>
          )}

          {/* Content */}
          {flush ? <div className={styles.contentFlush()}>{children}</div> : <div className={styles.content()}>{children}</div>}
        </div>
      </div>
    </>
  )

  // Use portal to render at the end of document body to avoid z-index issues
  return typeof document !== 'undefined' ? createPortal(content, document.body) : null
}
