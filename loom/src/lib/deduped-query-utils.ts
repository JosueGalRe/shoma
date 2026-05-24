import type { DedupedFetcher } from './deduped-query-types'

export function createDedupedQuery<T>(fetcher: DedupedFetcher<T>): DedupedFetcher<T> {
  let promise: Promise<T> | null = null

  return () => {
    if (promise) return promise

    promise = fetcher().finally(() => {
      promise = null
    })

    return promise
  }
}
