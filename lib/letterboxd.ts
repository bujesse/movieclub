const LETTERBOXD_HOST = 'letterboxd.com'

export function normalizeLetterboxdPath(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''

  try {
    const url = new URL(trimmed)
    const hostname = url.hostname.replace(/^www\./i, '').toLowerCase()
    if (hostname !== LETTERBOXD_HOST) {
      throw new Error('Only letterboxd.com URLs are supported')
    }
    return url.pathname.replace(/^\/+/, '').replace(/\/+$/, '')
  } catch {
    return trimmed.replace(/^https?:\/\/(www\.)?letterboxd\.com\//i, '').replace(/^\/+/, '').replace(/\/+$/, '')
  }
}
