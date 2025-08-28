import type { TmdbMovie, TmdbResponse } from '../types/tmdb'

export const searchTmdb = async (q: string): Promise<TmdbMovie[]> => {
  if (!q.trim()) return []

  const res = await fetch(`/api/tmdb/search/movie?query=${encodeURIComponent(q)}`)
  if (!res.ok) throw new Error('TMDB proxy failed')

  const data: TmdbResponse = await res.json()

  data.results.sort((a, b) => b.popularity - a.popularity)

  return data.results
}

export const tmdbImage = (path?: string | null, size: 'w200' | 'w300' | 'w500' = 'w300') => {
  if (!path) return ''
  const p = path.startsWith('/') ? path : `/${path}`
  return `https://image.tmdb.org/t/p/${size}${p}`
}
