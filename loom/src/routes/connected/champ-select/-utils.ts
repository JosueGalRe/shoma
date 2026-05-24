export function translatedErrorMessage(t: (key: string) => string, error: string | null): string | null {
  return error ? t(error) : null
}
