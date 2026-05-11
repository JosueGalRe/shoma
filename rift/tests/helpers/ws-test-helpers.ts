function parseUnknownFrame(raw: unknown): unknown[] {
  if (!Array.isArray(raw)) {
    throw new Error('Expected websocket frame array.')
  }

  return raw
}

export function createFrameQueue(ws: WebSocket) {
  const queue: unknown[][] = []
  const waiters: Array<(frame: unknown[]) => void> = []

  ws.addEventListener('message', (event) => {
    const parsed: unknown = JSON.parse(String(event.data))
    const frame = parseUnknownFrame(parsed)
    const waiter = waiters.shift()
    if (waiter) {
      waiter(frame)
      return
    }

    queue.push(frame)
  })

  return {
    nextFrame: () => {
      if (queue.length > 0) {
        const firstFrame = queue.shift()
        if (!firstFrame) {
          throw new Error('Frame queue became empty unexpectedly.')
        }

        return Promise.resolve(firstFrame)
      }

      return new Promise<unknown[]>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Timed out waiting for socket message')), 5000)
        waiters.push((frame) => {
          clearTimeout(timer)
          resolve(frame)
        })
      })
    },
  }
}

export function waitForOpen(ws: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out waiting for socket open')), 5000)

    ws.addEventListener(
      'open',
      () => {
        clearTimeout(timer)
        resolve()
      },
      { once: true },
    )

    ws.addEventListener(
      'error',
      () => {
        clearTimeout(timer)
        reject(new Error('Socket errored before open'))
      },
      { once: true },
    )
  })
}

export function waitForClose(ws: WebSocket): Promise<number> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out waiting for socket close')), 5000)

    ws.addEventListener(
      'close',
      (event) => {
        clearTimeout(timer)
        resolve(event.code)
      },
      { once: true },
    )
  })
}
