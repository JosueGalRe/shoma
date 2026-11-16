import { describe, expect, it } from 'vitest'

import { parseChampionList } from './parsers'

const image = { full: 'Belveth.png', group: 'champion', h: 48, sprite: 'champion0.png', w: 48, x: 0, y: 0 }

describe('parseChampionList', () => {
  it('keeps a champion without a resource', () => {
    const belveth = { id: 'Belveth', image, key: '200', name: "Bel'Veth", partype: '', stats: {}, tags: [], title: 'x' }

    expect(parseChampionList({ data: { Belveth: belveth } })).toMatchObject([{ id: 200, name: "Bel'Veth", partype: '' }])
  })
})
