function normalizeLcuSegment(segment: string): string | number {
  const numericSegment = Number(segment)

  return Number.isInteger(numericSegment) && String(numericSegment) === segment ? numericSegment : segment
}

function normalizeLcuDomain(segment: string): string {
  return segment.startsWith('lol-') ? segment.slice(4) : segment
}

export function lcuQueryKey(path: string): readonly unknown[] {
  const segments = path.split('/').filter(Boolean)
  const [rawDomain, , ...resourceSegments] = segments
  const domain = rawDomain ? normalizeLcuDomain(rawDomain) : 'unknown'

  if (domain === 'lobby' && resourceSegments[0] === 'lobby') {
    const [, ...subResource] = resourceSegments

    return ['lcu', domain, 'session', ...subResource] as const
  }

  if (domain === 'summoner') {
    const [, summonerId] = resourceSegments

    if (resourceSegments[0] === 'summoners' && summonerId) {
      return ['lcu', domain, normalizeLcuSegment(summonerId)] as const
    }

    if (resourceSegments[0] === 'current-summoner') {
      return ['lcu', domain, 'current', ...resourceSegments.slice(1).map(normalizeLcuSegment)] as const
    }
  }

  return ['lcu', domain, ...resourceSegments.map(normalizeLcuSegment)] as const
}
