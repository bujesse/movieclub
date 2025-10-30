type IncomingMovie = {
  tmdbId: number
  title: string
  originalTitle?: string | null
  originalLanguage?: string | null
  releaseDate?: string | null
  overview?: string | null
  voteAverage?: number | null
  voteCount?: number | null
  posterPath?: string | null
  backdropPath?: string | null
  genres?: number[] | null
}

export function normalizeMovies(movies: IncomingMovie[]) {
  const seen = new Set<number>()
  return movies
    .filter((m) => {
      const id = Number(m.tmdbId)
      if (!Number.isFinite(id) || seen.has(id)) return false
      seen.add(id)
      return true
    })
    .map((m) => {
      const base = {
        tmdbId: Number(m.tmdbId),
        title: m.title,
        originalTitle: m.originalTitle ?? null,
        originalLanguage: m.originalLanguage ?? null,
        releaseDate: m.releaseDate ? new Date(m.releaseDate) : null,
        overview: m.overview ?? null,
        voteAverage: m.voteAverage ?? null,
        voteCount: m.voteCount ?? null,
        posterPath: m.posterPath ?? null,
        backdropPath: m.backdropPath ?? null,
      }
      return Array.isArray(m.genres) ? { ...base, genres: m.genres } : base
    })
}

export function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h ? `${h}h ${m}m` : `${m}m`
}
