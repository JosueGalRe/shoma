import {
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
  type RefObject,
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
} from 'react'

export function useBottomSheetGestures(sheetRef: RefObject<HTMLDivElement | null>, isRendered: boolean, onClose: () => void) {
  const startY = useRef(0)
  const currentY = useRef(0)
  const isDragging = useRef(false)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  const handleDragStart = useCallback(
    (clientY: number) => {
      isDragging.current = true
      startY.current = clientY
      currentY.current = clientY

      if (sheetRef.current) {
        sheetRef.current.style.transition = 'none'
      }
    },
    [sheetRef],
  )

  const handleDragMove = useCallback(
    (clientY: number) => {
      if (!isDragging.current) {
        return
      }

      currentY.current = clientY

      const deltaY = currentY.current - startY.current

      // Only allow swiping down
      if (deltaY > 0 && sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${deltaY}px)`
      }
    },
    [sheetRef],
  )

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
  }, [sheetRef])

  const onDocumentDragMove = useEffectEvent((clientY: number) => {
    handleDragMove(clientY)
  })

  const onDocumentDragEnd = useEffectEvent(() => {
    handleDragEnd()
  })

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

  return { handleMouseDown, handleTouchEnd, handleTouchMove, handleTouchStart }
}
