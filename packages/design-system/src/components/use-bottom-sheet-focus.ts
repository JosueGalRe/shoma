import { type RefObject, useEffect, useRef } from 'react'

export function useBottomSheetFocus(isOpen: boolean, isRendered: boolean, sheetRef: RefObject<HTMLDivElement | null>) {
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
  }, [isOpen, isRendered, sheetRef])
}
