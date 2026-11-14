// The Riot ID the two fields spell, or null while either part is missing. A whole "name#tag" typed in the first one works
// Too, as does a tag typed with its "#"
export function getRiotId(gameName: string, tagLine: string): string | null {
  const [name = '', tagInName = ''] = gameName.split('#')
  const tag = tagLine.trim().replace(/^#/u, '') || tagInName.trim()

  return name.trim() && tag ? `${name.trim()}#${tag}` : null
}
