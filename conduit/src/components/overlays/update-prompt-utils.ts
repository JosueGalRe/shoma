export function formatUpdateDate(date: string | undefined): string | null {
  if (!date) {
    return null
  }

  const parsed = new Date(date)

  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed.toLocaleDateString()
}
