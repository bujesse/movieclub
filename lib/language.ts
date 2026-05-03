const languageDisplayNames =
  typeof Intl !== 'undefined' && typeof Intl.DisplayNames !== 'undefined'
    ? new Intl.DisplayNames(['en'], { type: 'language' })
    : null

const LANGUAGE_NAME_ALIASES: Record<string, string> = {
  cn: 'Chinese',
  zh: 'Chinese',
}

export function formatLanguageLabel(code: string | null | undefined) {
  if (!code) return null

  const normalized = code.toLowerCase()
  const baseCode = normalized.split('-')[0]
  const displayName =
    LANGUAGE_NAME_ALIASES[normalized] ??
    LANGUAGE_NAME_ALIASES[baseCode] ??
    languageDisplayNames?.of(baseCode)

  if (displayName) return displayName
  return code.toUpperCase()
}
