import { describe, expect, test } from 'vitest'

import { createDedupedQuery } from './deduped-query'

describe('createDedupedQuery', () => {
  test('dedupes concurrent calls and resets after resolution', async () => {
    let invocationCount = 0
    const dedupedFetch = createDedupedQuery(async () => {
      invocationCount += 1
      await Promise.resolve()
      return `result-${invocationCount}`
    })

    const results = await Promise.all([dedupedFetch(), dedupedFetch(), dedupedFetch(), dedupedFetch(), dedupedFetch()])

    expect(invocationCount).toBe(1)
    expect(results).toEqual(['result-1', 'result-1', 'result-1', 'result-1', 'result-1'])

    await expect(dedupedFetch()).resolves.toBe('result-2')
    expect(invocationCount).toBe(2)
  })
})
