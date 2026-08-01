export function formatUpdateDate(date: string | undefined): string | null {
  if (!date) {
    return null
  }

  const parsed = new Date(date)

  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  // eslint-disable-next-line react-doctor/no-locale-format-in-render -- Tauri desktop app, there is no SSR hydration to mismatch
  return parsed.toLocaleDateString()
}
