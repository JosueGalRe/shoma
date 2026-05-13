export function createDedupedQuery<T>(fetcher: () => Promise<T>): () => Promise<T> {
  let promise: Promise<T> | null = null

  return () => {
    if (promise) return promise

    promise = fetcher().finally(() => {
      promise = null
    })

    return promise
  }
}
