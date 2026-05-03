function parseLocalDateTimeParts(value: string) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/
  )
  if (!match) return null

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] ?? '0'),
  }
}

export function parseClientLocalDateTimeToUtc(
  value: string,
  timezoneOffsetMinutes: number | null | undefined
) {
  const parts = parseLocalDateTimeParts(value)
  if (!parts || typeof timezoneOffsetMinutes !== 'number' || !Number.isFinite(timezoneOffsetMinutes)) {
    return null
  }
  const offsetMinutes = timezoneOffsetMinutes

  const utcMs =
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) +
    offsetMinutes * 60 * 1000

  const parsed = new Date(utcMs)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}
